/* =====================================================================
   INTERFACE: formulários, listas, navegação, relatórios
   ===================================================================== */
/* ---------- estados iniciais ---------- */
function blank(code){
  return {assinatura:'', assinadoEm:'', clienteId:'', code:code||'MLR', date:today(), nome:'',contacto:'',email:'',endereco:'',nif:'',marca:'',modelo:'',serie:'',capacidade:'',
    intro:INTRO, componentes:'', servicos:'', valor:'', conclusao:'', os:'', autor:'', currentId:null, number:null, seq:null, createdAt:null};
}
/* dados de exemplo FIXOS: máquina de lavar Candy de 7 kg */
function example(){
  var s = blank('MLR');
  s.marca='Candy'; s.capacidade='7 kg';
  s.componentes='Placa electrónica: reparação da placa electrónica de comando.\nPainel Touch: substituição do painel Touch por um novo componente.';
  s.servicos='Reparação da placa electrónica.\nRemoção do painel Touch danificado.\nInstalação e substituição do painel Touch.\nVerificação do funcionamento dos comandos e das funções do equipamento.';
  s.valor='65000';
  s.conclusao='Após a intervenção técnica, o equipamento deverá ser submetido a testes de funcionamento para confirmar a resposta da placa electrónica e do painel Touch.';
  return s;
}
function blankEq(){
  return {clienteId:'', code:'MLR', date:today(), estado:'Na oficina', marca:'',modelo:'',serie:'',capacidade:'',nome:'',contacto:'',email:'',endereco:'',nif:'',
    avaria:'',acessorios:'',estadoFisico:'',observacoes:'', autor:'', currentId:null, number:null, seq:null, createdAt:null};
}
function blankOs(){
  return {assinatura:'', assinadoEm:'', clienteId:'', date:today(), equipId:'', code:'MLR', marca:'',modelo:'',serie:'',capacidade:'',nome:'',contacto:'',email:'',endereco:'',nif:'',
    avaria:'',acessorios:'',estadoFisico:'',servico:'',atendimento:'Na oficina',prioridade:'Normal',tecnico:ME?ME.username:'',estado:'Aberta',
    dataPrevista:'',orcamento:'',sinal:'',observacoes:'',relatorio:'',checklist:'', autor:'', currentId:null, number:null, seq:null, createdAt:null};
}
function blankCli(){ return {nome:'',contacto:'',email:'',nif:'',endereco:'',observacoes:'', autor:'', currentId:null, number:null, seq:null, createdAt:null}; }
function resetStates(){ S = example(); E = blankEq(); O = blankOs(); CLI = blankCli(); }

/* ---------- formulários gerados ---------- */
function fld(p,f){
  var id=p+'_'+f.k, cls=f.full?' class="full"':'', ctl, at=' id="'+id+'" data-p="'+p+'" data-k="'+f.k+'"';
  if(f.t==='select') ctl='<select'+at+'>'+(f.opts||[]).map(function(o){ return '<option>'+esc(o)+'</option>'; }).join('')+'</select>';
  else if(f.t==='textarea') ctl='<textarea'+at+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+'></textarea>';
  else ctl='<input'+at+' type="'+(f.t||'text')+'"'+(f.im?' inputmode="'+f.im+'"':'')+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+' autocomplete="off">';
  return '<label for="'+id+'"'+cls+'>'+esc(f.l)+ctl+'</label>';
}
function buildFields(boxId,p,fields){ $(boxId).innerHTML = fields.map(function(f){ return fld(p,f); }).join(''); }
var CLIENT_F = function(){ return [
  {k:'clienteId',l:'Cliente registado (opcional)',t:'select',full:1},{k:'nome',l:'Nome'},{k:'contacto',l:'Contacto',im:'tel'},{k:'email',l:'E-mail',im:'email'},{k:'nif',l:'NIF (opcional)'},{k:'endereco',l:'Endereço',full:1}]; };
function initForms(){
  buildFields('cliF1','cli',[{k:'nome',l:'Nome',full:1},{k:'contacto',l:'Contacto',im:'tel'},{k:'email',l:'E-mail',im:'email'},{k:'nif',l:'NIF (opcional)'},{k:'endereco',l:'Endereço',full:1},{k:'observacoes',l:'Observações',t:'textarea',full:1}]);
  buildFields('eqF1','eq',[{k:'code',l:'Tipo de equipamento',t:'select',full:1},{k:'marca',l:'Marca'},{k:'modelo',l:'Modelo'},{k:'serie',l:'Nº de série'},{k:'capacidade',l:'Capacidade ou tamanho',ph:'Ex.: 7 kg, 43 polegadas'}]);
  buildFields('eqF2','eq',CLIENT_F());
  buildFields('eqF3','eq',[{k:'date',l:'Data de entrada',t:'date'},{k:'estado',l:'Estado',t:'select',opts:ESTADOS_EQ},
    {k:'avaria',l:'Avaria reportada pelo cliente',t:'textarea',full:1},
    {k:'acessorios',l:'Acessórios entregues',t:'textarea',ph:'Ex.: cabo de alimentação, comando'},
    {k:'estadoFisico',l:'Estado físico à entrada',t:'textarea',ph:'Ex.: risco na tampa, sem danos visíveis'},
    {k:'observacoes',l:'Observações',t:'textarea',full:1}]);
  buildFields('osF1','os',[{k:'date',l:'Data de abertura',t:'date'},{k:'atendimento',l:'Atendimento',t:'select',opts:ATEND},
    {k:'equipId',l:'Equipamento registado (opcional)',t:'select',full:1},{k:'prioridade',l:'Prioridade',t:'select',opts:PRIO}]);
  buildFields('osF2','os',[{k:'code',l:'Tipo de equipamento',t:'select',full:1},{k:'marca',l:'Marca'},{k:'modelo',l:'Modelo'},{k:'serie',l:'Nº de série'},{k:'capacidade',l:'Capacidade ou tamanho'}]);
  buildFields('osF3','os',CLIENT_F());
  buildFields('osF4','os',[{k:'avaria',l:'Avaria reportada pelo cliente',t:'textarea',full:1},
    {k:'servico',l:'Serviço a executar ou diagnóstico',t:'textarea',full:1},
    {k:'acessorios',l:'Acessórios entregues',t:'textarea'},{k:'estadoFisico',l:'Estado físico à entrada',t:'textarea'},
    {k:'observacoes',l:'Observações',t:'textarea',full:1}]);
  buildFields('osF5','os',[{k:'estado',l:'Estado',t:'select',opts:ESTADOS_OS},{k:'tecnico',l:'Técnico responsável',t:'select'},
    {k:'dataPrevista',l:'Data prevista',t:'date'},{k:'orcamento',l:'Orçamento estimado (Kz)',im:'decimal'},{k:'sinal',l:'Sinal pago (Kz)',im:'decimal'}]);
}
function syncForm(p,obj){
  document.querySelectorAll('[data-p="'+p+'"]').forEach(function(el){
    var v = obj[el.dataset.k]==null ? '' : String(obj[el.dataset.k]);
    if(el.value!==v) el.value = v;
  });
}
function syncAll(){ syncForm('rep',S); syncForm('eq',E); syncForm('os',O); syncForm('cli',CLI); if(typeof renderCk==='function') renderCk(); if(typeof renderSigs==='function') renderSigs(); }

/* ---------- listas pendentes (selects) ---------- */
function optHtml(list){ return list.map(function(o){ return '<option value="'+esc(o.v)+'">'+esc(o.t)+'</option>'; }).join(''); }
function setOpts(el,html,val){ if(el){ el.innerHTML=html; el.value = val==null?'':val; } }
function refreshSelects(){
  setOpts($('code'),typeOpts(S.code),S.code); setOpts($('eq_code'),typeOpts(E.code),E.code); setOpts($('os_code'),typeOpts(O.code),O.code);
  var cHtml = optHtml([{v:'',t:'— nenhum (preencher à mão) —'}].concat(D.clientes.slice().sort(function(a,b){ return String(a.nome).localeCompare(String(b.nome)); }).map(function(c){ return {v:c.number,t:c.number+' · '+(c.nome||'')}; })));
  setOpts($('repCli'),cHtml,S.clienteId); setOpts($('eq_clienteId'),cHtml,E.clienteId); setOpts($('os_clienteId'),cHtml,O.clienteId);
  setOpts($('repOs'), optHtml([{v:'',t:'— nenhuma —'}].concat(D.ordens.map(function(o){ return {v:o.number,t:o.number+' · '+(o.marca||'')+' · '+(o.nome||'')}; }))), S.os);
  setOpts($('os_equipId'), optHtml([{v:'',t:'— nenhum (preencher à mão) —'}].concat(D.equipamentos.map(function(q){ return {v:q.number,t:q.number+' · '+(q.marca||'')+' · '+(q.nome||'')}; }))), O.equipId);
  setOpts($('os_tecnico'), optHtml([{v:'',t:'— sem técnico —'}].concat(activeUsers().map(function(u){ return {v:u.username,t:u.name}; }))), O.tecnico);
  var f1=$('eqFilter').value, f2=$('osFilter').value;
  setOpts($('eqFilter'), optHtml([{v:'',t:'Todos'}].concat(ESTADOS_EQ.map(function(x){ return {v:x,t:x}; }))), f1);
  setOpts($('osFilter'), optHtml([{v:'',t:'Todos'}].concat(ESTADOS_OS.map(function(x){ return {v:x,t:x}; }))), f2);
  $('code').disabled = !!S.currentId;
}

/* ---------- pré-visualização do relatório ---------- */
function field(l,v){ return '<div class="f"><span class="l">'+esc(l)+':</span><span class="v'+(v?' set':'')+'">'+esc(v||'')+'</span></div>'; }
function numFor(X,col,prefix){
  if(X.currentId) return X.number;
  if(db && !READY[col]) return '';
  return fmtNum(prefix, seqOf(col,prefix));
}
function renderPaper(){
  var t = typeOf(S.code), num = numFor(S,'reports',S.code);
  var comps = lines(S.componentes).map(function(l){
    var i = l.indexOf(':');
    return i>0 ? '<li><span><b>'+esc(l.slice(0,i+1))+'</b>'+esc(l.slice(i+1))+'</span></li>' : '<li><span>'+esc(l)+'</span></li>';
  }).join('');
  var servs = lines(S.servicos).map(function(l){ return '<li><span>'+esc(l)+'</span></li>'; }).join('');
  var kz = fmtKz(S.valor);
  $('pDyn').innerHTML =
  '<div class="p-title"><div><div class="k">DIAGNÓSTICO E ORÇAMENTO</div><div class="t">Relatório Técnico de Reparação</div></div>'+
    '<div class="p-meta"><div>Nº do relatório</div><div class="num">'+esc(num||'—')+'</div><div>Data: <b style="color:var(--ink)">'+esc(fmtDate(S.date))+'</b></div>'+
    (S.os?'<div>Ordem de serviço: <b style="color:var(--ink)">'+esc(S.os)+'</b></div>':'')+'</div></div>'+
  '<div class="p-two">'+
    '<div class="p-box"><h3>DADOS DO CLIENTE</h3>'+field('Nome',S.nome)+field('Contacto',S.contacto)+field('E-mail',S.email)+field('Endereço',S.endereco)+field('NIF (opcional)',S.nif)+'</div>'+
    '<div class="p-box alt"><h3>DADOS DO EQUIPAMENTO</h3>'+field('Equipamento',t?t.name:S.code)+field('Marca',S.marca)+field('Capacidade',S.capacidade)+field('Modelo',S.modelo)+field('Nº de série',S.serie)+'</div>'+
  '</div>'+
  '<div class="p-body">'+
    '<div class="p-sec"><div class="p-h"><i>1</i><b>Descrição dos trabalhos realizados</b></div>'+
      (S.intro.trim()?'<div class="p-txt">'+esc(S.intro)+'</div>':'')+(comps?'<ul class="p-ul">'+comps+'</ul>':'')+'</div>'+
    '<div class="p-sec"><div class="p-h"><i>2</i><b>Serviços executados</b></div>'+(servs?'<ul class="p-ul">'+servs+'</ul>':'')+'</div>'+
    '<div class="p-sec"><div class="p-h"><i>3</i><b>Valor da intervenção</b></div>'+
      '<div class="p-val"><span>Valor total da reparação</span><strong>'+esc(kz||'—')+'</strong></div></div>'+
    '<div class="p-sec"><div class="p-h"><i>4</i><b>Conclusão</b></div>'+(S.conclusao.trim()?'<div class="p-txt">'+esc(S.conclusao)+'</div>':'')+'</div>'+
  '</div>';
  fit();
}
function fit(){
  var wrap=$('sheetWrap'), sc=$('sheetScale'), paper=$('paper');
  var s = Math.min(1, wrap.clientWidth/794) || 1;
  sc.style.transform = 'scale('+s+')';
  wrap.style.height = Math.ceil(paper.offsetHeight*s)+'px';
}

/* ---------- números e botões ---------- */
function metaOf(X){ return X.autor && X.createdAt ? ' Registado por '+userName(X.autor)+' em '+fmtDateTime(X.createdAt)+'.' : ''; }
function renderHeader(){
  var n = numFor(S,'reports',S.code);
  $('numValue').textContent = n || '…';
  if(S.currentId){ $('numLabel').textContent='A editar o relatório'; $('numNote').textContent='O número mantém-se. Guarda para actualizar.'+metaOf(S); }
  else { $('numLabel').textContent='Próximo nº do relatório'; $('numNote').textContent = db ? 'Atribuído automaticamente ao guardar.' : 'Atribuído automaticamente ao guardar (neste navegador).'; }
  $('btnSave').textContent = S.currentId ? 'Guardar alterações' : 'Guardar';
  var ne = numFor(E,'equipamentos','EQ'); $('numEqValue').textContent = ne || '…';
  $('numEqLabel').textContent = E.currentId ? 'A editar o equipamento' : 'Próximo nº de equipamento';
  $('btnEqSave').textContent = E.currentId ? 'Guardar alterações' : 'Guardar equipamento';
  var no = numFor(O,'ordens','OS'); $('numOsValue').textContent = no || '…';
  $('numOsLabel').textContent = O.currentId ? 'A editar a ordem de serviço' : 'Próxima ordem de serviço';
  $('numOsNote').textContent = O.currentId ? 'O número mantém-se. Guarda para actualizar.'+metaOf(O) : 'Atribuído automaticamente ao guardar.';
  $('btnOsSave').textContent = O.currentId ? 'Guardar alterações' : 'Guardar';
  var nc = numFor(CLI,'clientes','CL'); $('numCliValue').textContent = nc || '…';
  $('numCliLabel').textContent = CLI.currentId ? 'A editar o cliente' : 'Próximo nº de cliente';
  $('btnCliSave').textContent = CLI.currentId ? 'Guardar alterações' : 'Guardar cliente';
  [['btnRepDel',S],['btnEqDel',E],['btnOsDel',O],['btnCliDel',CLI]].forEach(function(p){ $(p[0]).hidden = !(isAdmin() && p[1].currentId); });
  $('osRel').textContent = O.relatorio ? 'Relatório associado: '+O.relatorio : 'Ainda sem relatório associado.';
  ['btnSave','btnPdf','btnNew','btnClear','btnEqSave','btnEqOs','btnEqRep','btnEqNew','btnOsPdf','btnOsSave','btnOsRep','btnOsNew','btnCliSave','btnCliEq','btnCliOs','btnCliRep','btnCliNew','btnRepDel','btnEqDel','btnOsDel','btnCliDel','btnShare','btnOsShare'].forEach(function(id){ $(id).disabled = busy; });
}

/* ---------- listas com pesquisa ---------- */
function hay(r){
  var s=[]; for(var k in r){ if(typeof r[k]==='string' && k!=='assinatura') s.push(r[k]); }
  s.push(fmtKz(r.valor),fmtKz(r.orcamento),fmtKz(r.sinal),fmtDate(r.date),userName(r.tecnico||r.autor),typeName(r.code));
  return norm(s.join(' '));
}
function filt(list,q,estado){
  var terms = norm(q).split(/\s+/).filter(Boolean);
  return list.filter(function(r){
    if(estado && r.estado!==estado) return false;
    if(!terms.length) return true;
    var h = hay(r); return terms.every(function(t){ return h.indexOf(t)>-1; });
  });
}
function badgeHtml(est){
  var c = {'Pronto para entrega':'ok','Concluída':'ok','Aguarda aprovação':'warn','Em reparação':'warn','Cancelada':'bad'}[est] || '';
  return '<span class="badge'+(c?' '+c:'')+'">'+esc(est)+'</span>';
}
function renderGeneric(o){
  var raw = $(o.searchId).value.trim(), est = o.filterId ? $(o.filterId).value : '';
  var list = filt(D[o.col],raw,est), total = D[o.col].length;
  $(o.infoId).textContent = !total ? '' : ((raw||est) ? list.length+' de '+total+' '+o.noun : total+' '+(total===1 && o.one ? o.one : o.noun));
  var box = $(o.boxId);
  if(!total){ box.innerHTML = '<div class="empty">'+o.empty+'</div>'; return; }
  if(!list.length){ box.innerHTML = '<div class="empty">Nenhum resultado'+(raw?' para “'+esc(raw)+'”':'')+'.</div>'; return; }
  box.innerHTML = list.map(o.row).join('');
}
function renderRepList(){
  $('histCount').textContent = D.reports.length ? '('+D.reports.length+')' : '';
  renderGeneric({col:'reports',searchId:'histSearch',infoId:'histInfo',boxId:'histList',noun:'relatórios guardados',one:'relatório guardado',
    empty:'Ainda não há relatórios guardados. Quando guardares o primeiro, aparece aqui com o seu número.',
    row:function(r){ return '<button type="button" class="item" data-id="'+esc(r.number)+'"><b>'+esc(r.number)+'</b><span class="m">'+esc((r.tipo||'')+(r.marca?' '+r.marca:'')+(r.nome?' · '+r.nome:''))+'</span><span class="v">'+esc(fmtKz(r.valor)||fmtDate(r.date))+'</span></button>'; }});
}
function renderEqList(){
  renderGeneric({col:'equipamentos',searchId:'eqSearch',filterId:'eqFilter',infoId:'eqInfo',boxId:'eqList',noun:'equipamentos registados',one:'equipamento registado',
    empty:'Ainda não há equipamentos registados. Quando guardares o primeiro, aparece aqui.',
    row:function(r){ return '<button type="button" class="item" data-id="'+esc(r.number)+'"><b>'+esc(r.number)+'</b><span class="m">'+esc((r.marca||'')+' · '+typeName(r.code)+(r.nome?' · '+r.nome:''))+'</span>'+badgeHtml(r.estado||'Na oficina')+'</button>'; }});
}
function renderOsList(){
  renderGeneric({col:'ordens',searchId:'osSearch',filterId:'osFilter',infoId:'osInfo',boxId:'osList',noun:'ordens de serviço',one:'ordem de serviço',
    empty:'Ainda não há ordens de serviço. Quando guardares a primeira, aparece aqui.',
    row:function(r){ return '<button type="button" class="item" data-id="'+esc(r.number)+'"><b>'+esc(r.number)+'</b><span class="m">'+esc((r.marca||'')+(r.nome?' · '+r.nome:'')+(r.tecnico?' · '+userName(r.tecnico):''))+'</span>'+(r.prioridade==='Urgente'?'<span class="badge warn">Urgente</span>':'')+badgeHtml(r.estado||'Aberta')+'</button>'; }});
}
function renderLists(){
  if(!ME) return;
  refreshSelects(); renderRepList(); renderEqList(); renderOsList(); renderCliList(); renderXlinks(); renderCliLinks(); renderHome(); renderCat();
  if(isAdmin()) renderUsers();
  renderHeader(); renderPaper();
}
['histSearch','eqSearch','osSearch','cliSearch','catSearch'].forEach(function(id){ $(id).addEventListener('input',function(){ if(ME) renderLists(); }); });
['eqFilter','osFilter'].forEach(function(id){ $(id).addEventListener('change',function(){ if(ME) renderLists(); }); });

/* ---------- navegação ---------- */
function showView(v){
  if(v==='adm' && !isAdmin()) v='rel';
  ['home','rel','cli','eq','os','cat','adm','conta'].forEach(function(x){ $('v_'+x).hidden = x!==v; });
  document.querySelectorAll('#nav button').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.view===v)); });
  curView = v; window.scrollTo(0,0);
  if(v==='home') renderHome(); if(v==='cat') renderCat(); if(v==='rel') fit(); if(v==='adm') renderUsers(); if(v==='conta') renderConta(); if(v==='cli') renderCliLinks();
}
$('nav').addEventListener('click',function(e){ var b=e.target.closest('button'); if(b) showView(b.dataset.view); });
$('btnConta').addEventListener('click',function(){ showView('conta'); });
function tab(w){
  $('viewForm').hidden = w!=='form'; $('viewHist').hidden = w!=='hist';
  $('tabForm').setAttribute('aria-selected', String(w==='form')); $('tabHist').setAttribute('aria-selected', String(w==='hist'));
}
$('tabForm').addEventListener('click',function(){ tab('form'); });
$('tabHist').addEventListener('click',function(){ tab('hist'); });

/* ---------- campos: ligação entre ecrã e estado ---------- */
function onField(p,k,v){
  if(p==='rep'){
    if(k==='os'){ reportFromOs(v); return; }
    if(k==='clienteId'){ applyClient(S,'rep',v); renderPaper(); return; }
    S[k]=v; if(k==='code') renderHeader(); renderPaper();
  }else if(p==='cli'){ CLI[k]=v; }
  else if(p==='eq'){ if(k==='clienteId'){ applyClient(E,'eq',v); return; } E[k]=v; if(k==='code') renderHeader(); }
  else if(p==='os'){ if(k==='clienteId'){ applyClient(O,'os',v); return; } O[k]=v; if(k==='equipId') osFromEq(v); if(k==='code') renderHeader(); }
}
function fieldEvent(e){ var el=e.target; if(el && el.dataset && el.dataset.p) onField(el.dataset.p, el.dataset.k, el.value); }
document.addEventListener('input',fieldEvent); document.addEventListener('change',fieldEvent);

function reportFromOs(num){
  var o = D.ordens.filter(function(x){ return x.number===num; })[0];
  if(!o){ S.os=''; renderPaper(); return; }
  copy(S,o,['clienteId','marca','modelo','serie','capacidade','nome','contacto','email','endereco','nif']);
  if(!S.currentId){ S.code = o.code || S.code; if(!S.valor && o.orcamento) S.valor = kzNum(o.orcamento); }
  S.os = num; syncForm('rep',S); renderHeader(); renderPaper();
}
function osFromEq(num){
  var q = D.equipamentos.filter(function(x){ return x.number===num; })[0];
  if(!q){ O.equipId=''; return; }
  copy(O,q,['clienteId','code','marca','modelo','serie','capacidade','nome','contacto','email','endereco','nif','avaria','acessorios','estadoFisico']);
  O.equipId = num; syncForm('os',O); renderHeader();
}
async function linkOs(osNum,repNum){
  var o = D.ordens.filter(function(x){ return x.number===osNum; })[0];
  if(!o || o.relatorio===repNum) return;
  await putDoc('ordens', Object.assign({}, o, {relatorio:repNum}));
  if(O.number===osNum){ O.relatorio=repNum; renderHeader(); }
}

/* ---------- relatórios: guardar, PDF, novo, limpar, histórico ---------- */
async function saveReport(){
  await ensureClient(S);
  var t = typeOf(S.code);
  var id = await saveDoc('reports', S.code, S, REP_F, {tipo:t?t.name:S.code});
  if(S.os) await linkOs(S.os,id);
  return id;
}
async function doSave(){
  var wasNew = !S.currentId;
  var id = await guarded(saveReport,'Não foi possível guardar o relatório. Tenta outra vez.');
  if(!id) return null;
  syncAll(); renderLists();
  toast(wasNew ? 'Guardado com o número '+id+'.' : 'Alterações guardadas em '+id+'.');
  return id;
}
$('btnSave').addEventListener('click',function(){ doSave(); });
$('btnNew').addEventListener('click',function(){ S=example(); syncAll(); renderLists(); tab('form'); toast('Dados de exemplo repostos.'); });
$('btnClear').addEventListener('click',function(){
  S = blank(S.code); S.conclusao='Após a intervenção técnica, o equipamento deverá ser submetido a testes de funcionamento para confirmar o resultado da reparação.';
  syncAll(); renderLists(); tab('form'); toast('Campos limpos.');
});
$('histList').addEventListener('click',function(e){
  var b = e.target.closest('.item'); if(!b) return;
  var r = D.reports.filter(function(x){ return x.number===b.dataset.id; })[0]; if(!r) return;
  S = blank(r.code); copy(S,r,REP_F);
  S.currentId=r.number; S.number=r.number; S.seq=r.seq; S.createdAt=r.createdAt||null; S.autor=r.autor||'';
  syncAll(); renderLists(); tab('form'); window.scrollTo({top:0,behavior:'smooth'});
});
$('btnAddType').addEventListener('click', async function(){
  var name = $('newName').value.trim(), code = $('newCode').value.trim().toUpperCase(), msg = $('newTypeMsg');
  if(!name || !/^[A-Z0-9]{2,4}$/.test(code)){ msg.textContent='Escreve o nome e um código de 2 a 4 letras ou números.'; return; }
  if(typeOf(code)){ msg.textContent='O código '+code+' já existe. Escolhe outro.'; return; }
  try{
    await putDoc('tipos',{code:code,name:clip(name,60)});
    S.code = code; $('newName').value=''; $('newCode').value=''; msg.textContent='';
    $('addType').open=false; syncAll(); renderLists(); toast('Tipo adicionado: '+name+' ('+code+').');
  }catch(e){ msg.textContent='Não foi possível guardar o tipo. Tenta outra vez.'; }
});
$('btnPdf').addEventListener('click', async function(){
  if(busy) return;
  var id = await doSave(); if(!id) return;
  await makeAndDeliver(function(logo,sig){ return buildPdf({number:id}, logo, sig); }, id+'.pdf', S.assinatura);
});
