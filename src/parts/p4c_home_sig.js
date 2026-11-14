/* =====================================================================
   INÍCIO, ASSINATURA NO ECRÃ E ELIMINAR
   ===================================================================== */

/* ---------- página inicial ---------- */
var FECHADAS = ['Concluída','Entregue','Cancelada'];
function homeRow(type,r,mid,right){
  return '<button type="button" class="item" data-go="'+type+':'+esc(r.number)+'"><b>'+esc(r.number)+'</b><span class="m">'+esc(mid)+'</span>'+right+'</button>';
}
function renderHome(){
  if(!ME) return;
  var h = new Date().getHours(), sd = h<12 ? 'Bom dia' : (h<19 ? 'Boa tarde' : 'Boa noite');
  $('homeHello').textContent = sd+', '+String(ME.name||'').split(' ')[0];
  $('homeSub').textContent = 'Resumo da oficina. Toca num cartão ou numa linha para abrir.';
  var abertas = D.ordens.filter(function(o){ return FECHADAS.indexOf(o.estado)<0; });
  var naOficina = D.equipamentos.filter(function(e){ return (e.estado||'Na oficina')==='Na oficina'; });
  var porAssinar = abertas.filter(function(o){ return !o.assinatura; });
  var mes = today().slice(0,7), totalMes = 0;
  D.reports.forEach(function(r){ if(String(r.date||'').slice(0,7)===mes) totalMes += valorNum(r.valor); });
  function card(nav,n,label){ return '<button type="button" class="stat" data-nav="'+nav+'"><b>'+n+'</b><span>'+esc(label)+'</span></button>'; }
  $('homeStats').innerHTML =
    card('os',abertas.length,'ordens em curso')+
    card('eq',naOficina.length,'equipamentos na oficina')+
    card('os',porAssinar.length,'ordens por assinar')+
    card('cli',D.clientes.length,'clientes')+
    card('rel',D.reports.length,'relatórios')+
    card('rel',esc(fmtKz(String(Math.round(totalMes*100)/100).replace('.',','))||'0 Kz'),'em relatórios este mês');
  $('homeOs').innerHTML = abertas.length ? abertas.slice(0,8).map(function(o){
    return homeRow('os',o,(o.nome||'—')+' · '+(o.marca||'')+(o.prioridade==='Urgente'?' · URGENTE':''),badgeHtml(o.estado||'Aberta'));
  }).join('') : '<div class="empty">Nenhuma ordem em curso.</div>';
  $('homeEq').innerHTML = naOficina.length ? naOficina.slice(0,6).map(function(e){
    return homeRow('eq',e,(e.marca||'')+' · '+typeName(e.code)+(e.nome?' · '+e.nome:''),'');
  }).join('') : '<div class="empty">Nenhum equipamento na oficina.</div>';
  $('homeRep').innerHTML = D.reports.length ? D.reports.slice(0,5).map(function(r){
    return homeRow('rep',r,(r.nome||'—')+' · '+fmtDate(r.date),'<span class="v">'+esc(fmtKz(r.valor)||'')+'</span>');
  }).join('') : '<div class="empty">Ainda não há relatórios.</div>';
}
document.addEventListener('click',function(e){
  var n = e.target.closest && e.target.closest('[data-nav]'); if(n && ME){ showView(n.dataset.nav); return; }
  var q = e.target.closest && e.target.closest('[data-home]'); if(!q || !ME) return;
  var w = q.dataset.home;
  if(w==='cli'){ CLI = blankCli(); syncAll(); renderLists(); showView('cli'); }
  else if(w==='eq'){ E = blankEq(); syncAll(); renderLists(); showView('eq'); }
  else if(w==='os'){ O = blankOs(); syncAll(); renderLists(); showView('os'); }
  else if(w==='rep'){ S = blank('MLR'); S.conclusao = 'Após a intervenção técnica, o equipamento deverá ser submetido a testes de funcionamento para confirmar o resultado da reparação.'; syncAll(); renderLists(); showView('rel'); tab('form'); }
});

/* ---------- assinatura do cliente no ecrã ---------- */
var SIGS = {rep:{box:'repSig', get:function(){ return S; }}, os:{box:'osSig', get:function(){ return O; }}};
var INK = '#14305a';
function attachPad(cv){
  var ctx = cv.getContext('2d'), drawing = false, last = null;
  ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.fillStyle = INK;
  function pos(e){ var r = cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*cv.width/r.width, y:(e.clientY-r.top)*cv.height/r.height}; }
  cv.addEventListener('pointerdown',function(e){
    drawing = true; last = pos(e); cv.dataset.ink = '1';
    try{ cv.setPointerCapture(e.pointerId); }catch(x){}
    ctx.beginPath(); ctx.arc(last.x,last.y,1.6,0,Math.PI*2); ctx.fill(); e.preventDefault();
  });
  cv.addEventListener('pointermove',function(e){
    if(!drawing) return; var p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last = p; e.preventDefault();
  });
  ['pointerup','pointercancel','pointerleave'].forEach(function(ev){ cv.addEventListener(ev,function(){ drawing = false; }); });
}
function padOf(k){ return $(SIGS[k].box).querySelector('canvas'); }
function acceptSig(k,quiet){
  var X = SIGS[k].get(), cv = padOf(k);
  if(!cv || cv.dataset.ink!=='1'){ if(!quiet) toast('O cliente ainda não assinou no quadro.'); return false; }
  var url = cv.toDataURL('image/png');
  if(url.length>200000){ if(!quiet) toast('A assinatura é demasiado grande. Limpa o quadro e assina outra vez.'); return false; }
  X.assinatura = url; X.assinadoEm = new Date().toISOString();
  renderSig(k); if(!quiet) toast('Assinatura aceite. Guarda o documento para a gravar.');
  return true;
}
function commitSigs(){ ['rep','os'].forEach(function(k){ if(!SIGS[k].get().assinatura) acceptSig(k,true); }); }
function renderSig(k){
  var X = SIGS[k].get(), box = $(SIGS[k].box);
  if(X.assinatura){
    box.innerHTML = '<h2>Assinatura do cliente</h2><div class="sigdone"><img alt="Assinatura do cliente" src="'+esc(X.assinatura)+'"><div><b>Assinado no ecrã</b><br><small>'+esc(fmtDateTime(X.assinadoEm))+'</small><br><small>'+esc(X.nome||'')+'</small></div></div>'+
      '<div class="btn-row"><button type="button" class="btn sm" data-sig="clear">Remover assinatura</button></div><p class="hint">A assinatura aparece no PDF. Guarda para a gravar.</p>';
  }else{
    box.innerHTML = '<h2>Assinatura do cliente</h2><p class="hint">O cliente assina com o dedo ou com o rato no quadro.</p>'+
      '<div class="sigwrap"><canvas class="sigpad" width="640" height="220" aria-label="Quadro de assinatura"></canvas></div>'+
      '<div class="btn-row"><button type="button" class="btn sm" data-sig="erase">Limpar quadro</button><button type="button" class="btn sm primary" data-sig="accept">Aceitar assinatura</button></div>';
    attachPad(box.querySelector('canvas'));
  }
}
function renderSigs(){ renderSig('rep'); renderSig('os'); }
document.addEventListener('click',function(e){
  var b = e.target.closest && e.target.closest('[data-sig]'); if(!b) return;
  var k = b.closest('#repSig') ? 'rep' : 'os', X = SIGS[k].get(), a = b.dataset.sig;
  if(a==='erase'){ renderSig(k); }
  else if(a==='accept'){ acceptSig(k,false); }
  else if(a==='clear'){ X.assinatura = ''; X.assinadoEm = ''; renderSig(k); }
});

/* ---------- eliminar (só administradores) ---------- */
function armDelete(id,label,fn){
  var btn = $(id), timer = null, txt = btn.textContent;
  function reset(){ clearTimeout(timer); btn.dataset.armed = ''; btn.textContent = txt; btn.classList.remove('arm'); }
  btn.addEventListener('click', async function(){
    if(btn.dataset.armed!=='1'){
      btn.dataset.armed = '1'; btn.textContent = 'Toca outra vez para eliminar '+label; btn.classList.add('arm');
      timer = setTimeout(reset,5000); return;
    }
    reset(); await fn();
  });
}
async function doDelete(col,X,reset,msg){
  if(!X.currentId) return;
  var key = X.number, ok = await guarded(function(){ return deleteDoc(col,key).then(function(){ return true; }); },
    'Não foi possível eliminar. Só administradores podem eliminar registos.');
  if(!ok) return;
  reset(); syncAll(); renderLists(); toast(msg+' '+key+' eliminado.');
}
armDelete('btnRepDel','o relatório',function(){ return doDelete('reports',S,function(){ S = example(); tab('form'); },'Relatório'); });
armDelete('btnEqDel','o equipamento',function(){ return doDelete('equipamentos',E,function(){ E = blankEq(); },'Equipamento'); });
armDelete('btnOsDel','a ordem',function(){ return doDelete('ordens',O,function(){ O = blankOs(); },'Ordem'); });
armDelete('btnCliDel','o cliente',function(){ return doDelete('clientes',CLI,function(){ CLI = blankCli(); },'Cliente'); });

/* ---------- partilhar o PDF (WhatsApp, e-mail…) ---------- */
$('btnShare').addEventListener('click', async function(){
  if(busy) return;
  var id = await doSave(); if(!id) return;
  await makeAndDeliver(function(logo,sig){ return buildPdf({number:id}, logo, sig); }, id+'.pdf', S.assinatura, true);
});
$('btnOsShare').addEventListener('click', async function(){
  if(busy) return;
  var id = await doSaveOs(); if(!id) return;
  await makeAndDeliver(function(logo,sig){ return buildOsPdf(O, logo, sig); }, id+'.pdf', O.assinatura, true);
});

/* ---------- catálogo / checklist de equipamentos ---------- */
function typeCounts(){
  var m = {};
  function add(code,k){ if(!code) return; (m[code] = m[code] || {eq:0,os:0,rep:0})[k]++; }
  D.equipamentos.forEach(function(r){ add(r.code,'eq'); });
  D.ordens.forEach(function(r){ add(r.code,'os'); });
  D.reports.forEach(function(r){ add(r.code,'rep'); });
  return m;
}
function plural(n,s,p){ return n+' '+(n===1?s:p); }
function renderCat(){
  if(!ME) return;
  var q = norm($('catSearch').value).trim(), used = $('catUsed').checked, cnt = typeCounts(), all = allTypes();
  var on = all.filter(function(t){ return !t.off; }).length;
  $('catSum').textContent = on+' de '+all.length+' tipos marcados como reparáveis.';
  var order = [], by = {};
  all.forEach(function(t){
    var c = cnt[t.code] || {eq:0,os:0,rep:0};
    if(q && norm(t.name+' '+t.code+' '+t.cat).indexOf(q)<0) return;
    if(used && !(c.eq||c.os||c.rep)) return;
    if(!by[t.cat]){ by[t.cat] = []; order.push(t.cat); }
    by[t.cat].push(t);
  });
  var open = !!(q || used);
  var html = order.map(function(cat){
    var rows = by[cat].map(function(t){
      var c = cnt[t.code] || {eq:0,os:0,rep:0};
      var ct = (c.eq||c.os||c.rep) ? plural(c.eq,'equipamento','equipamentos')+' · '+plural(c.os,'ordem','ordens')+' · '+plural(c.rep,'relatório','relatórios') : 'sem registos';
      return '<div class="catrow'+(t.off?' off':'')+'"><label><input type="checkbox" data-cat-code="'+esc(t.code)+'"'+(t.off?'':' checked')+(isAdmin()?'':' disabled')+'><span class="cd">'+esc(t.code)+'</span><span class="nm">'+esc(t.name)+'</span></label><span class="ct">'+esc(ct)+'</span>'+
        (t.off?'':'<button type="button" class="btn sm" data-newtype="'+esc(t.code)+'">+ Equipamento</button>')+'</div>';
    }).join('');
    var n = by[cat].filter(function(t){ return !t.off; }).length;
    return '<details class="catgrp"'+(open || cat===order[0] ? ' open':'')+'><summary>'+esc(cat)+'<span class="badge">'+n+' / '+by[cat].length+'</span></summary>'+rows+'</details>';
  }).join('');
  var box = $('catBox');
  var openSet = {}; box.querySelectorAll('details').forEach(function(d){ openSet[d.querySelector('summary').firstChild.textContent] = d.open; });
  box.innerHTML = html || '<div class="empty">Nenhum equipamento encontrado.</div>';
  box.querySelectorAll('details').forEach(function(d){ var k = d.querySelector('summary').firstChild.textContent; if(!open && k in openSet) d.open = openSet[k]; });
}
$('catUsed').addEventListener('change',function(){ if(ME) renderCat(); });
$('catBox').addEventListener('change', async function(e){
  var cb = e.target.closest && e.target.closest('[data-cat-code]'); if(!cb) return;
  if(!isAdmin()){ cb.checked = !cb.checked; return; }
  var code = cb.dataset.catCode, t = allTypes().filter(function(x){ return x.code===code; })[0]; if(!t) return;
  var off = !cb.checked;
  var ok = await guarded(function(){ return putDoc('tipos',{code:code,name:t.name,off:off}).then(function(){ return true; }); },'Não foi possível guardar a alteração. Tenta outra vez.');
  if(!ok){ cb.checked = !cb.checked; return; }
  renderLists();
});
$('catBox').addEventListener('click',function(e){
  var b = e.target.closest && e.target.closest('[data-newtype]'); if(!b) return;
  E = blankEq(); E.code = b.dataset.newtype; syncAll(); renderLists(); showView('eq');
});
