/* =====================================================================
   EQUIPAMENTOS, ORDENS DE SERVIÇO, ADMINISTRAÇÃO, CONTA
   ===================================================================== */
/* ---------- equipamentos ---------- */
function validBasic(X){
  if(!String(X.nome||'').trim() || !String(X.marca||'').trim()){ toast('Preenche pelo menos o nome do cliente e a marca.'); return false; }
  return true;
}
async function doSaveEq(){
  if(!validBasic(E)) return null;
  var wasNew = !E.currentId;
  await ensureClient(E);
  var id = await guarded(function(){ return saveDoc('equipamentos','EQ',E,EQ_FLD); },'Não foi possível guardar o equipamento. Tenta outra vez.');
  if(!id) return null;
  syncAll(); renderLists();
  toast(wasNew ? 'Equipamento registado: '+id+'.' : 'Alterações guardadas em '+id+'.');
  return id;
}
var CLIENT_KEYS = ['clienteId','nome','contacto','email','endereco','nif'];
var EQUIP_KEYS = ['marca','modelo','serie','capacidade'];
$('btnEqSave').addEventListener('click',function(){ doSaveEq(); });
$('btnEqNew').addEventListener('click',function(){ E=blankEq(); syncAll(); renderLists(); });
$('btnEqOs').addEventListener('click', async function(){
  var id = await doSaveEq(); if(!id) return;
  O = blankOs(); copy(O,E,['code'].concat(EQUIP_KEYS,CLIENT_KEYS,['avaria','acessorios','estadoFisico'])); O.equipId = id;
  syncAll(); renderLists(); showView('os');
});
$('btnEqRep').addEventListener('click', async function(){
  var id = await doSaveEq(); if(!id) return;
  S = blank(E.code); copy(S,E,EQUIP_KEYS.concat(CLIENT_KEYS));
  syncAll(); renderLists(); showView('rel'); tab('form');
});
$('eqList').addEventListener('click',function(e){
  var b = e.target.closest('.item'); if(!b) return;
  var r = D.equipamentos.filter(function(x){ return x.number===b.dataset.id; })[0]; if(!r) return;
  E = blankEq(); copy(E,r,EQ_FLD); E.currentId=r.number; E.number=r.number; E.seq=r.seq; E.createdAt=r.createdAt||null; E.autor=r.autor||'';
  syncAll(); renderLists(); window.scrollTo({top:0,behavior:'smooth'});
});

/* ---------- ordens de serviço ---------- */
async function doSaveOs(){
  if(!validBasic(O)) return null;
  var wasNew = !O.currentId;
  await ensureClient(O);
  var id = await guarded(function(){ return saveDoc('ordens','OS',O,OS_FLD); },'Não foi possível guardar a ordem de serviço. Tenta outra vez.');
  if(!id) return null;
  syncAll(); renderLists();
  toast(wasNew ? 'Ordem de serviço criada: '+id+'.' : 'Alterações guardadas em '+id+'.');
  return id;
}
$('btnOsSave').addEventListener('click',function(){ doSaveOs(); });
$('btnOsNew').addEventListener('click',function(){ O=blankOs(); syncAll(); renderLists(); });
$('btnOsRep').addEventListener('click', async function(){
  var id = await doSaveOs(); if(!id) return;
  S = blank(O.code); copy(S,O,EQUIP_KEYS.concat(CLIENT_KEYS)); S.os = id;
  syncAll(); renderLists(); showView('rel'); tab('form');
});
$('btnOsPdf').addEventListener('click', async function(){
  if(busy) return;
  var id = await doSaveOs(); if(!id) return;
  await makeAndDeliver(function(logo,sig){ return buildOsPdf(O, logo, sig); }, id+'.pdf', O.assinatura);
});
$('osList').addEventListener('click',function(e){
  var b = e.target.closest('.item'); if(!b) return;
  var r = D.ordens.filter(function(x){ return x.number===b.dataset.id; })[0]; if(!r) return;
  O = blankOs(); copy(O,r,OS_FLD); O.currentId=r.number; O.number=r.number; O.seq=r.seq; O.createdAt=r.createdAt||null; O.autor=r.autor||'';
  syncAll(); renderLists(); window.scrollTo({top:0,behavior:'smooth'});
});

/* ---------- administração: utilizadores ---------- */
var usersSig = '';
function renderUsers(){
  var box = $('userList'); if(!box) return;
  var sig = JSON.stringify(D.users.map(function(u){ return [u.username,u.name,u.role,u.active]; })) + (ME?ME.username:'');
  if(sig===usersSig && box.innerHTML) return;
  usersSig = sig;
  if(!D.users.length){ box.innerHTML='<div class="empty">Sem utilizadores.</div>'; return; }
  box.innerHTML = D.users.map(function(u){
    var me = ME && ME.username===u.username;
    return '<div class="urow" data-u="'+esc(u.username)+'"><div class="uinfo"><b>'+esc(u.name)+(me?' (tu)':'')+'</b><span>'+esc(u.username)+' · '+(u.active===false?'Desactivado':'Activo')+'</span></div>'+
      '<div class="uact"><select data-act="role" aria-label="Perfil de '+esc(u.name)+'"><option value="tecnico"'+(u.role!=='admin'?' selected':'')+'>Técnico</option><option value="admin"'+(u.role==='admin'?' selected':'')+'>Administrador</option></select>'+
      '<button type="button" class="btn sm" data-act="toggle">'+(u.active===false?'Activar':'Desactivar')+'</button></div>'+
      '<details><summary>Repor senha</summary><div class="rp"><input type="password" data-pw aria-label="Nova senha de '+esc(u.name)+'" placeholder="Nova senha (mínimo 6)" autocomplete="new-password"><button type="button" class="btn sm" data-act="reset">Guardar senha</button></div></details></div>';
  }).join('');
}
$('userList').addEventListener('click', async function(e){
  var btn = e.target.closest('[data-act]'); if(!btn || btn.tagName==='SELECT') return;
  var row = btn.closest('.urow'), u = userOf(row.dataset.u); if(!u) return;
  if(btn.dataset.act==='toggle'){
    var activating = u.active===false;
    if(!activating && ME && u.username===ME.username){ toast('Não podes desactivar a tua própria conta.'); return; }
    if(!activating && u.role==='admin' && activeAdmins(u.username)===0){ toast('Tem de existir pelo menos um administrador activo.'); return; }
    try{ await putDoc('users', Object.assign({},u,{active:activating})); toast(activating?'Utilizador activado.':'Utilizador desactivado.'); }
    catch(err){ toast('Não foi possível actualizar o utilizador.'); }
  }else if(btn.dataset.act==='reset'){
    var inp = row.querySelector('[data-pw]'), pw = inp.value;
    if(pw.length<6){ toast('A senha deve ter pelo menos 6 caracteres.'); return; }
    try{
      await setUserPassword(u,pw);
      inp.value=''; toast('Senha de '+u.name+' actualizada.');
    }catch(err){ toast('Não foi possível repor a senha.'); }
  }
});
$('userList').addEventListener('change', async function(e){
  var sel = e.target; if(!sel.matches('select[data-act="role"]')) return;
  var u = userOf(sel.closest('.urow').dataset.u); if(!u) return;
  if(u.role==='admin' && sel.value!=='admin' && activeAdmins(u.username)===0){
    toast('Tem de existir pelo menos um administrador activo.'); usersSig=''; renderUsers(); return;
  }
  try{
    var nu = Object.assign({},u,{role:sel.value}); await putDoc('users',nu);
    if(ME && ME.username===u.username){ ME = nu; applyWho(); if(!isAdmin()) showView('rel'); }
    toast('Perfil actualizado.');
  }catch(err){ toast('Não foi possível actualizar o perfil.'); }
});
$('newUserForm').addEventListener('submit', async function(e){
  e.preventDefault();
  var name = $('nuName').value.trim(), un = $('nuUser').value.trim().toLowerCase(), role = $('nuRole').value, pw = $('nuPass').value, err = $('nuErr');
  err.textContent = '';
  if(!name){ err.textContent='Escreve o nome.'; return; }
  var bad = loginInvalid(un); if(bad){ err.textContent=bad; return; }
  if(userOf(un)){ err.textContent='Esse utilizador já existe.'; return; }
  if(pw.length<6){ err.textContent='A senha deve ter pelo menos 6 caracteres.'; return; }
  try{
    await createUser(clip(name,60),un,role,pw);
    $('nuName').value=''; $('nuUser').value=''; $('nuPass').value=''; $('nuRole').value='tecnico';
    toast('Utilizador criado: '+name+'. Dá-lhe o utilizador e a senha inicial.');
  }catch(x){ err.textContent='Não foi possível criar o utilizador.'; }
});

/* ---------- a minha conta ---------- */
function renderConta(){
  if(!ME) return;
  $('contaInfo').textContent = ME.name+' · utilizador '+ME.username+' · '+(isAdmin()?'Administrador':'Técnico');
}
$('pwForm').addEventListener('submit', async function(e){
  e.preventDefault();
  var old=$('pwOld').value, nw=$('pwNew').value, nw2=$('pwNew2').value, err=$('pwErr'); err.textContent='';
  if(nw.length<6){ err.textContent='A nova senha deve ter pelo menos 6 caracteres.'; return; }
  if(nw!==nw2){ err.textContent='As duas senhas novas não coincidem.'; return; }
  try{
    await changeOwnPassword(old,nw);
    $('pwOld').value=''; $('pwNew').value=''; $('pwNew2').value=''; toast('Senha alterada.');
  }catch(x){ err.textContent = x && x.wrong ? 'A senha actual está incorrecta.' : 'Não foi possível alterar a senha.'; }
});

/* ---------- exportar e importar ---------- */
function csvCell(v){
  var s = String(v==null?'':v).replace(/\r?\n/g,' | ');
  if(/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g,'""') + '"';
}
function chrono(col){ return D[col].slice().sort(function(a,b){ return String(a.createdAt||a.savedAt||'').localeCompare(String(b.createdAt||b.savedAt||'')); }); }
var CSVD = {
  clientes:{file:'clientes', head:['Número','Nome','Contacto','E-mail','NIF','Endereço','Observações','Registado por','Guardado em'],
    row:function(r){ return [r.number,r.nome,r.contacto,r.email,r.nif,r.endereco,r.observacoes,userName(r.autor),r.savedAt]; }},
  reports:{file:'relatorios', head:['Número','Data','Tipo','Marca','Modelo','Nº de série','Capacidade','Cliente','Contacto','E-mail','Endereço','NIF','Ordem de serviço','Componentes','Serviços executados','Valor (Kz)','Conclusão','Registado por','Guardado em'],
    row:function(r){ return [r.number,fmtDate(r.date),r.tipo||typeName(r.code),r.marca,r.modelo,r.serie,r.capacidade,r.nome,r.contacto,r.email,r.endereco,r.nif,r.os,r.componentes,r.servicos,kzNum(r.valor),r.conclusao,userName(r.autor),r.savedAt]; }},
  equipamentos:{file:'equipamentos', head:['Número','Data de entrada','Estado','Tipo','Marca','Modelo','Nº de série','Capacidade','Cliente','Contacto','E-mail','Endereço','NIF','Avaria reportada','Acessórios','Estado físico','Observações','Registado por','Guardado em'],
    row:function(r){ return [r.number,fmtDate(r.date),r.estado,typeName(r.code),r.marca,r.modelo,r.serie,r.capacidade,r.nome,r.contacto,r.email,r.endereco,r.nif,r.avaria,r.acessorios,r.estadoFisico,r.observacoes,userName(r.autor),r.savedAt]; }},
  ordens:{file:'ordens-de-servico', head:['Número','Data','Estado','Prioridade','Atendimento','Técnico','Equipamento registado','Tipo','Marca','Modelo','Nº de série','Cliente','Contacto','E-mail','Endereço','NIF','Avaria reportada','Serviço a executar','Orçamento (Kz)','Sinal (Kz)','Data prevista','Relatório','Guardado em'],
    row:function(r){ return [r.number,fmtDate(r.date),r.estado,r.prioridade,r.atendimento,userName(r.tecnico),r.equipId,typeName(r.code),r.marca,r.modelo,r.serie,r.nome,r.contacto,r.email,r.endereco,r.nif,r.avaria,r.servico,kzNum(r.orcamento),kzNum(r.sinal),fmtDate(r.dataPrevista),r.relatorio,r.savedAt]; }}
};
async function exportFile(kind){
  try{
    var blob, name;
    if(kind==='json'){
      var total = D.reports.length + D.equipamentos.length + D.ordens.length + D.clientes.length;
      if(!total){ toast('Ainda não há registos para exportar.'); return; }
      blob = new Blob([JSON.stringify({app:'amatec-oficina', versao:3, exportadoEm:new Date().toISOString(), tipos:D.tipos, relatorios:chrono('reports'), equipamentos:chrono('equipamentos'), ordens:chrono('ordens'), clientes:chrono('clientes')},null,1)],{type:'application/json'});
      name = 'amatec-copia-'+today()+'.json';
    }else{
      var def = CSVD[kind];
      if(!D[kind].length){ toast('Ainda não há registos para exportar.'); return; }
      var rows = chrono(kind).map(function(r){ return def.row(r).map(csvCell).join(';'); });
      blob = new Blob(['﻿'+[def.head.map(csvCell).join(';')].concat(rows).join('\r\n')],{type:'text/csv;charset=utf-8'});
      name = def.file+'-amatec-'+today()+'.csv';
    }
    await deliver(blob,name);
    toast('Ficheiro pronto: '+name);
  }catch(e){ if(!(e && e.code==='declined')) toast('Não foi possível exportar. Tenta outra vez.'); }
}
$('btnCsvRep').addEventListener('click',function(){ exportFile('reports'); });
$('btnCsvEq').addEventListener('click',function(){ exportFile('equipamentos'); });
$('btnCsvOs').addEventListener('click',function(){ exportFile('ordens'); });
$('btnCsvCli').addEventListener('click',function(){ exportFile('clientes'); });
$('btnJson').addEventListener('click',function(){ exportFile('json'); });
$('btnImport').addEventListener('click',function(){ $('fileImport').click(); });
$('fileImport').addEventListener('change', async function(e){
  var f = e.target.files && e.target.files[0]; e.target.value=''; if(!f) return;
  if(f.size>8*1024*1024){ toast('O ficheiro é demasiado grande.'); return; }
  busy=true; renderHeader();
  var ok=0, skip=0, bad=0, bumps={};
  try{
    var j = JSON.parse(await f.text());
    var inc = Array.isArray(j) ? {reports:j} : {reports:j&&j.relatorios, equipamentos:j&&j.equipamentos, ordens:j&&j.ordens, clientes:j&&j.clientes};
    if(!Array.isArray(inc.reports) && !Array.isArray(inc.equipamentos) && !Array.isArray(inc.ordens) && !Array.isArray(inc.clientes)) throw new Error('formato');
    var tl = (j && Array.isArray(j.tipos)) ? j.tipos : [];
    for(var t of tl){
      if(t && /^[A-Z0-9]{2,4}$/.test(String(t.code)) && t.name && !typeOf(t.code)) await putDoc('tipos',{code:t.code,name:clip(t.name,60)});
    }
    for(var col of ['clientes','reports','equipamentos','ordens']){
      var arr = inc[col]; if(!Array.isArray(arr)) continue;
      var seen = {}; D[col].forEach(function(r){ seen[r.number]=1; });
      for(var r of arr){
        var m = r && typeof r.number==='string' && COL[col].re.exec(r.number);
        if(!m){ bad++; continue; }
        if(seen[r.number]){ skip++; continue; }
        var rec = {number:r.number, seq:parseInt(m[2],10), createdAt:clip(r.createdAt||r.savedAt,40),
          savedAt:clip(r.savedAt||r.createdAt||new Date().toISOString(),40), autor:clip(r.autor,40)};
        COL[col].fields.forEach(function(k){ rec[k]=clip(r[k],5000); });
        if(col==='reports'){ rec.code = m[1]; rec.tipo = clip(r.tipo,60) || typeName(m[1]); }
        if(rec.code && /^[A-Z0-9]{2,4}$/.test(rec.code) && !typeOf(rec.code)) await putDoc('tipos',{code:rec.code,name:col==='reports'?rec.tipo:rec.code});
        await putDoc(col,rec); seen[r.number]=1; ok++;
        if(db && db.bump) bumps[m[1]] = Math.max(bumps[m[1]]||0, parseInt(m[2],10));
      }
    }
    if(db && db.bump){ for(var px in bumps) await db.bump(px,bumps[px]); }
    syncAll(); renderLists();
    toast('Importados '+ok+' registos'+(skip?', '+skip+' já existiam':'')+(bad?', '+bad+' ignorados':'')+'.');
  }catch(err){
    toast(err && err.code==='quota_exceeded' ? 'A base de dados está cheia.' : 'Não foi possível importar. Escolhe uma cópia JSON exportada daqui.');
  }finally{ busy=false; renderHeader(); }
});
