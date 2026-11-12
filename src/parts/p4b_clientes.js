/* =====================================================================
   CLIENTES: ficha, lista, ligações entre páginas
   ===================================================================== */
function clientOf(num){ return D.clientes.filter(function(c){ return c.number===num; })[0]; }
function findClient(X){
  var n = norm(X.nome).trim(); if(!n) return null;
  var ct = norm(X.contacto).trim();
  return D.clientes.filter(function(c){
    if(norm(c.nome).trim()!==n) return false;
    var cc = norm(c.contacto).trim(); return !ct || !cc || ct===cc;
  })[0] || null;
}
function applyClient(X,p,num){
  var c = num && clientOf(num);
  if(!c){ X.clienteId=''; return; }
  CLIENT_KEYS.forEach(function(k){ if(k!=='clienteId') X[k] = c[k]==null ? '' : c[k]; });
  X.clienteId = num; syncForm(p,X); renderHeader(); renderXlinks();
}
async function ensureClient(X){
  if(!String(X.nome||'').trim()) return;
  if(X.clienteId && clientOf(X.clienteId)) return;
  var f = findClient(X);
  if(f){ X.clienteId = f.number; return; }
  var now = new Date().toISOString(), rec = {savedAt:now, autor:ME?ME.username:''};
  CLI_F.forEach(function(k){ rec[k] = X[k]==null ? '' : clip(X[k],5000); });
  var r = await allocate('clientes','CL',rec,now);
  X.clienteId = r.id;
}
/* registos ligados a um cliente: pelo número, ou (registos antigos) pelo nome e contacto */
function linked(col,c){
  var n = norm(c.nome).trim(), ct = norm(c.contacto).trim();
  return D[col].filter(function(r){
    if(r.clienteId) return r.clienteId===c.number;
    if(norm(r.nome).trim()!==n) return false;
    var rc = norm(r.contacto).trim(); return !ct || !rc || ct===rc;
  });
}
function valorNum(v){ var s = kzNum(v); return s ? parseFloat(s.replace(',','.')) : 0; }

/* ---------- abrir registos (usado pelas ligações) ---------- */
function openCli(num){ var r = clientOf(num); if(!r) return; CLI = blankCli(); copy(CLI,r,CLI_F); CLI.currentId=r.number; CLI.number=r.number; CLI.seq=r.seq; CLI.createdAt=r.createdAt||null; CLI.autor=r.autor||''; syncAll(); renderLists(); showView('cli'); }
function openEq(num){ var r = D.equipamentos.filter(function(x){ return x.number===num; })[0]; if(!r) return;
  E = blankEq(); copy(E,r,EQ_FLD); E.currentId=r.number; E.number=r.number; E.seq=r.seq; E.createdAt=r.createdAt||null; E.autor=r.autor||''; syncAll(); renderLists(); showView('eq'); }
function openOs(num){ var r = D.ordens.filter(function(x){ return x.number===num; })[0]; if(!r) return;
  O = blankOs(); copy(O,r,OS_FLD); O.currentId=r.number; O.number=r.number; O.seq=r.seq; O.createdAt=r.createdAt||null; O.autor=r.autor||''; syncAll(); renderLists(); showView('os'); }
function openRep(num){ var r = D.reports.filter(function(x){ return x.number===num; })[0]; if(!r) return;
  S = blank(r.code); copy(S,r,REP_F); S.currentId=r.number; S.number=r.number; S.seq=r.seq; S.createdAt=r.createdAt||null; S.autor=r.autor||''; syncAll(); renderLists(); showView('rel'); tab('form'); }
var OPENERS = {cli:openCli, eq:openEq, os:openOs, rep:openRep};
document.addEventListener('click',function(e){
  var b = e.target.closest && e.target.closest('[data-go]'); if(!b || !ME) return;
  var parts = b.dataset.go.split(':'); if(OPENERS[parts[0]]) OPENERS[parts[0]](parts.slice(1).join(':'));
});
function chip(type,num,label){ return '<button type="button" class="chip" data-go="'+type+':'+esc(num)+'">'+esc(num)+(label?' <span>'+esc(label)+'</span>':'')+'</button>'; }

/* ---------- atalhos nas outras páginas ---------- */
function renderXlinks(){
  var c, h;
  c = S.clienteId && clientOf(S.clienteId);
  h = (c?'Cliente: '+chip('cli',c.number,c.nome):'') + (S.os?' Ordem: '+chip('os',S.os):'');
  $('repXl').innerHTML = h;
  c = E.clienteId && clientOf(E.clienteId);
  var ords = E.number ? D.ordens.filter(function(o){ return o.equipId===E.number; }) : [];
  $('eqXl').innerHTML = (c?'Cliente: '+chip('cli',c.number,c.nome):'') + (ords.length?' Ordens: '+ords.map(function(o){ return chip('os',o.number); }).join(' '):'');
  c = O.clienteId && clientOf(O.clienteId);
  $('osXl').innerHTML = (c?'Cliente: '+chip('cli',c.number,c.nome):'') + (O.equipId?' Equipamento: '+chip('eq',O.equipId):'') + (O.relatorio?' Relatório: '+chip('rep',O.relatorio):'');
}

/* ---------- lista e ficha ---------- */
function renderCliList(){
  var q = $('cliSearch').value.trim();
  renderGeneric({col:'clientes',searchId:'cliSearch',infoId:'cliInfo',boxId:'cliList',noun:'clientes registados',one:'cliente registado',
    empty:'Ainda não há clientes. Ficam registados quando guardas um equipamento, uma ordem ou um relatório, ou aqui, com “Guardar cliente”.',
    row:function(c){
      var n = linked('equipamentos',c).length + linked('ordens',c).length + linked('reports',c).length;
      return '<button type="button" class="item" data-id="'+esc(c.number)+'"><b>'+esc(c.number)+'</b><span class="m">'+esc((c.nome||'')+(c.contacto?' · '+c.contacto:''))+'</span><span class="badge">'+n+(n===1?' registo':' registos')+'</span></button>';
    }});
}
function renderCliLinks(){
  var box = $('cliLinksBody'), sec = $('cliLinks');
  var c = CLI.currentId && clientOf(CLI.currentId);
  if(!c){ sec.hidden = true; box.innerHTML=''; return; }
  sec.hidden = false;
  var eqs = linked('equipamentos',c), ords = linked('ordens',c), reps = linked('reports',c);
  var total = reps.reduce(function(a,r){ return a + valorNum(r.valor); },0);
  function grp(title,type,list,label){
    return '<h3>'+esc(title)+' <span class="badge">'+list.length+'</span></h3>'+
      (list.length ? '<div class="list">'+list.map(function(r){ return label(r); }).join('')+'</div>' : '<p class="hint">Nenhum registo.</p>');
  }
  box.innerHTML =
    '<div class="stats"><span class="badge">'+eqs.length+' equipamentos</span><span class="badge">'+ords.length+' ordens</span><span class="badge">'+reps.length+' relatórios</span>'+
      (total?'<span class="badge ok">Total dos relatórios: '+esc(fmtKz(String(Math.round(total*100)/100).replace('.',',')))+'</span>':'')+'</div>'+
    grp('Equipamentos','eq',eqs,function(r){ return '<button type="button" class="item" data-go="eq:'+esc(r.number)+'"><b>'+esc(r.number)+'</b><span class="m">'+esc((r.marca||'')+' · '+typeName(r.code))+'</span>'+badgeHtml(r.estado||'Na oficina')+'</button>'; })+
    grp('Ordens de serviço','os',ords,function(r){ return '<button type="button" class="item" data-go="os:'+esc(r.number)+'"><b>'+esc(r.number)+'</b><span class="m">'+esc((r.marca||'')+' · '+fmtDate(r.date))+'</span>'+badgeHtml(r.estado||'Aberta')+'</button>'; })+
    grp('Relatórios','rep',reps,function(r){ return '<button type="button" class="item" data-go="rep:'+esc(r.number)+'"><b>'+esc(r.number)+'</b><span class="m">'+esc((r.marca||'')+' · '+fmtDate(r.date))+'</span><span class="v">'+esc(fmtKz(r.valor)||'')+'</span></button>'; });
}
$('cliList').addEventListener('click',function(e){
  var b = e.target.closest('.item'); if(b) openCli(b.dataset.id);
});

/* ---------- guardar e criar documentos para o cliente ---------- */
async function doSaveCli(){
  if(!String(CLI.nome||'').trim()){ toast('Escreve o nome do cliente.'); return null; }
  if(!CLI.currentId){
    var dup = findClient(CLI);
    if(dup){ toast('Esse cliente já existe: '+dup.number+'.'); openCli(dup.number); return null; }
  }
  var wasNew = !CLI.currentId;
  var id = await guarded(function(){ return saveDoc('clientes','CL',CLI,CLI_F); },'Não foi possível guardar o cliente. Tenta outra vez.');
  if(!id) return null;
  syncAll(); renderLists();
  toast(wasNew ? 'Cliente registado: '+id+'.' : 'Alterações guardadas em '+id+'.');
  return id;
}
$('btnCliSave').addEventListener('click',function(){ doSaveCli(); });
$('btnCliNew').addEventListener('click',function(){ CLI = blankCli(); syncAll(); renderLists(); });
$('btnCliEq').addEventListener('click', async function(){
  var id = await doSaveCli(); if(!id) return;
  E = blankEq(); applyClient(E,'eq',id); syncAll(); renderLists(); showView('eq');
});
$('btnCliOs').addEventListener('click', async function(){
  var id = await doSaveCli(); if(!id) return;
  O = blankOs(); applyClient(O,'os',id); syncAll(); renderLists(); showView('os');
});
$('btnCliRep').addEventListener('click', async function(){
  var id = await doSaveCli(); if(!id) return;
  S = blank('MLR'); S.conclusao=''; applyClient(S,'rep',id); syncAll(); renderLists(); showView('rel'); tab('form');
});
