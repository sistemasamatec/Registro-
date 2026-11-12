/* =====================================================================
   NÚCLEO: constantes, estado, armazenamento, numeração, senhas
   ===================================================================== */
var $ = function(id){ return document.getElementById(id); };
var LOGO = $('logoTop').getAttribute('src');
$('pLogo').src = LOGO; $('authLogo').src = LOGO;

var DEFAULT_TYPES = [
  {code:'TV',  name:'Televisor'},
  {code:'FOG', name:'Fogão'},
  {code:'MLR', name:'Máquina de lavar roupa'},
  {code:'MLL', name:'Máquina de lavar loiça'},
  {code:'AFR', name:'Air fryer'},
  {code:'FRG', name:'Frigorífico'},
  {code:'ARC', name:'Ar condicionado'},
  {code:'MIC', name:'Micro-ondas'}
];
var INTRO = 'Após a verificação técnica do equipamento, foram identificadas necessidades de intervenção nos seguintes componentes:';
var HOLDER = 'p' + Math.random().toString(36).slice(2, 10);
var ITER = 100000;

var CLI_F = ['nome','contacto','email','nif','endereco','observacoes'];
var REP_F = ['clienteId','code','date','nome','contacto','email','endereco','nif','marca','modelo','serie','capacidade','intro','componentes','servicos','valor','conclusao','os'];
var EQ_FLD = ['clienteId','code','date','estado','marca','modelo','serie','capacidade','nome','contacto','email','endereco','nif','avaria','acessorios','estadoFisico','observacoes'];
var OS_FLD = ['clienteId','date','equipId','code','marca','modelo','serie','capacidade','nome','contacto','email','endereco','nif','avaria','acessorios','estadoFisico','servico','atendimento','prioridade','tecnico','estado','dataPrevista','orcamento','sinal','observacoes','relatorio'];

var COL = {
  reports:      {path:'reports',      ls:'amatec_relatorios_v1',    key:'number',   re:/^([A-Z0-9]{2,4})-(\d{4,})$/, fields:REP_F},
  equipamentos: {path:'equipamentos', ls:'amatec_equipamentos_v1',  key:'number',   re:/^(EQ)-(\d{4,})$/,            fields:EQ_FLD},
  ordens:       {path:'ordens',       ls:'amatec_ordens_v1',        key:'number',   re:/^(OS)-(\d{4,})$/,            fields:OS_FLD},
  clientes:     {path:'clientes',     ls:'amatec_clientes_v1',     key:'number',   re:/^(CL)-(\d{4,})$/,            fields:CLI_F},
  users:        {path:'users',        ls:'amatec_users_v1',         key:'username'},
  tipos:        {path:'tipos',        ls:'amatec_tipos_v1',         key:'code'}
};
var D = {reports:[], equipamentos:[], ordens:[], clientes:[], users:[], tipos:[]};
var READY = {reports:false, equipamentos:false, ordens:false, clientes:false, users:false, tipos:false};

var ESTADOS_EQ = ['Na oficina','Pronto para entrega','Entregue'];
var ESTADOS_OS = ['Aberta','Em diagnóstico','Aguarda aprovação','Em reparação','Concluída','Entregue','Cancelada'];
var ATEND = ['Na oficina','Ao domicílio'];
var PRIO = ['Normal','Urgente'];

var db = null, dl = null, ME = null, busy = false;
var S, E, O, CLI;
var curView = 'rel';

/* ---------- utilitários ---------- */
function today(){ var d=new Date(), p=function(n){return String(n).padStart(2,'0');}; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
var esc = function(t){ return String(t==null?'':t).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var pad = function(n){ return String(n).padStart(4,'0'); };
var fmtNum = function(prefix,n){ return prefix+'-'+pad(n); };
function norm(s){ return String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
function clip(v,n){ return String(v==null?'':v).slice(0,n); }
function lines(t){ return String(t||'').split('\n').map(function(x){return x.trim();}).filter(Boolean); }
function fmtDate(iso){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||''); return m? m[3]+'/'+m[2]+'/'+m[1] : ''; }
function fmtKz(v){
  var s = String(v||'').trim(); if(!s) return '';
  var dec = '', m = s.match(/^(.*?)[,.](\d{1,2})$/);
  if(m){ s=m[1]; dec=m[2]; }
  var d = s.replace(/\D/g,''); if(!d) return '';
  return d.replace(/\B(?=(\d{3})+(?!\d))/g,'.') + (dec? ','+(dec+'0').slice(0,2) : '') + ' Kz';
}
function kzNum(v){
  var s = String(v||'').trim(), dec='', m = s.match(/^(.*?)[,.](\d{1,2})$/);
  if(m){ s=m[1]; dec=m[2]; }
  var d = s.replace(/\D/g,''); return d ? d+(dec?','+dec:'') : '';
}
var sleep = function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
function copy(dst,src,keys){ keys.forEach(function(k){ if(src[k]!=null) dst[k]=src[k]; }); }
function pickFields(src,keys){ var o={}; keys.forEach(function(k){ if(src[k]!=null) o[k]=src[k]; }); return o; }

var toastT;
function toast(msg){
  var t=$('toast'); t.textContent=msg; t.hidden=false;
  clearTimeout(toastT); toastT=setTimeout(function(){ t.hidden=true; },4200);
}
function sessGet(){ try{ return sessionStorage.getItem('amatec_user')||''; }catch(e){ return ''; } }
function sessSet(v){ try{ if(v) sessionStorage.setItem('amatec_user',v); else sessionStorage.removeItem('amatec_user'); }catch(e){} }
function lsGet(k){ try{ var v=JSON.parse(localStorage.getItem(k)); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

/* ---------- tipos e utilizadores ---------- */
function allTypes(){
  var seen = {}, out=[];
  DEFAULT_TYPES.concat(D.tipos).forEach(function(t){ if(!seen[t.code]){ seen[t.code]=1; out.push(t); } });
  return out;
}
function typeOf(code){ return allTypes().filter(function(t){ return t.code===code; })[0]; }
function typeName(code){ var t=typeOf(code); return t ? t.name : (code||''); }
function userOf(un){ return D.users.filter(function(u){ return u.username===un; })[0]; }
function userName(un){ var u=userOf(un); return u ? u.name : (un||''); }
function isAdmin(){ return !!(ME && ME.role==='admin'); }
function activeUsers(){ return D.users.filter(function(u){ return u.active!==false; }); }

/* ---------- armazenamento (base de dados ou neste navegador) ---------- */
function sortCol(col){
  if(col==='users') D.users.sort(function(a,b){ return String(a.name).localeCompare(String(b.name)); });
  else if(col!=='tipos') D[col].sort(function(a,b){ return String(b.savedAt||'').localeCompare(String(a.savedAt||'')); });
}
async function putDoc(col, rec){
  var kf = COL[col].key, k = rec[kf];
  if(db){ await db.doc(COL[col].path+'/'+k).set(rec); return; }
  var L = D[col], i = -1; L.forEach(function(r,ix){ if(r[kf]===k) i=ix; });
  if(i>=0) L[i]=rec; else L.push(rec);
  sortCol(col); lsSet(COL[col].ls, L); renderLists();
}
function seqOf(col,prefix){
  var m=0; D[col].forEach(function(r){
    var x = /^([A-Z0-9]{2,4})-(\d+)$/.exec(r.number||'');
    if(x && x[1]===prefix && +x[2]>m) m=+x[2];
  });
  return m+1;
}
/* atribui o próximo número livre; usa uma reserva curta na base de dados para duas pessoas não receberem o mesmo */
async function allocate(col,prefix,rec,now){
  var n = seqOf(col,prefix), waits = 0, srv = !!(db && db.nextNumber);
  for(var tries=0; tries<60; tries++){
    if(srv) n = await db.nextNumber(prefix);
    var id = fmtNum(prefix,n);
    if(srv){
      var s0 = await db.doc(COL[col].path+'/'+id).get();
      if(s0.exists){ continue; }
    }else if(db){
      var ref = db.doc(COL[col].path+'/'+id), ok = true;
      try{ var a = await ref.acquire({holder:HOLDER, ttlMs:4000}); ok = a.acquired!==false; }catch(e){ ok = true; }
      if(!ok){ if(++waits>8) throw new Error('ocupado'); await sleep(300); continue; }
      var snap = await ref.get(), d = snap.exists ? snap.data() : null;
      if(d && d.number){ n++; continue; }
    }else if(D[col].some(function(r){ return r.number===id; })){ n++; continue; }
    rec.number = id; rec.seq = n; rec.createdAt = now;
    await putDoc(col,rec);
    return {id:id, seq:n};
  }
  throw new Error('numero');
}
async function saveDoc(col,prefix,X,fields,extra){
  var now = new Date().toISOString(), rec = {savedAt:now, autor: X.autor || (ME?ME.username:'')};
  fields.forEach(function(k){ rec[k] = X[k]==null ? '' : String(X[k]); });
  if(extra) Object.keys(extra).forEach(function(k){ rec[k]=extra[k]; });
  if(X.currentId){
    rec.number=X.number; rec.seq=X.seq; rec.createdAt=X.createdAt||now;
    await putDoc(col,rec); return X.number;
  }
  var r = await allocate(col,prefix,rec,now);
  X.currentId=r.id; X.number=r.id; X.seq=r.seq; X.createdAt=now; X.autor=rec.autor;
  return r.id;
}
async function guarded(fn,msg){
  busy=true; renderHeader();
  try{ return await fn(); }
  catch(e){ toast(e && e.code==='quota_exceeded' ? 'A base de dados está cheia. Exporta uma cópia de segurança antes de continuar.' : msg); return null; }
  finally{ busy=false; renderHeader(); }
}

/* ---------- senhas (PBKDF2 com sal) ---------- */
function b64e(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s); }
function b64d(s){ var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
function newSalt(){ var u=new Uint8Array(16); if(window.crypto&&crypto.getRandomValues) crypto.getRandomValues(u); else for(var i=0;i<16;i++) u[i]=Math.floor(Math.random()*256); return b64e(u); }
var HAS_SUBTLE = !!(window.crypto && crypto.subtle && crypto.subtle.importKey);
var K256 = (function(){ var k=[],n=2,i,j,p; function fr(x){ return ((x-Math.floor(x))*4294967296)|0; }
  for(i=0;k.length<64;n++){ for(p=true,j=2;j*j<=n;j++) if(n%j===0){ p=false; break; } if(p) k.push(fr(Math.cbrt(n))); } return k; })();
function sha256(m){
  var H=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225], l=m.length, nb=((l+9+63)>>6)<<6, b=new Uint8Array(nb), w=new Int32Array(64), i, j;
  b.set(m); b[l]=128; var bl=l*8; b[nb-4]=bl>>>24; b[nb-3]=bl>>>16; b[nb-2]=bl>>>8; b[nb-1]=bl;
  for(var o=0;o<nb;o+=64){
    for(i=0;i<16;i++) w[i]=(b[o+4*i]<<24)|(b[o+4*i+1]<<16)|(b[o+4*i+2]<<8)|b[o+4*i+3];
    for(i=16;i<64;i++){ var a=w[i-15], c=w[i-2]; w[i]=(((a>>>7|a<<25)^(a>>>18|a<<14)^(a>>>3))+w[i-7]+((c>>>17|c<<15)^(c>>>19|c<<13)^(c>>>10))+w[i-16])|0; }
    var A=H[0],B=H[1],C=H[2],D=H[3],E=H[4],F=H[5],G=H[6],Hh=H[7];
    for(i=0;i<64;i++){
      var t1=(Hh+((E>>>6|E<<26)^(E>>>11|E<<21)^(E>>>25|E<<7))+((E&F)^(~E&G))+K256[i]+w[i])|0, t2=(((A>>>2|A<<30)^(A>>>13|A<<19)^(A>>>22|A<<10))+((A&B)^(A&C)^(B&C)))|0;
      Hh=G;G=F;F=E;E=(D+t1)|0;D=C;C=B;B=A;A=(t1+t2)|0;
    }
    H[0]=(H[0]+A)|0;H[1]=(H[1]+B)|0;H[2]=(H[2]+C)|0;H[3]=(H[3]+D)|0;H[4]=(H[4]+E)|0;H[5]=(H[5]+F)|0;H[6]=(H[6]+G)|0;H[7]=(H[7]+Hh)|0;
  }
  var out=new Uint8Array(32); for(i=0;i<8;i++){ out[4*i]=H[i]>>>24; out[4*i+1]=H[i]>>>16; out[4*i+2]=H[i]>>>8; out[4*i+3]=H[i]; } return out;
}
function hmac(key,msg){
  if(key.length>64) key=sha256(key);
  var ip=new Uint8Array(64+msg.length), op=new Uint8Array(96), i;
  for(i=0;i<64;i++){ var k=key[i]||0; ip[i]=k^54; op[i]=k^92; }
  ip.set(msg,64); op.set(sha256(ip),64); return sha256(op);
}
function pbkdf2js(pw,salt,iter){
  var key=new TextEncoder().encode(pw), s=new Uint8Array(salt.length+4); s.set(salt); s[salt.length+3]=1;
  var u=hmac(key,s), t=u.slice(), i, j;
  for(i=1;i<iter;i++){ u=hmac(key,u); for(j=0;j<32;j++) t[j]^=u[j]; }
  return t;
}
async function pbkdf2(pw,saltB64,iter){
  if(HAS_SUBTLE){
    try{
      var key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
      var bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:b64d(saltB64), iterations:iter}, key, 256);
      return b64e(new Uint8Array(bits));
    }catch(e){}
  }
  await sleep(0);
  return b64e(pbkdf2js(pw,b64d(saltB64),iter));
}
async function mkUser(name,un,role,pw){
  var salt = newSalt();
  return {username:un, name:name, role:role, salt:salt, iter:ITER, hash:await pbkdf2(pw,salt,ITER), active:true, createdAt:new Date().toISOString()};
}
function activeAdmins(excludeUn){ return D.users.filter(function(u){ return u.role==='admin' && u.active!==false && u.username!==excludeUn; }).length; }
var USER_RE = /^[a-z0-9._-]{3,24}$/;
