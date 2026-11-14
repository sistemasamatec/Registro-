/* =====================================================================
   SUPABASE: sessão, base de dados (PostgREST), contas e arranque
   Só usa fetch: sem bibliotecas externas.
   ===================================================================== */
var CFG = window.AMATEC_CONFIG || {};
var SBURL = String(CFG.url||'').replace(/\/+$/,''), SBKEY = String(CFG.anonKey||'');
var SKEY = 'amatec_sb_session_v1';
var sess = null, refreshing = null, entered = false;

function loadSess(){ try{ var s=JSON.parse(localStorage.getItem(SKEY)); return s && s.refresh_token ? s : null; }catch(e){ return null; } }
function saveSess(s){ sess = s; try{ if(s) localStorage.setItem(SKEY,JSON.stringify(s)); else localStorage.removeItem(SKEY); }catch(e){} }
function setTokens(j){
  saveSess({access_token:j.access_token, refresh_token:j.refresh_token, expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600),
    uid:(j.user&&j.user.id)||(sess&&sess.uid), email:(j.user&&j.user.email)||(sess&&sess.email)});
}
function rawFetch(path,o){
  o = o||{};
  var h = {apikey:SBKEY, 'Content-Type':'application/json'};
  if(o.auth!==false) h.Authorization = 'Bearer '+((sess&&sess.access_token)||SBKEY);
  Object.keys(o.headers||{}).forEach(function(k){ h[k]=o.headers[k]; });
  return fetch(SBURL+path,{method:o.method||'GET', headers:h, body:o.body===undefined?undefined:JSON.stringify(o.body)});
}
function refreshSess(){
  if(!sess) return Promise.resolve(false);
  if(!refreshing){
    refreshing = rawFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:{refresh_token:sess.refresh_token}})
      .then(async function(r){ if(!r.ok) return false; setTokens(await r.json()); return true; })
      .catch(function(){ return false; })
      .then(function(v){ refreshing=null; return v; });
  }
  return refreshing;
}
async function api(path,o){
  if(sess && sess.expires_at-30 < Date.now()/1000) await refreshSess();
  var r = await rawFetch(path,o);
  if(r.status===401 && sess && await refreshSess()) r = await rawFetch(path,o);
  if(!r.ok){
    var t=''; try{ t = await r.text(); }catch(e){}
    var err = new Error('HTTP '+r.status+' '+t.slice(0,300)); err.status = r.status; err.body = t; throw err;
  }
  var txt = await r.text(); return txt ? JSON.parse(txt) : null;
}
async function signIn(email,pw){
  var r = await rawFetch('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email:email,password:pw}});
  if(!r.ok){ var e = new Error('login'); e.status = r.status; e.wrong = r.status===400||r.status===401; throw e; }
  setTokens(await r.json());
}
function profileToUser(p){ return {id:p.id, username:String(p.email||'').toLowerCase(), name:p.name||p.email, role:p.role, active:p.active!==false}; }
async function myProfile(){
  var rows = await api('/rest/v1/profiles?id=eq.'+encodeURIComponent(sess.uid)+'&select=id,email,name,role,active');
  return rows && rows[0];
}

/* ---------- base de dados com a mesma interface que o resto da app usa ---------- */
var watchers = {}, inflight = {}, pollTimer = null;
function profileRows(){ return api('/rest/v1/profiles?select=id,email,name,role,active&order=name.asc'); }
function pollCol(col){
  if(inflight[col]) return inflight[col];
  var q = col==='users' ? profileRows() : api('/rest/v1/'+col+'?select=data&order=saved_at.desc&limit=1000');
  inflight[col] = q.then(function(rows){
    var docs = (rows||[]).map(function(r){ var d = col==='users' ? profileToUser(r) : r.data; return {data:function(){ return d; }}; });
    (watchers[col]||[]).slice().forEach(function(cb){ cb({docs:docs}); });
  }).then(function(v){ delete inflight[col]; return v; }, function(e){ delete inflight[col]; throw e; });
  return inflight[col];
}
function startPolling(){
  if(pollTimer) return;
  pollTimer = setInterval(function(){
    if(!ME || document.visibilityState==='hidden') return;
    Object.keys(watchers).forEach(function(col){
      if(!(watchers[col]||[]).length) return;
      pollCol(col).catch(function(e){ if(e && (e.status===401||e.status===403)) logout('A sessão terminou. Entra outra vez.'); });
    });
  },10000);
}
var DBSHIM = {
  doc: function(path){
    var i = path.indexOf('/'), col = path.slice(0,i), key = path.slice(i+1);
    return {
      set: async function(rec){
        if(col==='users'){
          await api('/rest/v1/profiles?email=eq.'+encodeURIComponent(key),{method:'PATCH',headers:{Prefer:'return=minimal'},body:{role:rec.role,active:rec.active!==false,name:rec.name}});
        }else{
          await api('/rest/v1/'+col+'?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
            body:[{key:key, data:rec, saved_at:rec.savedAt||new Date().toISOString()}]});
        }
        try{ await pollCol(col); }catch(e){}
      },
      get: async function(){
        var rows = await api('/rest/v1/'+col+'?key=eq.'+encodeURIComponent(key)+'&select=data');
        var has = !!(rows && rows.length);
        return {exists:has, data:function(){ return has ? rows[0].data : undefined; }};
      },
      delete: async function(){
        if(col==='users') return;
        var rows = await api('/rest/v1/'+col+'?key=eq.'+encodeURIComponent(key),{method:'DELETE',headers:{Prefer:'return=representation'}});
        if(!rows || !rows.length){ var e = new Error('negado'); e.code = 'negado'; throw e; }
        try{ await pollCol(col); }catch(e2){}
      },
      acquire: async function(){ return {acquired:true}; }
    };
  },
  collection: function(col){
    var c = {
      orderBy: function(){ return c; }, limit: function(){ return c; },
      onSnapshot: function(cb,errCb){
        (watchers[col] = watchers[col]||[]).push(cb);
        pollCol(col).catch(function(e){ if(errCb) errCb(e); });
        startPolling();
        return function(){ watchers[col] = (watchers[col]||[]).filter(function(f){ return f!==cb; }); };
      }
    };
    return c;
  },
  nextNumber: async function(prefix){ return await api('/rest/v1/rpc/next_number',{method:'POST',body:{p:prefix}}); },
  bump: async function(prefix,n){ await api('/rest/v1/rpc/bump_counter',{method:'POST',body:{p:prefix,n:n}}); }
};
async function edge(payload){
  try{ return await api('/functions/v1/admin-users',{method:'POST',body:payload}); }
  catch(e){
    var m = ''; try{ m = JSON.parse(e.body||'{}').error || ''; }catch(x){}
    var er = new Error(m || e.message); er.status = e.status; throw er;
  }
}

/* ---------- contas ---------- */
function loginInvalid(un){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(un) ? '' : 'Escreve um e-mail válido.'; }
async function createUser(name,un,role,pw){ await edge({action:'create',email:un,name:name,role:role,password:pw}); try{ await pollCol('users'); }catch(e){} }
async function setUserPassword(u,pw){ await edge({action:'setPassword',email:u.username,password:pw}); }
async function changeOwnPassword(old,nw){
  var r = await rawFetch('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email:ME.username,password:old}});
  if(!r.ok){ var e = new Error('antiga'); e.wrong = true; throw e; }
  setTokens(await r.json());
  await api('/auth/v1/user',{method:'PUT',body:{password:nw}});
}

/* ---------- sessão e arranque ---------- */
function watch(col){
  db.collection(col).onSnapshot(function(snap){
    var kf = COL[col].key;
    D[col] = snap.docs.map(function(d){ return d.data(); }).filter(function(x){ return x && x[kf]; });
    sortCol(col); READY[col] = true;
    if(col==='users' && ME){
      var cur = userOf(ME.username);
      if(!cur || cur.active===false){ logout('A tua conta foi desactivada.'); return; }
      if(cur.role!==ME.role){ ME = cur; applyWho(); if(!isAdmin() && curView==='adm') showView('rel'); } else ME = cur;
    }
    if(ME) renderLists();
  }, function(){ READY[col] = true; });
}
function startApp(u){
  db = DBSHIM; entered = true;
  Object.keys(COL).forEach(function(c){ D[c]=[]; READY[c]=false; });
  Object.keys(COL).forEach(watch);
  enterApp(u);
}
function logout(msg){
  if(sess){ try{ rawFetch('/auth/v1/logout',{method:'POST'}).catch(function(){}); }catch(e){} }
  saveSess(null); ME = null; usersSig = ''; db = null; watchers = {}; entered = false;
  if(pollTimer){ clearInterval(pollTimer); pollTimer = null; }
  Object.keys(COL).forEach(function(c){ D[c]=[]; READY[c]=false; });
  $('lgPass').value=''; $('lgErr').textContent='';
  showAuth('login');
  if(msg) toast(msg);
}
$('lgShow').addEventListener('change',function(){ $('lgPass').type = $('lgShow').checked ? 'text' : 'password'; });
var fails = 0, lockUntil = 0;
$('loginForm').addEventListener('submit', async function(e){
  e.preventDefault();
  var err = $('lgErr'); err.textContent = '';
  var now = Date.now();
  if(now < lockUntil){ err.textContent = 'Demasiadas tentativas. Aguarda '+Math.ceil((lockUntil-now)/1000)+' s.'; return; }
  var em = $('lgUser').value.trim().toLowerCase(), pw = $('lgPass').value;
  if(!em || !pw){ err.textContent = 'Escreve o e-mail e a senha.'; return; }
  $('lgBtn').disabled = true;
  try{
    await signIn(em,pw);
    var p = await myProfile();
    if(!p || p.active===false){ saveSess(null); err.textContent = 'Esta conta não tem acesso. Fala com o administrador.'; return; }
    fails = 0; startApp(profileToUser(p));
  }catch(x){
    if(x && x.wrong){
      fails++; if(fails>=5) lockUntil = Date.now() + Math.min(300000, 15000*Math.pow(2,fails-5));
      err.textContent = 'E-mail ou senha incorrectos.';
    }else err.textContent = 'Não foi possível ligar ao servidor. Verifica a internet e o ficheiro config.js.';
  }finally{ $('lgBtn').disabled = false; }
});
$('setupForm').addEventListener('submit',function(e){ e.preventDefault(); });
$('btnSair').addEventListener('click',function(){ logout(); });

/* ---------- recuperação de senha ---------- */
var RECOVERY = null;
function readRecovery(){
  var h = String(location.hash||'').replace(/^#/,''); if(h.indexOf('=')<0) return null;
  var q = {}; h.split('&').forEach(function(p){ var i=p.indexOf('='); if(i>0) q[decodeURIComponent(p.slice(0,i))]=decodeURIComponent(p.slice(i+1).replace(/\+/g,' ')); });
  if(!(q.type==='recovery' && q.access_token) && !q.error) return null;
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  return q;
}
$('lgForgot').addEventListener('click',function(){ $('fgUser').value = $('lgUser').value.trim(); $('fgErr').textContent=''; $('fgOk').textContent=''; showAuth('forgot'); });
$('fgBack').addEventListener('click',function(){ showAuth('login'); });
$('rsBack').addEventListener('click',function(){ sess = null; RECOVERY = null; showAuth('login'); });
$('forgotForm').addEventListener('submit', async function(e){
  e.preventDefault();
  var em = $('fgUser').value.trim().toLowerCase(), er = $('fgErr'); er.textContent=''; $('fgOk').textContent='';
  if(loginInvalid(em)){ er.textContent = 'Escreve um e-mail válido.'; return; }
  $('fgBtn').disabled = true;
  try{
    var back = encodeURIComponent(location.origin+location.pathname);
    var r = await rawFetch('/auth/v1/recover?redirect_to='+back,{method:'POST',auth:false,body:{email:em}});
    if(r.status===429) er.textContent = 'Já pediste várias vezes. Aguarda alguns minutos e tenta outra vez.';
    else if(r.status>=500 || r.status===0) er.textContent = 'Não foi possível enviar o e-mail agora. Tenta mais tarde ou fala com o administrador.';
    else $('fgOk').textContent = 'Se este e-mail tem conta, enviámos uma ligação. Abre o e-mail neste aparelho (vê também o spam). A ligação dura pouco tempo.';
  }catch(x){ er.textContent = 'Não foi possível ligar ao servidor. Verifica a internet.'; }
  finally{ $('fgBtn').disabled = false; }
});
$('resetForm').addEventListener('submit', async function(e){
  e.preventDefault();
  var a = $('rsPass').value, b = $('rsPass2').value, er = $('rsErr'); er.textContent='';
  if(a.length<6){ er.textContent = 'A senha precisa de pelo menos 6 caracteres.'; return; }
  if(a!==b){ er.textContent = 'As duas senhas não são iguais.'; return; }
  if(!RECOVERY){ showAuth('login'); return; }
  $('rsBtn').disabled = true;
  try{
    var r = await rawFetch('/auth/v1/user',{method:'PUT',body:{password:a}});
    if(!r.ok){
      var t=''; try{ t = await r.text(); }catch(x){}
      er.textContent = /same|different/i.test(t) ? 'A nova senha tem de ser diferente da anterior.' : (r.status===401||r.status===403 ? 'A ligação expirou. Pede uma nova em "Esqueci a senha".' : 'Não foi possível guardar a senha. Tenta outra vez.');
      return;
    }
    sess = null; RECOVERY = null; $('rsPass').value=''; $('rsPass2').value='';
    showAuth('login'); toast('Senha alterada. Entra com a nova senha.');
  }catch(x){ er.textContent = 'Não foi possível ligar ao servidor. Verifica a internet.'; }
  finally{ $('rsBtn').disabled = false; }
});

window.addEventListener('hashchange',function(){ if(/type=recovery|error=/.test(location.hash)) location.reload(); });
async function boot(){
  showAuth('loading');
  var rc = readRecovery();
  if(rc && SBURL && SBKEY){
    if(rc.error){ showAuth('login'); $('lgErr').textContent = 'A ligação de recuperação expirou ou já foi usada. Pede uma nova em "Esqueci a senha".'; return; }
    RECOVERY = rc; sess = {access_token:rc.access_token, refresh_token:'', expires_at:Math.floor(Date.now()/1000)+3000};
    showAuth('reset'); return;
  }
  if(!SBURL || !SBKEY){
    showAuth('login'); $('lgErr').textContent = 'Falta configurar o ficheiro config.js (endereço e chave pública do Supabase).'; $('lgBtn').disabled = true; return;
  }
  sess = loadSess();
  if(sess){
    try{
      if(sess.expires_at-30 < Date.now()/1000) await refreshSess();
      var p = sess && await myProfile();
      if(p && p.active!==false){ startApp(profileToUser(p)); return; }
    }catch(e){}
    saveSess(null);
  }
  showAuth('login');
}

/* ---------- instalar como app, sessão e ligação ---------- */
if('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
  window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
}
var IDLE_MS = 30*60*1000, lastAct = Date.now();
['pointerdown','keydown','scroll','touchstart'].forEach(function(ev){ window.addEventListener(ev,function(){ lastAct = Date.now(); },{passive:true}); });
setInterval(function(){ if(ME && Date.now()-lastAct > IDLE_MS) logout('Sessão terminada por inactividade. Entra outra vez.'); },30000);
function netState(){ $('offline').hidden = navigator.onLine!==false; }
window.addEventListener('online',netState); window.addEventListener('offline',netState); netState();
