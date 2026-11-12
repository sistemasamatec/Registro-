function logout(msg){
  sessSet(''); ME = null; usersSig = '';
  $('lgPass').value=''; $('lgErr').textContent='';
  showAuth(D.users.length ? 'login' : 'setup');
  if(msg) toast(msg);
}
var entered = false;
function decide(){
  if(!READY.users) return;
  if(ME){
    var cur = userOf(ME.username);
    if(!cur || cur.active===false){ logout('A tua conta foi desactivada.'); return; }
    if(cur.role!==ME.role){ ME = cur; applyWho(); if(!isAdmin() && curView==='adm') showView('rel'); }
    else ME = cur;
    return;
  }
  if(!D.users.length){ showAuth('setup'); return; }
  var s = sessGet(), su = s && userOf(s);
  if(su && su.active!==false && !entered){ entered = true; enterApp(su); return; }
  if($('loginForm').hidden || !$('setupForm').hidden) showAuth('login');
}

$('lgShow').addEventListener('change',function(){ $('lgPass').type = $('lgShow').checked ? 'text' : 'password'; });
var fails = 0, lockUntil = 0;
$('loginForm').addEventListener('submit', async function(e){
  e.preventDefault();
  var err = $('lgErr'); err.textContent = '';
  var now = Date.now();
  if(now < lockUntil){ err.textContent = 'Demasiadas tentativas. Aguarda '+Math.ceil((lockUntil-now)/1000)+' s.'; return; }
  var un = $('lgUser').value.trim().toLowerCase(), pw = $('lgPass').value;
  if(!un || !pw){ err.textContent = 'Escreve o utilizador e a senha.'; return; }
  $('lgBtn').disabled = true;
  try{
    var u = userOf(un), ok = false;
    if(u && u.active!==false) ok = (await pbkdf2(pw,u.salt,u.iter||ITER)) === u.hash;
    else await pbkdf2(pw,newSalt(),ITER);
    if(ok){ fails = 0; entered = true; enterApp(u); }
    else{
      fails++; if(fails>=5){ lockUntil = Date.now() + Math.min(300000, 15000*Math.pow(2,fails-5)); }
      err.textContent = 'Utilizador ou senha incorrectos.';
    }
  }catch(x){ err.textContent = 'Não foi possível verificar a senha neste navegador.'; }
  finally{ $('lgBtn').disabled = false; }
});
$('setupForm').addEventListener('submit', async function(e){
  e.preventDefault();
  var err = $('suErr'); err.textContent = '';
  var name = $('suName').value.trim(), un = $('suUser').value.trim().toLowerCase(), p1 = $('suPass').value, p2 = $('suPass2').value;
  if(D.users.length){ showAuth('login'); return; }
  if(!name){ err.textContent='Escreve o teu nome.'; return; }
  if(!USER_RE.test(un)){ err.textContent='Utilizador: 3 a 24 letras minúsculas, números, ponto, hífen ou sublinhado.'; return; }
  if(p1.length<6){ err.textContent='A senha deve ter pelo menos 6 caracteres.'; return; }
  if(p1!==p2){ err.textContent='As duas senhas não coincidem.'; return; }
  $('suBtn').disabled = true;
  try{
    var u = await mkUser(clip(name,60),un,'admin',p1);
    await putDoc('users',u);
    ['suName','suUser','suPass','suPass2'].forEach(function(id){ $(id).value=''; });
    entered = true; enterApp(u);
  }catch(x){ err.textContent='Não foi possível criar a conta: '+((x&&(x.code||x.message))||'erro desconhecido')+(db?' (base de dados)':' (neste navegador)'); }
  finally{ $('suBtn').disabled = false; }
});
$('btnSair').addEventListener('click',function(){ logout(); });

/* ---------- arranque ---------- */
function watch(col){
  var c = db.collection(COL[col].path), q = (col==='users'||col==='tipos') ? c : c.orderBy('savedAt','desc').limit(500), kf = COL[col].key;
  q.onSnapshot(function(snap){
    D[col] = snap.docs.map(function(d){ return d.data(); }).filter(function(x){ return x && x[kf]; });
    sortCol(col); READY[col] = true;
    if(col==='users') decide();
    if(ME) renderLists();
  }, function(){ READY[col] = true; if(col==='users') decide(); });
}
async function boot(){
  showAuth('loading');
  try{
    if(window.claude && window.claude.use){
      db = await window.claude.use('db');
      dl = await window.claude.use('downloads');
    }
  }catch(e){ db=null; dl=null; }
  if(!db){
    Object.keys(COL).forEach(function(col){
      var kf = COL[col].key;
      D[col] = lsGet(COL[col].ls).filter(function(x){ return x && x[kf]; }); sortCol(col); READY[col] = true;
    });
    decide(); return;
  }
  Object.keys(COL).forEach(watch);
}


/* ---------- contas locais (guardadas na base de dados da página ou neste navegador) ---------- */
function loginInvalid(un){ return USER_RE.test(un) ? '' : 'Utilizador: 3 a 24 letras minúsculas, números, ponto, hífen ou sublinhado.'; }
async function createUser(name,un,role,pw){ await putDoc('users', await mkUser(name,un,role,pw)); }
async function setUserPassword(u,pw){
  var salt = newSalt(); await putDoc('users', Object.assign({},u,{salt:salt, iter:ITER, hash:await pbkdf2(pw,salt,ITER)}));
}
async function changeOwnPassword(old,nw){
  var u = userOf(ME.username); if(!u) throw new Error('conta');
  if(await pbkdf2(old,u.salt,u.iter||ITER) !== u.hash){ var e = new Error('antiga'); e.wrong = true; throw e; }
  var salt = newSalt(), nu = Object.assign({},u,{salt:salt, iter:ITER, hash:await pbkdf2(nw,salt,ITER)});
  await putDoc('users',nu); ME = nu;
}
