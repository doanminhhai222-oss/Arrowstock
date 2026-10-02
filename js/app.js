const $=s=>document.querySelector(s),app=$('#app');
const f=(n,d=2)=>n.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});
const sg=n=>(n>=0?'+':'')+f(n)+'%',cl=n=>n>=0?'up':'dn';
const scCls=s=>s>=62?'s-p':s>=45?'s-n':'s-ng',scCol=s=>s>=62?'var(--up)':s>=45?'var(--warn)':'var(--dn)';
const scBar=s=>`<div class="sc ${scCls(s)}"><span>${s.toFixed(0)}</span><i style="--w:${s}%"></i></div>`;
const flowCls=s=>({'Bùng nổ':'bn','Tăng':'t','Bình thường':'','Suy yếu':'sy','Cạn kiệt':'ck'})[s];
let R=[],MKT=null,state={q:'',sector:'',verdict:'',sort:'total',dir:-1,chart:null};

async function load(){
  try{const r=await fetch('data/market.json',{cache:'no-store'});if(!r.ok)throw 0;MKT=await r.json()}catch(e){MKT=buildSimMarket()}
  R=VN30.filter(m=>MKT.stocks[m.t]).map(m=>analyze(m,normalize(MKT.stocks[m.t])));
  const live=MKT.source!=='sim';
  $('#srcBadge').className='badge '+(live?'live':'sim');$('#srcBadge').textContent=live?'Dữ liệu thực':'Dữ liệu MÔ PHỎNG';
  $('#asOf').textContent='Phiên '+MKT.asOf;route();
}
/* Nếu nguồn thật không có khối ngoại/tự doanh -> ước tính từ vị trí đóng cửa (CLV × GTGD), gắn cờ est. */
function normalize(s){
  if(s.foreign&&s.prop)return s;
  const e=s.candles.map(c=>+(Ind.clv(c)*c.c*c.v/1e6*.3).toFixed(2));
  return {...s,foreign:e,prop:e.map(()=>0),est:true};
}

function route(){
  const h=location.hash.replace(/^#\/?/,'');window.scrollTo(0,0);
  const r=R.find(x=>x.m.t===h.toUpperCase());r?detail(r):dash();
}
addEventListener('hashchange',route);

/* ---------- DASHBOARD ---------- */
function dash(){
  const cnt=k=>R.filter(r=>r.verdict.k===k).length,pos=cnt('sp')+cnt('p'),neg=cnt('ng')+cnt('sn');
  const burst=R.filter(r=>r.fl.state==='Bùng nổ'),dry=R.filter(r=>r.fl.state==='Cạn kiệt');
  const avgSe=R.reduce((a,r)=>a+r.se.idx,0)/R.length,above=R.reduce((a,r)=>a+(r.te.above>=3),0);
  const totCap=R.reduce((a,r)=>a+r.m.cap,0),wChg=R.reduce((a,r)=>a+r.d1*r.m.cap,0)/totCap;
  const sects=[...new Set(VN30.map(m=>m.s))].sort();
  const seg=[['sp','#16a34a'],['p','#22c55e'],['n','#64748b'],['ng','#f87171'],['sn','#b91c1c']];
  app.innerHTML=`
  <div class="grid g4">
    <div class="card"><h3>Nhận định VN30</h3><div class="big ${pos>neg?'up':pos<neg?'dn':''}">${pos} tích cực · ${neg} tiêu cực</div>
      <div class="dist">${seg.map(([k,c])=>`<i style="width:${cnt(k)/R.length*100}%;background:${c}"></i>`).join('')}</div><div class="sub">${cnt('sp')} mạnh · ${cnt('p')} tích cực · ${cnt('n')} trung lập · ${cnt('ng')} tiêu cực · ${cnt('sn')} rất xấu</div></div>
    <div class="card"><h3>Biến động rổ (trọng số vốn hóa)</h3><div class="big ${cl(wChg)}">${sg(wChg)}</div><div class="sub">${above}/30 mã đang trên ≥3 đường MA (20/50/100/200)</div></div>
    <div class="card"><h3>Dòng tiền</h3><div class="big"><span class="up">${burst.length}</span> bùng nổ · <span class="dn">${dry.length}</span> cạn kiệt</div>
      <div class="sub">Bùng nổ: ${burst.map(r=>r.m.t).join(', ')||'—'}<br>Cạn kiệt: ${dry.map(r=>r.m.t).join(', ')||'—'}</div></div>
    <div class="card"><h3>Tâm lý đám đông (TB)</h3><div class="big ${avgSe>=60?'up':avgSe<40?'dn':'wr'}">${avgSe.toFixed(0)}/100</div>
      <div class="sub">${avgSe<20?'Hoảng loạn':avgSe<40?'Sợ hãi':avgSe<60?'Trung lập':avgSe<80?'Hưng phấn':'Cực kỳ hưng phấn'} · ${R.filter(r=>r.se.idx>=80).length} mã quá nóng, ${R.filter(r=>r.se.idx<=20).length} mã hoảng loạn</div></div>
  </div>
  <div class="toolbar">
    <input id="q" placeholder="Tìm mã / tên công ty…" value="${state.q}">
    <select id="sec"><option value="">Mọi ngành</option>${sects.map(s=>`<option ${state.sector===s?'selected':''}>${s}</option>`).join('')}</select>
    ${[['','Tất cả'],['pos','Tích cực'],['neu','Trung lập'],['neg','Tiêu cực'],['burst','Dòng tiền bùng nổ'],['dry','Dòng tiền cạn kiệt']].map(([k,t])=>`<button class="chip ${state.verdict===k?'on':''}" data-v="${k}">${t}</button>`).join('')}
  </div>
  <div class="tw"><table><thead><tr>
    ${[['t','Mã','l'],['px','Giá'],['d1','%1D'],['d5','%5D'],['d20','%1T'],['phase','Xu hướng','l'],['flow','Dòng tiền','l'],['fa','Cơ bản'],['te','Kỹ thuật'],['fl','DT lớn'],['se','Tâm lý'],['total','Nhận định','l']].map(([k,t,c])=>`<th class="${c||''}" data-s="${k}">${t}${state.sort===k?(state.dir<0?' ▼':' ▲'):''}</th>`).join('')}
  </tr></thead><tbody id="rows"></tbody></table></div>
  <div class="legend">Điểm 0–100: <span class="s-p">■ ≥62 tích cực</span> · <span class="s-n">■ 45–61 trung lập</span> · <span class="s-ng">■ &lt;45 tiêu cực</span>. Tổng hợp = Kỹ thuật 35% + Dòng tiền lớn 25% + Cơ bản 20% + Tâm lý 20%. Bấm một mã để xem phân tích chi tiết.</div>`;
  $('#q').oninput=e=>{state.q=e.target.value;rows()};$('#sec').onchange=e=>{state.sector=e.target.value;rows()};
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{state.verdict=b.dataset.v;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));rows()});
  document.querySelectorAll('th').forEach(th=>th.onclick=()=>{const k=th.dataset.s;state.dir=state.sort===k?-state.dir:(k==='t'||k==='phase'?1:-1);state.sort=k;dash()});
  rows();
}
const key=(r,k)=>({t:r.m.t,px:r.px,d1:r.d1,d5:r.d5,d20:r.d20,phase:r.te.phase,flow:r.fl.r5,fa:r.fa.score,te:r.te.score,fl:r.fl.score,se:r.se.score,total:r.total})[k];
function rows(){
  const q=state.q.trim().toLowerCase(),v=state.verdict;
  let L=R.filter(r=>(!q||r.m.t.toLowerCase().includes(q)||r.m.n.toLowerCase().includes(q))&&(!state.sector||r.m.s===state.sector)&&
    (!v||(v==='pos'&&['sp','p'].includes(r.verdict.k))||(v==='neu'&&r.verdict.k==='n')||(v==='neg'&&['ng','sn'].includes(r.verdict.k))||(v==='burst'&&r.fl.state==='Bùng nổ')||(v==='dry'&&r.fl.state==='Cạn kiệt')));
  L.sort((a,b)=>{const x=key(a,state.sort),y=key(b,state.sort);return(x>y?1:x<y?-1:0)*state.dir});
  $('#rows').innerHTML=L.map(r=>`<tr data-t="${r.m.t}">
    <td class="l"><div class="tk">${r.m.t}</div><div class="tn">${r.m.n}</div></td>
    <td>${f(r.px)}</td><td class="${cl(r.d1)}">${sg(r.d1)}</td><td class="${cl(r.d5)}">${sg(r.d5)}</td><td class="${cl(r.d20)}">${sg(r.d20)}</td>
    <td class="l">${r.te.phase}</td>
    <td class="l"><span class="fs ${flowCls(r.fl.state)}">${r.fl.state}</span> <span class="muted">${r.fl.r5.toFixed(2)}×</span></td>
    <td>${scBar(r.fa.score)}</td><td>${scBar(r.te.score)}</td><td>${scBar(r.fl.score)}</td><td>${scBar(r.se.score)}</td>
    <td class="l"><span class="vd ${r.verdict.k}">${r.verdict.t}</span> <span class="muted">${r.total.toFixed(0)}</span></td></tr>`).join('')||'<tr><td colspan="12" class="l muted">Không có mã phù hợp.</td></tr>';
  document.querySelectorAll('#rows tr[data-t]').forEach(tr=>tr.onclick=()=>location.hash='#/'+tr.dataset.t);
}

/* ---------- CHI TIẾT ---------- */
const bl=a=>`<ul class="b">${a.map(b=>`<li class="${b.t}">${b.x}</li>`).join('')}</ul>`;
const subs=o=>`<div class="subs">${Object.entries(o).map(([k,v])=>`<div><span>${k}</span><div class="bar"><i style="width:${v}%;background:${scCol(v)}"></i></div><span>${v.toFixed(0)}</span></div>`).join('')}</div>`;
const pillar=(title,p,extra='')=>`<div class="card"><div class="pill"><h2>${title}</h2><span class="n" style="color:${scCol(p.score)}">${p.score.toFixed(0)} · ${p.label}</span></div>${extra}${subs(p.sub)}${bl(p.bullets)}</div>`;
function detail(r){
  const {m,te,fl,fa,se}=r,col=scCol(r.total),oc={bull:'up',bear:'dn',neutral:'wr'}[te.outlook],ot={bull:'Thiên hướng TĂNG',bear:'Thiên hướng GIẢM',neutral:'TRUNG LẬP / chờ xác nhận'}[te.outlook];
  const est=r.s.est?'<div class="sub wr">⚠ Nguồn không có dữ liệu khối ngoại/tự doanh — đang dùng ước tính từ vị trí đóng cửa.</div>':'';
  app.innerHTML=`<a class="back" href="#/">← Danh sách VN30</a>
  <div class="dh"><div><h1>${m.t} <span class="muted" style="font-size:16px;font-weight:400">${m.n} · ${m.s}</span></h1>
    <div><span class="px">${f(r.px)}</span> <span class="${cl(r.d1)}">${sg(r.d1)}</span> <span class="muted">· 5D <b class="${cl(r.d5)}">${sg(r.d5)}</b> · 1T <b class="${cl(r.d20)}">${sg(r.d20)}</b> · Vốn hóa ~${m.cap} nghìn tỷ</span></div></div>
    <div style="display:flex;gap:14px;align-items:center"><span class="vd ${r.verdict.k}" style="font-size:16px;padding:6px 16px">${r.verdict.t}</span><div class="ring" style="--v:${r.total};--c:${col}"><div>${r.total.toFixed(0)}</div></div></div></div>
  <div class="verdict-box" style="--c:${col}"><b>Nhận định tổng hợp.</b> ${r.summary}
    <div class="grid g2" style="margin-top:10px"><div><b class="up">Điểm cộng</b>${bl(r.pos.slice(0,5).map(x=>({t:'pos',x})))}</div><div><b class="dn">Rủi ro</b>${bl(r.neg.slice(0,5).map(x=>({t:'neg',x})))}</div></div></div>
  <div class="card"><div class="ctl">
    ${[60,120,250].map(n=>`<button class="chip ${n===120?'on':''}" data-r="${n}">${n===60?'3 tháng':n===120?'6 tháng':'1 năm'}</button>`).join('')}
    <span style="width:10px"></span>${[20,50,100,200].map(k=>`<button class="chip on" data-m="${k}"><span class="dot" style="background:${MA_COL[k]}"></span>MA${k}</button>`).join('')}</div>
    <div class="chart-wrap"><canvas id="cv"></canvas><div class="tt" id="tt"></div></div>${est}</div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><div class="pill"><h2>Xu hướng tiếp theo (MA 20/50/100/200)</h2><span class="n ${oc}">${ot}</span></div>
      <div><b>${te.phase}</b> — ${te.outlookText}</div>
      <div class="kv" style="margin-top:10px">${[20,50,100,200].map(k=>`<span>MA${k}</span><span>${f(r.ma[k].at(-1))} <small class="${cl(r.px-r.ma[k].at(-1))}">(${sg((r.px/r.ma[k].at(-1)-1)*100)})</small></span>`).join('')}</div>
      <div style="margin-top:10px" class="sub">Hỗ trợ gần:</div><div class="lv">${te.sup.map(([n,v])=>`<span class="dn">${n} ${f(v)}</span>`).join('')||'<span>—</span>'}</div>
      <div class="sub">Kháng cự gần:</div><div class="lv">${te.res.map(([n,v])=>`<span class="up">${n} ${f(v)}</span>`).join('')||'<span>—</span>'}</div>
      <div class="sub">Kịch bản: nếu giá đóng cửa vượt kháng cự đầu tiên kèm khối lượng > TB20 → xu hướng tăng được củng cố; nếu thủng hỗ trợ gần nhất → chuyển sang điều chỉnh/giảm.</div></div>
    <div class="card"><div class="pill"><h2>Trạng thái dòng tiền</h2><span class="fs ${flowCls(fl.state)}" style="font-size:16px">${fl.state}</span></div>
      <div>${fl.nuance}.</div>
      <div class="kv" style="margin-top:10px"><span>GTGD TB5 / TB20</span><span>${fl.r5.toFixed(2)}×</span><span>GTGD TB20 / TB60</span><span>${fl.r20.toFixed(2)}×</span>
        <span>Dòng tiền lớn 10 phiên</span><span class="${cl(fl.bm10)}">${fl.bm10>=0?'+':''}${f(fl.bm10,0)} tỷ</span><span>Dòng tiền lớn 20 phiên</span><span class="${cl(fl.bm20)}">${fl.bm20>=0?'+':''}${f(fl.bm20,0)} tỷ</span>
        <span>CMF20 / MFI14</span><span>${fl.cmf.toFixed(2)} / ${fl.mfi.toFixed(0)}</span><span>Phiên gom / phân phối</span><span>${fl.acc} / ${fl.dist}</span></div>
      <div class="sub" style="margin-top:8px">Phân loại theo GTGD 5 phiên so với TB 20 phiên: ≥1.8× Bùng nổ · ≥1.25× Tăng · 0.8–1.25× Bình thường · 0.55–0.8× Suy yếu · &lt;0.55× Cạn kiệt.</div></div>
  </div>
  <div class="grid g2" style="margin-top:14px">${pillar('Phân tích Kỹ thuật',te)}${pillar('Đo lường Dòng tiền lớn',fl)}${pillar('Phân tích Cơ bản',fa)}${pillar('Tâm lý đám đông',se,`<div class="sub">Chỉ số ${se.idx.toFixed(0)}/100 — <b>${se.lbl}</b> (0 = hoảng loạn, 100 = cực kỳ hưng phấn)</div>`)}</div>`;
  const ch=state.chart=new StockChart($("#cv"),$("#tt"));
  ch.set({C:r.C,ma:r.ma,s:r.s});
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{ch.range=+b.dataset.r;document.querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('on',x===b));ch.draw()});
  document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const k=b.dataset.m;ch.show[k]=ch.show[k]?0:1;b.classList.toggle('on',!!ch.show[k]);ch.draw()});
}
load();
