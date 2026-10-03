/* Engine phân tích: 4 trụ cột (Cơ bản, Kỹ thuật, Dòng tiền lớn, Tâm lý) -> nhận định tổng hợp. */
const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
const pct=(a,b)=>(a/b-1)*100;
const labelOf=s=>s>=62?'Tích cực':s>=45?'Trung lập':'Tiêu cực';
const verdictOf=s=>s>=68?{k:'sp',t:'Tích cực mạnh'}:s>=56?{k:'p',t:'Tích cực'}:s>=44?{k:'n',t:'Trung lập'}:s>=34?{k:'ng',t:'Tiêu cực'}:{k:'sn',t:'Tiêu cực mạnh'};


/* Xu hướng mua/bán ròng của một nhóm nhà đầu tư (khối ngoại hoặc tự doanh), đơn vị tỷ đồng. */
function tradeTrend(a,last){
  const sum=(i0,i1)=>{let t=0;for(let i=i0;i<=i1;i++)t+=a[i]||0;return t};
  const s5=sum(last-4,last),s10=sum(last-9,last),s20=sum(last-19,last),p20=sum(last-39,last-20);
  let streak=0;const sg=Math.sign(a[last]||0);if(sg)for(let i=last;i>=0&&Math.sign(a[i]||0)===sg;i--)streak+=sg;
  let label;
  if(s5>0&&s20>0)label=streak>=3?'Mua ròng liên tục':'Mua ròng';
  else if(s5>0)label='Đảo chiều sang mua';
  else if(s20>0)label='Giảm mua / chốt lời';
  else label=streak<=-3?'Bán ròng liên tục':'Bán ròng';
  const accel=Math.sign(s20)===Math.sign(p20)&&Math.abs(s20)>Math.abs(p20)*1.3?'đang tăng tốc':Math.sign(s20)===Math.sign(p20)&&Math.abs(s20)<Math.abs(p20)*.7?'đang chậm lại':'';
  return {d1:a[last]||0,s5,s10,s20,p20,streak,label,accel,series:a.slice(last-19,last+1).map(x=>x||0),dir:s5>0&&s20>0?1:s5<0&&s20<0?-1:0};
}
/* Sự kiện tự động rút ra từ dữ liệu giá / dòng tiền (không phải tin tức báo chí). */
function autoEvents(S,s,ma){
  const {C,last}=S,E=[],vol=C.map(x=>x.v),vm=Ind.sma(vol,20),fl=s.foreign;
  const fs=Math.sqrt(Ind.avg(fl.map(x=>(x||0)*(x||0)),last-59,last+1))||1;
  for(let i=last;i>last-60&&i>200;i--){
    const c=C[i],r=pct(c.c,C[i-1].c),d=c.t.slice(5).split('-').reverse().join('/');
    if(vm[i-1]&&c.v>2*vm[i-1]&&Math.abs(r)>=1.5)E.push({i,t:r>0?'pos':'neg',x:`${d}: KL đột biến ${(c.v/vm[i-1]).toFixed(1)}× TB20, giá ${r>0?'tăng':'giảm'} ${Math.abs(r).toFixed(1)}%`});
    const hi=Math.max(...C.slice(i-20,i).map(x=>x.h)),lo=Math.min(...C.slice(i-20,i).map(x=>x.l));
    if(c.c>hi)E.push({i,t:'pos',x:`${d}: Vượt đỉnh 20 phiên (${hi.toFixed(2)}) — tín hiệu breakout`});
    if(c.c<lo)E.push({i,t:'neg',x:`${d}: Thủng đáy 20 phiên (${lo.toFixed(2)}) — tín hiệu breakdown`});
    for(const [a,b] of [[20,50],[50,200]]){const x=ma[a][i]-ma[b][i],y=ma[a][i-1]-ma[b][i-1];
      if(x>0&&y<=0)E.push({i,t:'pos',x:`${d}: MA${a} cắt lên MA${b} (Golden Cross)`});
      if(x<0&&y>=0)E.push({i,t:'neg',x:`${d}: MA${a} cắt xuống MA${b} (Death Cross)`})}
    if(fl[i]>2.5*fs)E.push({i,t:'pos',x:`${d}: Khối ngoại mua ròng đột biến ${fl[i].toFixed(0)} tỷ`});
    if(fl[i]<-2.5*fs)E.push({i,t:'neg',x:`${d}: Khối ngoại bán ròng đột biến ${Math.abs(fl[i]).toFixed(0)} tỷ`});
  }
  return E.sort((a,b)=>b.i-a.i).slice(0,8);
}

function analyzeFundamental(m){
  const B=[],add=(t,x)=>B.push({t,x});
  const peS=m.pe<8?90:m.pe<12?78:m.pe<16?65:m.pe<22?50:m.pe<30?35:20;
  const pbS=clamp(100-(m.pb/(m.roe/10||.5))*30,10,95);
  const val=(peS+pbS)/2;
  const qua=m.roe>=20?90:m.roe>=15?75:m.roe>=10?55:m.roe>=6?40:25;
  const gro=m.g>=25?90:m.g>=15?75:m.g>=8?58:m.g>=0?40:22;
  const saf=m.bank?(m.risk<1.5?85:m.risk<2.2?68:m.risk<3?50:35):(m.risk<.5?85:m.risk<1?68:m.risk<1.6?50:35);
  const score=clamp(val*.3+qua*.25+gro*.25+saf*.2+(m.dy>=4?4:m.dy>=2?2:0));
  add(peS>=65?'pos':peS<=35?'neg':'neu',`P/E ${m.pe}x, P/B ${m.pb}x — định giá ${peS>=65?'hấp dẫn':peS<=35?'đắt':'hợp lý'}`);
  add(qua>=75?'pos':qua<=40?'neg':'neu',`ROE ${m.roe}% — hiệu quả sử dụng vốn ${qua>=75?'cao':qua<=40?'thấp':'trung bình'}`);
  add(gro>=75?'pos':gro<=40?'neg':'neu',`Tăng trưởng EPS ${m.g>0?'+':''}${m.g}% — ${gro>=75?'tăng trưởng mạnh':gro<=40?'chậm/đi lùi':'ổn định'}`);
  add(saf>=68?'pos':saf<=40?'neg':'neu',m.bank?`Nợ xấu (NPL) ${m.risk}% — ${saf>=68?'chất lượng tài sản tốt':saf<=40?'áp lực nợ xấu':'chấp nhận được'}`:`Nợ/Vốn chủ (D/E) ${m.risk} — ${saf>=68?'bảng cân đối lành mạnh':saf<=40?'đòn bẩy cao':'đòn bẩy vừa phải'}`);
  if(m.dy>=2)add('pos',`Cổ tức tiền mặt ~${m.dy}%/năm`);
  return {score,label:labelOf(score),bullets:B,sub:{'Định giá':val,'Chất lượng':qua,'Tăng trưởng':gro,'An toàn':saf}};
}

function analyzeTechnical(S,ma,I){
  const {C,close,last,px}=S,B=[],add=(t,x)=>B.push({t,x});
  const m=k=>ma[k][last],ks=[20,50,100,200];
  let sc=50;const above=ks.filter(k=>px>m(k));
  sc+=(above.length-2)*8;
  add(above.length>=3?'pos':above.length<=1?'neg':'neu',`Giá ${above.length}/4 đường MA (20/50/100/200) — đang ${above.length===4?'trên toàn bộ MA':above.length===0?'dưới toàn bộ MA':'nằm giữa các MA'}`);
  const bull=m(20)>m(50)&&m(50)>m(100)&&m(100)>m(200),bear=m(20)<m(50)&&m(50)<m(100)&&m(100)<m(200);
  if(bull){sc+=10;add('pos','MA sắp xếp đa đầu: MA20 > MA50 > MA100 > MA200')}
  if(bear){sc-=10;add('neg','MA sắp xếp đa không: MA20 < MA50 < MA100 < MA200')}
  const slopes=ks.map(k=>pct(m(k),ma[k][last-10])),up=slopes.filter(x=>x>0).length;
  sc+=(up-2)*3;if(up>=3)add('pos',`${up}/4 đường MA đang dốc lên`);else if(up<=1)add('neg',`Chỉ ${up}/4 đường MA dốc lên — động lượng xu hướng yếu`);
  // cắt nhau gần đây
  for(let d=last-9;d<=last;d++){const a=ma[20][d]-ma[50][d],b=ma[20][d-1]-ma[50][d-1];
    if(a>0&&b<=0){sc+=5;add('pos',`MA20 cắt lên MA50 cách đây ${last-d} phiên (Golden Cross ngắn hạn)`);break}
    if(a<0&&b>=0){sc-=5;add('neg',`MA20 cắt xuống MA50 cách đây ${last-d} phiên (Death Cross ngắn hạn)`);break}}
  const rsi=I.rsi[last];
  if(rsi>=55&&rsi<70){sc+=6;add('pos',`RSI14 ${rsi.toFixed(0)} — động lượng tăng khỏe`)}
  else if(rsi>=70&&rsi<80){sc+=2;add('neu',`RSI14 ${rsi.toFixed(0)} — vùng quá mua, thận trọng nhịp chỉnh`)}
  else if(rsi>=80){sc-=6;add('neg',`RSI14 ${rsi.toFixed(0)} — quá mua nặng`)}
  else if(rsi<30){sc-=2;add('neu',`RSI14 ${rsi.toFixed(0)} — quá bán, có thể hồi kỹ thuật`)}
  else if(rsi<40){sc-=5;add('neg',`RSI14 ${rsi.toFixed(0)} — động lượng yếu`)}
  const h=I.macd.hist;
  if(h[last]>0){sc+=5;if(h[last]>h[last-1])sc+=3;add('pos',`MACD histogram dương${h[last]>h[last-1]?' và đang mở rộng':''}`)}
  else{sc-=5;if(h[last]<h[last-1])sc-=3;add('neg',`MACD histogram âm${h[last]<h[last-1]?' và đang mở rộng xuống':''}`)}
  const score=clamp(sc,5,95);
  // pha xu hướng & kịch bản tiếp theo
  const d20=pct(px,m(20)),spread=Math.abs(pct(m(20),m(200)));
  let phase,out,txt;
  if(above.length===4&&bull){
    if(rsi>=75&&d20>8){phase='Tăng mạnh – quá nóng';out='neutral';txt='Xu hướng tăng rõ nhưng giá đã xa MA20; xác suất cao có nhịp chỉnh/tích lũy về MA20 trước khi đi tiếp.'}
    else{phase='Xu hướng tăng mạnh';out='bull';txt='Cấu trúc tăng hoàn chỉnh; kịch bản chính là tiếp tục tăng, nhịp chỉnh về MA20/MA50 là cơ hội nếu có dòng tiền hỗ trợ.'}}
  else if(px>m(200)&&px>m(50)&&px<m(20)){phase='Điều chỉnh trong xu hướng tăng';out='neutral';txt='Giá thủng MA20 nhưng còn trên MA50/MA200; vùng MA50 là hỗ trợ then chốt quyết định xu hướng tăng có được giữ.'}
  else if(px>m(200)&&px<m(50)){phase='Suy yếu';out='bear';txt='Giá mất MA50 nhưng chưa mất MA200; rủi ro điều chỉnh sâu về MA200 nếu không lấy lại MA50.'}
  else if(above.length===0){
    if(rsi<30){phase='Giảm mạnh – quá bán';out='neutral';txt='Dưới toàn bộ MA và RSI quá bán; có thể hồi kỹ thuật nhưng xu hướng chính vẫn giảm cho tới khi vượt lại MA20.'}
    else{phase='Xu hướng giảm';out='bear';txt='Giá dưới toàn bộ MA; ưu tiên phòng thủ, chỉ cải thiện khi vượt MA20 kèm dòng tiền.'}}
  else if(spread<3&&Math.abs(d20)<3){phase='Tích lũy – nén biên độ';out='neutral';txt='Các MA hội tụ, giá đi ngang; thị trường sắp chọn hướng — chờ phá vỡ kèm khối lượng.'}
  else if(px>m(200)){phase='Hồi phục / Đi ngang';out='neutral';txt='Giá vượt MA200 nhưng cấu trúc MA chưa đồng thuận; cần vượt MA50/MA100 để xác nhận tăng.'}
  else{phase='Dưới MA200 – hồi phục yếu';out='bear';txt='Giá hồi nhưng còn dưới MA200; vùng MA100/MA200 là kháng cự lớn.'}
  const lo=a=>Math.min(...C.slice(-a).map(x=>x.l)),hi=a=>Math.max(...C.slice(-a).map(x=>x.h));
  const cand=[['MA20',m(20)],['MA50',m(50)],['MA100',m(100)],['MA200',m(200)],['Đáy 20 phiên',lo(20)],['Đỉnh 20 phiên',hi(20)],['Đáy 60 phiên',lo(60)],['Đỉnh 60 phiên',hi(60)]];
  const sup=cand.filter(x=>x[1]<px).sort((a,b)=>b[1]-a[1]).slice(0,2),res=cand.filter(x=>x[1]>px).sort((a,b)=>a[1]-b[1]).slice(0,2);
  return {score,label:labelOf(score),bullets:B,phase,outlook:out,outlookText:txt,sup,res,d20,rsi,above:above.length,
    sub:{'MA':clamp(50+(above.length-2)*20+(bull?15:bear?-15:0)),'Động lượng':clamp(rsi),'MACD':h[last]>0?70:30}};
}

function analyzeFlow(S,s,I){
  const {C,last,val}=S,B=[],add=(t,x)=>B.push({t,x});
  const a5=Ind.avg(val,last-4,last+1),a20=Ind.avg(val,last-19,last+1),a60=Ind.avg(val,last-59,last+1);
  const r5=a5/a20,r20=a20/a60,ret5=pct(C[last].c,C[last-5].c),ret20=pct(C[last].c,C[last-20].c);
  const state=r5>=1.8?'Bùng nổ':r5>=1.25?'Tăng':r5>=.8?'Bình thường':r5>=.55?'Suy yếu':'Cạn kiệt';
  let nuance='';
  if(state==='Bùng nổ')nuance=ret5>=0?'Bùng nổ cùng giá tăng — lực cầu chủ động':'Bùng nổ cùng giá giảm — dấu hiệu xả hàng';
  else if(state==='Cạn kiệt')nuance=ret20<-5?'Cạn cung sau nhịp giảm — có thể sắp tạo đáy':'Thanh khoản cạn — thiếu lực dẫn dắt';
  else if(state==='Tăng')nuance=ret5>=0?'Dòng tiền vào tăng dần, giá hưởng lợi':'Thanh khoản tăng nhưng giá giảm — áp lực bán';
  else if(state==='Suy yếu')nuance=ret20>5?'Giá tăng nhưng thanh khoản co lại — phân kỳ, thiếu bền vững':'Dòng tiền đang rút dần';
  else nuance='Thanh khoản ở mức trung bình';
  const big=[];for(let i=last-19;i<=last;i++)big.push((s.foreign[i]||0)+(s.prop[i]||0));
  const v10=Ind.avg(val,last-9,last+1)*10,v20=a20*20;
  const bm10=big.slice(10).reduce((x,y)=>x+y,0),bm20=big.reduce((x,y)=>x+y,0);
  const bp10=bm10/v10*100,bp20=bm20/v20*100;
  let acc=0,dist=0;for(let i=last-19;i<=last;i++){const r=pct(C[i].c,C[i-1].c),vv=C[i].v;if(vv>1.3*Ind.avg(C.map(x=>x.v),last-19,last+1)&&Math.abs(r)>.5){r>0?acc++:dist++}}
  const cmf=Ind.cmf(C,20),mfi=Ind.mfi(C,14);
  let sc=50+cmf*55+bp10*3+(acc-dist)*3;
  if(state==='Bùng nổ')sc+=ret5>=0?8:-10;else if(state==='Tăng')sc+=ret5>=0?4:-4;
  else if(state==='Cạn kiệt')sc+=ret20<-5?3:-4;else if(state==='Suy yếu')sc+=ret20>5?-4:-1;
  const score=clamp(sc,5,95);
  add(state==='Bùng nổ'?(ret5>=0?'pos':'neg'):state==='Cạn kiệt'||state==='Suy yếu'?'neg':'neu',`GTGD 5 phiên = ${r5.toFixed(2)}× TB 20 phiên (${state}) — ${nuance}`);
  add(r20>=1.15?'pos':r20<=.85?'neg':'neu',`GTGD TB 20 phiên = ${r20.toFixed(2)}× TB 60 phiên`);
  const fn=tradeTrend(s.foreign,last),pr=tradeTrend(s.prop,last),tag=x=>x.dir>0?'pos':x.dir<0?'neg':'neu',sgn=x=>(x>=0?'+':'')+x.toFixed(0);
  add(tag(fn),`Khối ngoại: ${fn.label}${fn.accel?' ('+fn.accel+')':''} — 5 phiên ${sgn(fn.s5)} tỷ, 20 phiên ${sgn(fn.s20)} tỷ`);
  if(!s.est)add(tag(pr),`Tự doanh: ${pr.label}${pr.accel?' ('+pr.accel+')':''} — 5 phiên ${sgn(pr.s5)} tỷ, 20 phiên ${sgn(pr.s20)} tỷ`);
  if(!s.est&&fn.dir*pr.dir<0)add('neu','Khối ngoại và tự doanh đang đi ngược chiều nhau — tín hiệu dòng tiền lớn chưa đồng thuận');
  if(!s.est&&fn.dir>0&&pr.dir>0)add('pos','Khối ngoại và tự doanh cùng mua ròng — dòng tiền lớn đồng thuận');
  if(!s.est&&fn.dir<0&&pr.dir<0)add('neg','Khối ngoại và tự doanh cùng bán ròng — áp lực từ dòng tiền lớn');
  add(acc>dist?'pos':acc<dist?'neg':'neu',`20 phiên: ${acc} phiên gom (tăng + vol lớn) vs ${dist} phiên phân phối (giảm + vol lớn)`);
  add(cmf>.08?'pos':cmf<-.08?'neg':'neu',`CMF20 = ${cmf.toFixed(2)} — ${cmf>.08?'dòng tiền vào':cmf<-.08?'dòng tiền ra':'cân bằng'}; MFI14 = ${mfi.toFixed(0)}`);
  return {score,label:labelOf(score),bullets:B,state,nuance,r5,r20,bm10,bm20,bp10,acc,dist,cmf,mfi,fn,pr,
    sub:{'CMF':clamp(50+cmf*150),'Khối ngoại+TD':clamp(50+bp10*10),'Gom/Phân phối':clamp(50+(acc-dist)*12)}};
}

function analyzeSentiment(S,I){
  const {C,last,close}=S,B=[],add=(t,x)=>B.push({t,x});
  const rsi=I.rsi[last],ma20=Ind.avg(close,last-19,last+1),d20=pct(close[last],ma20);
  let up=0,dn=0,streak=0;for(let i=last-9;i<=last;i++){C[i].c>=C[i-1].c?up+=C[i].v:dn+=C[i].v}
  for(let i=last;i>0&&C[i].c>C[i-1].c;i--)streak++;
  const ret10=pct(close[last],close[last-10]);
  const volat=Math.sqrt(Ind.avg(close.map((c,i)=>i?Math.pow(c/close[i-1]-1,2):0),last-9,last+1))*100;
  const volat60=Math.sqrt(Ind.avg(close.map((c,i)=>i?Math.pow(c/close[i-1]-1,2):0),last-59,last+1))*100;
  const upShare=up/(up+dn);
  const idx=clamp(rsi*.35+clamp(50+d20*4)*.2+upShare*100*.2+clamp(50+ret10*3)*.15+clamp(50-(volat/volat60-1)*40)*.1);
  const lbl=idx<20?'Hoảng loạn':idx<40?'Sợ hãi':idx<60?'Trung lập':idx<80?'Hưng phấn':'Cực kỳ hưng phấn';
  // Điểm cho nhận định: ưu tiên tâm lý lạc quan vừa phải, cảnh báo ở thái cực (contrarian)
  const sc=idx<15?42:idx<30?38:idx<45?45:idx<60?55:idx<72?72:idx<82?58:30;
  add(idx>=80?'neg':idx>=60?'pos':idx<=30?'neu':'neu',`Chỉ số tâm lý đám đông ${idx.toFixed(0)}/100 — ${lbl}`);
  add(upShare>=.6?'pos':upShare<=.4?'neg':'neu',`KL phiên tăng chiếm ${(upShare*100).toFixed(0)}% tổng KL 10 phiên — ${upShare>=.6?'bên mua chiếm ưu thế':upShare<=.4?'bên bán áp đảo':'cân bằng'}`);
  add(Math.abs(d20)>8?'neg':'neu',`Giá ${d20>=0?'cao hơn':'thấp hơn'} MA20 ${Math.abs(d20).toFixed(1)}%${d20>8?' — dễ FOMO/quá nóng':d20<-8?' — bán tháo, có thể quá đà':''}`);
  if(streak>=4)add('neg',`${streak} phiên tăng liên tiếp — tâm lý đuổi giá`);
  add(volat>volat60*1.3?'neg':'neu',`Biến động 10 phiên ${volat.toFixed(2)}% vs 60 phiên ${volat60.toFixed(2)}%${volat>volat60*1.3?' — tâm lý bất ổn':''}`);
  if(idx>=80)add('neg','Thái cực hưng phấn thường đi trước nhịp điều chỉnh (tín hiệu contrarian)');
  if(idx<=20)add('pos','Thái cực sợ hãi — vùng thường xuất hiện đáy ngắn hạn (tín hiệu contrarian)');
  return {score:sc,label:labelOf(sc),bullets:B,idx,lbl,sub:{'RSI':clamp(rsi),'Lực mua/bán':upShare*100,'Khoảng cách MA20':clamp(50+d20*4)}};
}

function analyze(m,s){
  const C=s.candles,n=C.length,close=C.map(x=>x.c),val=C.map(x=>x.c*x.v/1e6);
  const S={C,close,val,last:n-1,px:close[n-1]};
  const ma={};[20,50,100,200].forEach(k=>ma[k]=Ind.sma(close,k));
  const I={rsi:Ind.rsi(close),macd:Ind.macd(close)};
  const fa=analyzeFundamental(m),te=analyzeTechnical(S,ma,I),fl=analyzeFlow(S,s,I),se=analyzeSentiment(S,I);
  const total=fa.score*.2+te.score*.35+fl.score*.25+se.score*.2;
  const verdict=verdictOf(total);
  const all=[['Cơ bản',fa],['Kỹ thuật',te],['Dòng tiền lớn',fl],['Tâm lý',se]];
  const pos=[],neg=[];all.forEach(([k,p])=>p.bullets.forEach(b=>{(b.t==='pos'?pos:b.t==='neg'?neg:[]).push(`[${k}] ${b.x}`)}));
  const summary=`${m.t} được nhận định "${verdict.t}" (${total.toFixed(0)}/100). Kỹ thuật: ${te.phase.toLowerCase()}; dòng tiền: ${fl.state.toLowerCase()}; tâm lý: ${se.lbl.toLowerCase()}; cơ bản: ${fa.label.toLowerCase()}.`;
  const chg=k=>pct(close[n-1],close[n-1-k]);
  const res={m,s,C,ma,I,fa,te,fl,se,total,verdict,pos,neg,summary,events:autoEvents(S,s,ma),px:close[n-1],d1:chg(1),d5:chg(5),d20:chg(20)};res.sig=strongSignal(res);return res;
}

/* Radar tín hiệu xu hướng mạnh (Pro): chấm 5 tiêu chí từ kết quả phân tích sẵn có. Chỉ là phân tích xu hướng, không phải khuyến nghị đầu tư. */
function strongSignal(r){
  const {te,fl,se}=r,est=r.s.est,T=(typeof CONFIG!=='undefined'&&CONFIG.proTiers)||{strong:5,good:4},sg=x=>(x>=0?'+':'')+x.toFixed(0);
  const checks=[
    {k:'trend',label:'Xu hướng mạnh',ok:te.score>=70&&te.above>=3&&te.outlook!=='bear',detail:`Kỹ thuật ${te.score.toFixed(0)}/100 · ${te.above}/4 MA · ${te.phase}`},
    {k:'verdict',label:'Nhận định tích cực',ok:r.total>=62,detail:`${r.verdict.t} (${r.total.toFixed(0)}/100)`},
    {k:'flow',label:'Dòng tiền mạnh',ok:(fl.state==='Bùng nổ'||fl.state==='Tăng')&&fl.score>=62&&fl.cmf>0,detail:`${fl.state} · GTGD ${fl.r5.toFixed(2)}× · CMF ${fl.cmf.toFixed(2)}`},
    {k:'big',label:est?'Khối ngoại mua mạnh (ước tính)':'Khối ngoại + tự doanh cùng mua mạnh',
      ok:est?fl.fn.dir>0&&fl.bp10>=1:fl.fn.dir>0&&fl.pr.dir>0&&fl.bp10>=1,
      detail:est?`NN 5 phiên ${sg(fl.fn.s5)} tỷ (ước tính)`:`NN ${sg(fl.fn.s5)} tỷ · TD ${sg(fl.pr.s5)} tỷ (5 phiên) · ${fl.bp10.toFixed(1)}% GTGD`},
    {k:'senti',label:'Tâm lý đám đông tốt',ok:se.idx>=55&&se.idx<80,detail:`Chỉ số ${se.idx.toFixed(0)}/100 · ${se.lbl}`}
  ];
  const n=checks.filter(c=>c.ok).length;const tier=n>=T.strong?'strong':n>=T.good?'good':null;
  return {checks,n,tier,strong:tier==='strong',good:tier==='good',locked:!!tier,tierLabel:tier==='strong'?'Tín hiệu mạnh':tier==='good'?'Tín hiệu tốt':''};
}
