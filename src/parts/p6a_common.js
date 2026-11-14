/* =====================================================================
   ENTRADA: criação do administrador, login, sessão, arranque
   ===================================================================== */
function applyWho(){
  if(!ME) return;
  $('whoName').textContent = ME.name;
  $('whoRole').textContent = isAdmin() ? 'Administrador' : 'Técnico';
  $('navAdm').hidden = !isAdmin();
}
function showAuth(mode){
  $('appView').hidden = true; $('authView').hidden = false;
  $('authLoading').hidden = mode!=='loading';
  $('loginForm').hidden = mode!=='login';
  $('setupForm').hidden = mode!=='setup';
  $('forgotForm').hidden = mode!=='forgot'; $('resetForm').hidden = mode!=='reset';
  $('authSub').textContent = mode==='setup' ? 'Primeiro acesso' : (mode==='forgot' ? 'Recuperar senha' : mode==='reset' ? 'Nova senha' : mode==='login' ? 'Entrar na oficina' : 'A carregar…');
  if(mode==='login') setTimeout(function(){ try{ $('lgUser').focus(); }catch(e){} },50);
  if(mode==='forgot') setTimeout(function(){ try{ $('fgUser').focus(); }catch(e){} },50);
  if(mode==='setup') setTimeout(function(){ try{ $('suName').focus(); }catch(e){} },50);
}
function enterApp(u){
  ME = u; sessSet(u.username);
  $('authView').hidden = true; $('appView').hidden = false;
  ['lgPass','suPass','suPass2'].forEach(function(id){ $(id).value=''; });
  applyWho(); refreshSelects(); syncAll(); renderLists(); showView('home'); tab('form'); fit();
}
