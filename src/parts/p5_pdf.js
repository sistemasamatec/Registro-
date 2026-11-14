/* =====================================================================
   PDF (gerado aqui, sem bibliotecas externas)
   ===================================================================== */
var PK = 595.28/794, PH = 841.89;
var WR = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
var WB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
var SPW = {'—':1000,'–':556,'·':278,'’':222,'‘':222,'“':333,'”':333,'•':350,'…':1000,'€':556,'º':365,'ª':370,' ':278};
var CP1252 = {'€':0x80,'‚':0x82,'„':0x84,'…':0x85,'‘':0x91,'’':0x92,'“':0x93,'”':0x94,'•':0x95,'–':0x96,'—':0x97,'™':0x99};
var C = {brand:'#1b3a57',teal:'#0b9bb5',lab:'#0b8aa3',ink:'#1c2b36',ink2:'#33444f',mute:'#4a5b68',rule:'#b9c8d1',pline:'#d6e2e8',soft:'#f4f9fb',foot:'#eef5f8',sign:'#8ea2af',white:'#ffffff'};
var GR1 = [[0,'#1b3a57'],[0.6,'#1f6f8b'],[1,'#0b9bb5']], GR2 = [[0,'#1b3a57'],[0.7,'#1f6f8b'],[1,'#0b9bb5']];

function chW(ch,b){
  var c = ch.charCodeAt(0), t = b?WB:WR;
  if(c>=32 && c<=126) return t[c-32];
  if(SPW[ch]!=null) return (b && (ch==='’'||ch==='‘'))?278 : SPW[ch];
  var bc = ch.normalize('NFD').charAt(0).charCodeAt(0);
  if(bc>=32 && bc<=126) return t[bc-32];
  return 556;
}
function textW(s,b,size,cs){ var w=0, n=0; for(var ch of String(s)){ w+=chW(ch,b); n++; } return w*size/1000 + (cs||0)*n; }
function pdfStr(s){
  var o='(';
  for(var ch of String(s)){
    var c = ch.charCodeAt(0);
    if(CP1252[ch]!=null) c = CP1252[ch]; else if(c>255) c = 63;
    if(c<32) c = 32;
    if(c===40||c===41||c===92) o += '\\' + String.fromCharCode(c); else o += String.fromCharCode(c);
  }
  return o+')';
}
function latin1(s){ var u=new Uint8Array(s.length); for(var i=0;i<s.length;i++) u[i]=s.charCodeAt(i)&255; return u; }
function n2(n){ return String(Math.round(n*100)/100); }
function rgbOf(h){ h=h.replace('#',''); return [0,2,4].map(function(i){ return n2(parseInt(h.substr(i,2),16)/255); }).join(' '); }
/* corta o texto com reticências para caber numa largura */
function ell(s,maxW,b,size){
  s = String(s||''); if(textW(s,b,size)<=maxW) return s;
  var out=''; for(var ch of s){ if(textW(out+ch+'…',b,size)>maxW) break; out+=ch; } return out+'…';
}

function PdfDoc(logo,sig){
  var pages=[], shades=[], ops=null;
  var X = function(x){ return n2(x*PK); }, Y = function(y){ return n2(PH - y*PK); };
  var P = function(x,y){ return X(x)+' '+Y(y); };
  var self = {};
  self.newPage = function(){ ops=[]; pages.push(ops); };
  self.setPage = function(i){ ops=pages[i]; };
  self.count = function(){ return pages.length; };
  self.rect = function(x,y,w,h,c){ ops.push(rgbOf(c)+' rg '+X(x)+' '+Y(y+h)+' '+n2(w*PK)+' '+n2(h*PK)+' re f'); };
  function rr(x,y,w,h,r){
    var k=0.5523*r, x1=x+w, y1=y+h;
    return P(x+r,y)+' m '+P(x1-r,y)+' l '+
      P(x1-r+k,y)+' '+P(x1,y+r-k)+' '+P(x1,y+r)+' c '+P(x1,y1-r)+' l '+
      P(x1,y1-r+k)+' '+P(x1-r+k,y1)+' '+P(x1-r,y1)+' c '+P(x+r,y1)+' l '+
      P(x+r-k,y1)+' '+P(x,y1-r+k)+' '+P(x,y1-r)+' c '+P(x,y+r)+' l '+
      P(x,y+r-k)+' '+P(x+r-k,y)+' '+P(x+r,y)+' c h';
  }
  self.fillRR = function(x,y,w,h,r,c){ ops.push(rgbOf(c)+' rg '+rr(x,y,w,h,r)+' f'); };
  self.strokeRR = function(x,y,w,h,r,c,lw){ ops.push(rgbOf(c)+' RG '+n2(lw*PK)+' w '+rr(x+lw/2,y+lw/2,w-lw,h-lw,r)+' S'); };
  self.line = function(x1,y1,x2,y2,c,lw){ ops.push(rgbOf(c)+' RG '+n2(lw*PK)+' w '+P(x1,y1)+' m '+P(x2,y2)+' l S'); };
  self.circle = function(cx,cy,r,c){ self.fillRR(cx-r,cy-r,2*r,2*r,r,c); };
  self.grad = function(x,y,w,h,deg,stops,r){
    var a=deg*Math.PI/180, dx=Math.sin(a), dy=-Math.cos(a), L=Math.abs(w*dx)+Math.abs(h*dy);
    var cx=x+w/2, cy=y+h/2, id=shades.length;
    shades.push({co:[X(cx-dx*L/2),Y(cy-dy*L/2),X(cx+dx*L/2),Y(cy+dy*L/2)], stops:stops});
    var path = r ? rr(x,y,w,h,r) : (X(x)+' '+Y(y+h)+' '+n2(w*PK)+' '+n2(h*PK)+' re');
    ops.push('q '+path+' W n /Sh'+id+' sh Q');
  };
  self.text = function(x,yTop,str,o){
    var s=o.s||12, f=o.f||'r', lh=o.lh||s*1.4, cs=o.cs||0;
    var fn = f==='b'?'/F2':(f==='i'?'/F3':'/F1');
    var w = textW(str,f==='b',s,cs), px = x;
    if(o.a==='r') px = x-w; else if(o.a==='c') px = x-w/2;
    var base = yTop + lh/2 + s*0.36;
    ops.push('BT '+rgbOf(o.c||'#000000')+' rg '+fn+' '+n2(s*PK)+' Tf '+n2(cs*PK)+' Tc '+P(px,base)+' Td '+pdfStr(str)+' Tj ET');
    return w;
  };
  self.sigSize = function(){ return sig ? {w:sig.w,h:sig.h} : null; };
  self.sigImage = function(x,y,w,h){ if(sig) ops.push('q '+n2(w*PK)+' 0 0 '+n2(h*PK)+' '+X(x)+' '+Y(y+h)+' cm /Im2 Do Q'); };
  self.image = function(x,y,w,h){ if(logo) ops.push('q '+n2(w*PK)+' 0 0 '+n2(h*PK)+' '+X(x)+' '+Y(y+h)+' cm /Im1 Do Q'); };

  self.finish = function(){
    var chunks=[], off=0, offs=[];
    function put(u){ chunks.push(u); off+=u.length; }
    function obj(n,dict,stream){
      offs[n]=off;
      if(stream){ put(latin1(n+' 0 obj\n<< '+dict+' /Length '+stream.length+' >>\nstream\n')); put(stream); put(latin1('\nendstream\nendobj\n')); }
      else put(latin1(n+' 0 obj\n'+dict+'\nendobj\n'));
    }
    function fn2(a,b){ return '<< /FunctionType 2 /Domain [0 1] /C0 ['+rgbOf(a)+'] /C1 ['+rgbOf(b)+'] /N 1 >>'; }
    function fnOf(st){
      if(st.length===2) return fn2(st[0][1],st[1][1]);
      var fs=[], i; for(i=0;i<st.length-1;i++) fs.push(fn2(st[i][1],st[i+1][1]));
      return '<< /FunctionType 3 /Domain [0 1] /Functions [ '+fs.join(' ')+' ] /Bounds [ '+st.slice(1,-1).map(function(s){return s[0];}).join(' ')+' ] /Encode [ '+fs.map(function(){return '0 1';}).join(' ')+' ] >>';
    }
    var sb = 8 + shades.length, base = sb + (sig?2:0);
    put(latin1('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    obj(2,'<< /Type /Pages /Kids [ '+pages.map(function(_,i){ return (base+2*i)+' 0 R'; }).join(' ')+' ] /Count '+pages.length+' >>');
    obj(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    obj(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    obj(5,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
    if(logo){
      obj(6,'/Type /XObject /Subtype /Image /Width '+logo.w+' /Height '+logo.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /SMask 7 0 R', logo.rgb);
      obj(7,'/Type /XObject /Subtype /Image /Width '+logo.w+' /Height '+logo.h+' /ColorSpace /DeviceGray /BitsPerComponent 8', logo.a);
    }else{ obj(6,'<< >>'); obj(7,'<< >>'); }
    shades.forEach(function(s,i){
      obj(8+i,'<< /ShadingType 2 /ColorSpace /DeviceRGB /Coords ['+s.co.join(' ')+'] /Function '+fnOf(s.stops)+' /Extend [true true] >>');
    });
    if(sig){
      obj(sb,'/Type /XObject /Subtype /Image /Width '+sig.w+' /Height '+sig.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /SMask '+(sb+1)+' 0 R', sig.rgb);
      obj(sb+1,'/Type /XObject /Subtype /Image /Width '+sig.w+' /Height '+sig.h+' /ColorSpace /DeviceGray /BitsPerComponent 8', sig.a);
    }
    var xo = (logo?'/Im1 6 0 R ':'')+(sig?'/Im2 '+sb+' 0 R':'');
    var res = '<< /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >>'+(xo?' /XObject << '+xo+' >>':'')+
      (shades.length?' /Shading << '+shades.map(function(_,i){ return '/Sh'+i+' '+(8+i)+' 0 R'; }).join(' ')+' >>':'')+' >>';
    pages.forEach(function(p,i){
      obj(base+2*i,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources '+res+' /Contents '+(base+2*i+1)+' 0 R >>');
      obj(base+2*i+1,'',latin1(p.join('\n')));
    });
    var total = base + 2*pages.length, xs = off, x = 'xref\n0 '+total+'\n0000000000 65535 f \n', n;
    for(n=1;n<total;n++) x += String(offs[n]).padStart(10,'0')+' 00000 n \n';
    put(latin1(x+'trailer\n<< /Size '+total+' /Root 1 0 R >>\nstartxref\n'+xs+'\n%%EOF\n'));
    return new Blob(chunks,{type:'application/pdf'});
  };
  return self;
}

/* parte um texto em linhas, com negrito/normal por palavra */
function wrapRuns(runs,maxW,s){
  var sp = textW(' ',false,s), out=[], cur=[], cw=0;
  function place(t,b){
    var w = textW(t,b,s), need = (cur.length?sp:0)+w;
    if(cur.length && cw+need>maxW){ out.push(cur); cur=[]; cw=0; }
    var lead = cur.length?sp:0; cur.push({t:t,b:b,w:w,lead:lead}); cw += lead+w;
  }
  runs.forEach(function(r){
    String(r.t).split(' ').forEach(function(wd){
      if(wd==='') return;
      if(textW(wd,r.b,s)<=maxW){ place(wd,r.b); return; }
      var piece='';
      for(var ch of wd){ if(piece && textW(piece+ch,r.b,s)>maxW){ place(piece,r.b); piece=''; } piece+=ch; }
      if(piece) place(piece,r.b);
    });
  });
  if(cur.length) out.push(cur);
  return out;
}

/* ---------- estrutura comum dos documentos (cabeçalho, caixas, secções, assinaturas, rodapé) ---------- */
function PdfKit(d,cfg){
  var K = {y:0}, FOOT=1063, LIMIT=1051, SIGN_Y=1021, secN=0, num=cfg.number||'—';
  K.head1 = function(){
    d.newPage();
    d.grad(0,0,794,138,120,GR1);
    d.image(44,28,86,86);
    d.text(150,31,'AMA TEC',{f:'b',s:30,c:C.white,cs:2,lh:33});
    d.text(150,68,'Prestação de Serviço e Comércio Geral',{s:12,c:'#eaf4f8',lh:18});
    d.text(150,94,'NIF: 5001399837  ·  Golf 2, Rua do Colégio Loidy Laura',{s:11,c:'#d6e8ef',lh:16.5});
    d.text(750,54.5,'Tel: 930 372 597 / 951 158 866',{a:'r',s:11,c:C.white,lh:16.5});
    d.text(750,71,'amatec.electronica@gmail.com',{a:'r',s:11,c:C.white,lh:16.5});
    d.text(44,160,cfg.kicker,{f:'b',s:11,c:C.lab,cs:2,lh:14});
    d.text(44,178,cfg.title,{f:'b',s:25,c:C.brand,lh:29});
    d.text(750,160,cfg.numLabel,{a:'r',s:11,c:C.mute,lh:14});
    d.text(750,175,num,{a:'r',f:'b',s:17,c:C.brand,cs:1,lh:22});
    var dw = d.text(750,197,cfg.dateStr,{a:'r',f:'b',s:11,c:C.ink,lh:14});
    var lw = d.text(750-dw,197,'Data: ',{a:'r',s:11,c:C.mute,lh:14});
    if(cfg.tag) d.text(750-dw-lw-14,197,cfg.tag,{a:'r',f:'b',s:11,c:C.ink,lh:14});
    K.y = 218;
  };
  K.cont = function(){
    d.newPage();
    d.grad(0,0,794,46,120,GR1);
    d.text(44,0,'AMA TEC',{f:'b',s:14,c:C.white,cs:2,lh:46});
    d.text(750,0,cfg.contLabel+' '+num+' · continuação',{a:'r',s:11,c:C.white,lh:46});
    K.y = 70;
  };
  K.ensure = function(h){ if(K.y+h>LIMIT) K.cont(); };
  K.gap = function(n){ K.y += n; };
  K.boxes = function(titleA,A,titleB,B){
    var bw=345, pad=14, inner=bw-2*pad;
    function lay(f){
      return f.map(function(p){
        var lab=p[0]+':', lw=textW(lab,false,11), v=String(p[1]||'').replace(/\s+/g,' ').trim();
        var L = v ? wrapRuns([{t:v,b:true}], inner-lw-6, 12) : [];
        return {lab:lab,lw:lw,v:v,L:L,h:Math.max(16,L.length*15)};
      });
    }
    function height(rows){ var h=pad+16+9+pad; rows.forEach(function(r,i){ h+=r.h+(i?9:0); }); return h; }
    var la=lay(A), lb=lay(B), bh=Math.max(height(la),height(lb));
    function draw(x,rows,title,alt){
      if(alt) d.fillRR(x,K.y,bw,bh,10,C.soft);
      d.strokeRR(x,K.y,bw,bh,10,C.pline,1);
      d.text(x+pad,K.y+pad,title,{f:'b',s:12,c:C.lab,cs:1.5,lh:16});
      var ry = K.y+pad+16+9;
      rows.forEach(function(r){
        d.text(x+pad,ry,r.lab,{s:11,c:C.mute,lh:16});
        var vx = x+pad+r.lw+6;
        if(r.v){ r.L.forEach(function(line,i){ var px=vx; line.forEach(function(w){ px+=w.lead; d.text(px,ry+i*15,w.t,{f:'b',s:12,c:C.ink,lh:15}); px+=w.w; }); }); }
        else d.line(vx,ry+r.h-1,x+bw-pad,ry+r.h-1,C.rule,1);
        ry += r.h+9;
      });
    }
    draw(44,la,titleA,false);
    draw(44+bw+16,lb,titleB,true);
    K.y += bh + 20;
  };
  K.sectionHead = function(title){
    K.ensure(26+8+30); secN++;
    d.circle(44+13,K.y+13,13,C.brand);
    d.text(44+13,K.y,String(secN),{a:'c',f:'b',s:13,c:C.white,lh:26});
    d.text(80,K.y,title,{f:'b',s:15,c:C.brand,lh:26});
    K.y += 26+8;
  };
  K.para = function(t){
    lines(t).forEach(function(ln){
      wrapRuns([{t:ln,b:false}],670,12).forEach(function(line){
        K.ensure(19.2);
        var px=80; line.forEach(function(w){ px+=w.lead; d.text(px,K.y,w.t,{s:12,c:C.ink2,lh:19.2}); px+=w.w; });
        K.y += 19.2;
      });
    });
  };
  K.bullets = function(items,boldPrefix){
    items.forEach(function(it){
      var i = boldPrefix ? it.indexOf(':') : -1;
      var runs = i>0 ? [{t:it.slice(0,i+1),b:true},{t:it.slice(i+1),b:false}] : [{t:it,b:false}];
      var L = wrapRuns(runs,656,12); if(!L.length) return;
      K.ensure(L.length*18);
      d.circle(83,K.y+9,3,C.teal);
      L.forEach(function(line,li){
        var px=94; line.forEach(function(w){ px+=w.lead; d.text(px,K.y+li*18,w.t,{f:w.b?'b':'r',s:12,c:w.b?C.ink:C.ink2,lh:18}); px+=w.w; });
      });
      K.y += L.length*18 + 6;
    });
  };
  K.valueBox = function(label,val){
    K.ensure(52);
    d.grad(80,K.y,670,52,120,GR2,10);
    d.text(100,K.y,label,{s:12,c:C.white,lh:52});
    d.text(730,K.y,val,{a:'r',f:'b',s:24,c:C.white,lh:52});
    K.y += 52;
  };
  K.infoGrid = function(items){
    var cols=3, pad=14, cw=(670-2*pad)/cols, rows=Math.ceil(items.length/cols), h=2*pad+rows*38-6;
    K.ensure(h);
    d.fillRR(80,K.y,670,h,10,C.soft); d.strokeRR(80,K.y,670,h,10,C.pline,1);
    items.forEach(function(it,i){
      var cx = 80+pad+(i%cols)*cw, cy = K.y+pad+Math.floor(i/cols)*38;
      d.text(cx,cy,it[0],{s:10.5,c:C.mute,lh:14});
      d.text(cx,cy+15,ell(it[1]||'—',cw-10,true,12),{f:'b',s:12,c:C.ink,lh:16});
    });
    K.y += h;
  };
  K.close = function(note){
    var sz = d.sigSize();
    if(K.y>((note||sz)?940:985)) K.cont();
    if(note) d.text(44,SIGN_Y-40,note,{s:11,c:C.ink2,lh:16});
    d.line(44,SIGN_Y,377,SIGN_Y,C.sign,1); d.line(417,SIGN_Y,750,SIGN_Y,C.sign,1);
    if(sz){
      var s = Math.min(250/sz.w, 64/sz.h), w = sz.w*s, h = sz.h*s;
      d.sigImage(583.5-w/2, SIGN_Y-4-h, w, h);
      if(cfg.sigDate) d.text(583.5,SIGN_Y+21,'Assinado no ecrã em '+cfg.sigDate,{a:'c',s:9.5,c:C.mute,lh:12});
    }
    d.text(210.5,SIGN_Y+6,'Técnico responsável — AMA TEC',{a:'c',s:10.5,c:C.mute,cs:0.5,lh:14});
    d.text(583.5,SIGN_Y+6,'Cliente (nome e assinatura)',{a:'c',s:10.5,c:C.mute,cs:0.5,lh:14});
    var n = d.count(), i;
    for(i=0;i<n;i++){
      d.setPage(i);
      d.rect(0,FOOT,794,60,C.foot); d.rect(0,FOOT,794,3,C.teal);
      d.text(397,FOOT+17,'AMA TEC — Assistência Técnica de Equipamentos Electrónicos',{a:'c',f:'b',s:11.5,c:C.brand,cs:0.5,lh:15});
      d.text(397,FOOT+35,'Amamos Tecnologias e Electrónica.',{a:'c',f:'i',s:10.5,c:C.mute,lh:14});
      if(n>1) d.text(750,FOOT+17,'Página '+(i+1)+' de '+n,{a:'r',s:10,c:C.mute,lh:15});
    }
    return d.finish();
  };
  return K;
}

function partyRows(X){
  return {
    A:[['Nome',X.nome],['Contacto',X.contacto],['E-mail',X.email],['Endereço',X.endereco],['NIF (opcional)',X.nif]],
    B:[['Equipamento',typeName(X.code)],['Marca',X.marca],['Capacidade',X.capacidade],['Modelo',X.modelo],['Nº de série',X.serie]]
  };
}
function buildPdf(info, logo, sig){
  var K = PdfKit(PdfDoc(logo,sig),{sigDate:fmtDateTime(S.assinadoEm),kicker:'DIAGNÓSTICO E ORÇAMENTO',title:'Relatório Técnico de Reparação',numLabel:'Nº do relatório',contLabel:'Relatório nº',
    number:info.number,dateStr:fmtDate(S.date),tag:S.os?('OS '+S.os):''});
  var pr = partyRows(S);
  K.head1(); K.boxes('DADOS DO CLIENTE',pr.A,'DADOS DO EQUIPAMENTO',pr.B);
  K.sectionHead('Descrição dos trabalhos realizados');
  if(S.intro.trim()){ K.para(S.intro); K.gap(8); }
  K.bullets(lines(S.componentes),true); K.gap(16);
  K.sectionHead('Serviços executados'); K.bullets(lines(S.servicos),false); K.gap(16);
  K.sectionHead('Valor da intervenção'); K.valueBox('Valor total da reparação', fmtKz(S.valor)||'—'); K.gap(16);
  K.sectionHead('Conclusão'); if(S.conclusao.trim()) K.para(S.conclusao); K.gap(16);
  return K.close();
}
function buildOsPdf(X, logo, sig){
  var K = PdfKit(PdfDoc(logo,sig),{sigDate:fmtDateTime(X.assinadoEm),kicker:'ASSISTÊNCIA TÉCNICA',title:'Ordem de Serviço',numLabel:'Nº da ordem',contLabel:'Ordem de serviço nº',
    number:X.number,dateStr:fmtDate(X.date),tag:''});
  var pr = partyRows(X), one = function(t){ return String(t||'').replace(/\s+/g,' ').trim(); };
  K.head1(); K.boxes('DADOS DO CLIENTE',pr.A,'DADOS DO EQUIPAMENTO',pr.B);
  K.sectionHead('Avaria reportada pelo cliente'); if(X.avaria.trim()) K.para(X.avaria); K.gap(16);
  K.sectionHead('Serviço a executar'); if(X.servico.trim()) K.para(X.servico); K.gap(16);
  var est = [];
  if(one(X.acessorios)) est.push('Acessórios entregues: '+one(X.acessorios));
  if(one(X.estadoFisico)) est.push('Estado físico à entrada: '+one(X.estadoFisico));
  if(est.length){ K.sectionHead('Estado do equipamento à entrada'); K.bullets(est,true); K.gap(16); }
  var ck = ckRows(X); if(ck.length){ K.sectionHead('Checklist de receção'); K.infoGrid(ck); K.gap(16); }
  K.sectionHead('Condições do atendimento');
  K.infoGrid([['Atendimento',X.atendimento],['Prioridade',X.prioridade],['Estado',X.estado],
    ['Técnico',userName(X.tecnico)],['Data prevista',fmtDate(X.dataPrevista)],['Orçamento estimado',fmtKz(X.orcamento)],['Sinal pago',fmtKz(X.sinal)]]);
  K.gap(16);
  if(X.observacoes.trim()){ K.sectionHead('Observações'); K.para(X.observacoes); K.gap(16); }
  return K.close('Autorizo a execução do serviço descrito nesta ordem de serviço.');
}

function loadRaw(src,maxW){
  return new Promise(function(res){
    if(!src){ res(null); return; }
    var im = new Image();
    im.onload = function(){
      try{
        var w = Math.min(maxW, im.naturalWidth||maxW), h = Math.max(1, Math.round(w*(im.naturalHeight||w)/(im.naturalWidth||w)));
        var c=document.createElement('canvas'); c.width=w; c.height=h;
        var x=c.getContext('2d'); x.drawImage(im,0,0,w,h);
        var px=x.getImageData(0,0,w,h).data, rgb=new Uint8Array(w*h*3), a=new Uint8Array(w*h), i;
        for(i=0;i<w*h;i++){ rgb[i*3]=px[i*4]; rgb[i*3+1]=px[i*4+1]; rgb[i*3+2]=px[i*4+2]; a[i]=px[i*4+3]; }
        res({w:w,h:h,rgb:rgb,a:a});
      }catch(e){ res(null); }
    };
    im.onerror = function(){ res(null); };
    im.src = src;
  });
}
function loadLogo(){ return loadRaw(LOGO,256); }
var logoP = loadLogo();

async function deliver(blob,name){
  if(dl){ await dl.save({filename:name, data:blob}); return; }
  var a = document.createElement('a'), url = URL.createObjectURL(blob);
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); },5000);
}
async function makeAndDeliver(builder,name,sigSrc,share){
  busy=true; renderHeader();
  try{
    var blob = builder(await logoP, await loadRaw(sigSrc,640));
    var shared = false;
    if(share && navigator.canShare && navigator.share){
      try{
        var file = new File([blob],name,{type:'application/pdf'});
        if(navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:name}); shared = true; }
      }catch(e){ if(e && e.name==='AbortError'){ return; } }
    }
    if(!shared){ await deliver(blob,name); toast(share ? 'Este aparelho não partilha ficheiros: o PDF foi descarregado ('+name+').' : 'PDF pronto: '+name); }
  }catch(e){
    if(!(e && e.code==='declined')) toast('Não foi possível gerar o PDF. O registo ficou guardado.');
  }finally{ busy=false; renderHeader(); }
}
