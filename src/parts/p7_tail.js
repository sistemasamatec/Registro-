resetStates(); initForms(); syncAll();
if(window.ResizeObserver){
  new ResizeObserver(fit).observe($('sheetWrap'));
  new ResizeObserver(fit).observe($('paper'));
}
window.addEventListener('resize',fit);
boot();
window.__amatec = {buildPdf:buildPdf, buildOsPdf:buildOsPdf, getS:function(){return S;}, getO:function(){return O;}, logoP:logoP, D:D};
