const $=s=>document.querySelector(s),app=$('#app');
const f=(n,d=2)=>n.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});
const sg=n=>(n>=0?'+':'')+f(n)+'%',cl=n=>n>=0?'up':'dn',ty=n=>(n>=0?'+':'')+f(n,0);
const scCls=s=>s>=62?'s-p':s>=45?'s-n':'s-ng',scCol=s=>s>=62?'var(--up)':s>=45?'#d89a1d':'var(--dn)';
const scBar=s=>`<div class="sc ${scCls(s)}"><span>${s.toFixed(0)}</span><i style="--w:${s}%"></i></div>`;
const flowCls=s=>({'Bùng nổ':'bn','Tăng':'t','Bình thường':'','Suy yếu':'sy','Cạn kiệt':'ck'})[s];
let R=[],MKT=null,NEWS={},state={q:'',sector:'',verdict:'',sort:'total',dir:-1,range:120};

/* ---------- lưu trữ cục bộ (watchlist, ghi chú) ---------- */
const mem={};
const store={get(k,d){try{const v=localStorage.getItem('arrowstock.'+k);return v?JSON.parse(v):d}catch(e){return mem[k]??d}},
  set(k,v){try{localStorage.setItem('arrowstock.'+k,JSON.stringify(v))}catch(e){mem[k]=v}}};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Nhiều watchlist có tên: [{id,name,tickers}] — tự chuyển từ watchlist cũ nếu có */
function lists(){let L=store.get('lists',null);if(!L){L=[{id:'l1',name:'Watchlist của tôi',tickers:store.get('wl',[])}];store.set('lists',L)}return L}
const activeId=()=>{const L=lists(),a=store.get('activeList','');return L.find(x=>x.id===a)?a:L[0].id};
const curList=()=>lists().find(x=>x.id===activeId());
const VR=()=>proStatus().active?R:R.filter(r=>!r.sig.locked);
const WL=()=>curList().tickers,inWL=t=>WL().includes(t);
function toggleIn(id,t){const L=lists(),l=L.find(x=>x.id===id),i=l.tickers.indexOf(t);i<0?l.tickers.push(t):l.tickers.splice(i,1);store.set('lists',L);updNav()}
const toggleWL=t=>toggleIn(activeId(),t);
function nameOk(n,exceptId){n=(n||'').trim().slice(0,30);if(!n)return null;if(lists().some(l=>l.id!==exceptId&&l.name.toLowerCase()===n.toLowerCase())){alert('Tên này đã có, hãy chọn tên khác.');return null}return n}
function updNav(){const n=WL().length;$('#wlc').textContent=n?`(${n})`:'';$('#prob').textContent=proStatus().active?'🔓':''}

async function load(){
  if(window.MARKET_DATA)MKT=window.MARKET_DATA;
  else try{const r=await fetch('data/market.json',{cache:'no-store'});if(!r.ok)throw 0;MKT=await r.json()}catch(e){MKT=buildSimMarket()}
  try{const r=await fetch('data/news.json',{cache:'no-store'});if(r.ok)NEWS=await r.json()}catch(e){}
  R=VN30.filter(m=>MKT.stocks[m.t]).map(m=>analyze(m,normalize(MKT.stocks[m.t])));
  const live=MKT.source!=='sim';
  $('#srcBadge').className='badge '+(live?'live':'sim');$('#srcBadge').textContent=live?'Dữ liệu thực':'Dữ liệu MÔ PHỎNG';
  $('#asOf').textContent='Phiên '+MKT.asOf;updNav();route();
}
/* Nếu nguồn thật không có khối ngoại/tự doanh -> ước tính từ vị trí đóng cửa (CLV × GTGD), gắn cờ est. */
function normalize(s){
  if(s.foreign&&s.prop)return s;
  const e=s.candles.map(c=>+(Ind.clv(c)*c.c*c.v/1e6*.3).toFixed(2));
  return {...s,foreign:e,prop:e.map(()=>0),est:true};
}
function route(){
  const h=location.hash.replace(/^#\/?/,'');window.scrollTo(0,0);
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.n===(h==='watchlist'||h==='guide'||h==='pro'?h:(R.find(x=>x.m.t===h.toUpperCase())?'x':''))));
  window.__wlrefresh=null;const r=R.find(x=>x.m.t===h.toUpperCase());
  if(h==='guide')guide();else if(h==='pro')proPage();else if(h==='watchlist')dash(true);else if(r)(VR().includes(r)?detail(r):lockedPage());else dash(false);
}
addEventListener('hashchange',route);

/* ---------- tiện ích hiển thị ---------- */
const starBtn=t=>`<button class="star ${inWL(t)?'on':''}" data-star="${t}" title="Thêm/bỏ khỏi: ${esc(curList().name)}">${inWL(t)?'★':'☆'}</button>`;
function bindStars(root){root.querySelectorAll('[data-star]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleWL(b.dataset.star);
  const on=inWL(b.dataset.star);b.classList.toggle('on',on);b.textContent=on?'★':'☆';if(location.hash==='#/watchlist')dash(true);if(window.__wlrefresh)window.__wlrefresh()})}
const netCell=(x,est)=>est?'<span class="muted">~'+ty(x.s5)+'</span>':`<span class="${cl(x.s5)}">${ty(x.s5)}</span>`;
const bl=a=>`<ul class="b">${a.map(b=>`<li class="${b.t}">${b.x}</li>`).join('')}</ul>`;
const subs=o=>`<div class="subs">${Object.entries(o).map(([k,v])=>`<div><span>${k}</span><div class="bar"><i style="width:${v}%;background:${scCol(v)}"></i></div><span>${v.toFixed(0)}</span></div>`).join('')}</div>`;
const pillar=(title,p,extra='')=>`<div class="card"><div class="pill"><h2>${title}</h2><span class="n" style="color:${scCol(p.score)}">${p.score.toFixed(0)} · ${p.label}</span></div>${extra}${subs(p.sub)}${bl(p.bullets)}</div>`;

/* ---------- DASHBOARD / WATCHLIST ---------- */
function topN(k,dir,n=3){return [...VR()].sort((a,b)=>(a.fl[k].s5-b.fl[k].s5)*dir).slice(0,n).map(r=>`${r.m.t} <b class="${cl(r.fl[k].s5)}">${ty(r.fl[k].s5)}</b>`).join(' · ')}
function dash(onlyWatch){
  const cnt=k=>R.filter(r=>r.verdict.k===k).length,pos=cnt('sp')+cnt('p'),neg=cnt('ng')+cnt('sn'),N=R.length;
  const burst=VR().filter(r=>r.fl.state==='Bùng nổ'),dry=VR().filter(r=>r.fl.state==='Cạn kiệt');
  const avgSe=R.reduce((a,r)=>a+r.se.idx,0)/N,above=R.reduce((a,r)=>a+(r.te.above>=3),0);
  const totCap=R.reduce((a,r)=>a+r.m.cap,0),wChg=R.reduce((a,r)=>a+r.d1*r.m.cap,0)/totCap;
  const sumF=R.reduce((a,r)=>a+r.fl.fn.s5,0),sumP=R.reduce((a,r)=>a+r.fl.pr.s5,0),est=R[0].s.est;
  const sects=[...new Set(VN30.map(m=>m.s))].sort();
  const seg=[['sp','#0f9d58'],['p','#7fd3a6'],['n','#b8c8ce'],['ng','#f19b94'],['sn','#d93025']];
  const chips=[['','Tất cả'],['pos','Tích cực'],['neu','Trung lập'],['neg','Tiêu cực'],['burst','Dòng tiền bùng nổ'],['dry','Dòng tiền cạn kiệt'],['nnb','NN mua ròng'],['nns','NN bán ròng'],['tdb','Tự doanh mua ròng']];
  app.innerHTML=(onlyWatch?`<div class="toolbar" style="margin-top:0">${lists().map(l=>`<button class="chip ${l.id===activeId()?'on':''}" data-list="${l.id}">${esc(l.name)} (${l.tickers.length})</button>`).join('')}<button class="chip" id="newList">+ Tạo list mới</button></div>
    <div class="wl-head"><h2>★ ${esc(curList().name)}</h2><button class="chip" id="renList">✎ Đổi tên</button><button class="chip" id="delList">🗑 Xóa list</button></div>
    <p class="muted" style="margin:0 0 10px">Bấm ☆ ở bất kỳ mã nào để thêm/bỏ khỏi list đang chọn. Lưu ngay trên trình duyệt này.</p>
    <div class="toolbar" style="margin-top:0"><select id="addsel"><option value="">+ Thêm mã vào “${esc(curList().name)}”…</option>${VR().filter(r=>!inWL(r.m.t)).map(r=>`<option>${r.m.t}</option>`).join('')}</select></div>`:`
  <div class="hero"><h1>Nhìn rõ <em>xu hướng</em> &amp; dòng tiền<br>của VN30 + HDG</h1>
    <p>Chấm điểm từng mã theo 4 trụ cột — Cơ bản, Kỹ thuật, Dòng tiền lớn, Tâm lý đám đông — dựa trên MA 20/50/100/200, khối ngoại và tự doanh.</p>
    <div class="acts"><a class="btn" href="#/guide">Hướng dẫn sử dụng</a><a class="btn ghost" href="#/watchlist">★ Mở Watchlist</a></div></div>
  <div class="grid g4">
    <div class="card"><h3>Nhận định tổng hợp</h3><div class="big ${pos>neg?'up':pos<neg?'dn':''}">${pos} tích cực · ${neg} tiêu cực</div>
      <div class="dist">${seg.map(([k,c])=>`<i style="width:${cnt(k)/N*100}%;background:${c}"></i>`).join('')}</div><div class="sub">${cnt('sp')} mạnh · ${cnt('p')} tích cực · ${cnt('n')} trung lập · ${cnt('ng')} tiêu cực · ${cnt('sn')} rất xấu</div></div>
    <div class="card"><h3>Biến động rổ (trọng số vốn hóa)</h3><div class="big ${cl(wChg)}">${sg(wChg)}</div><div class="sub">${above}/${N} mã đang trên ≥3 đường MA (20/50/100/200)</div></div>
    <div class="card"><h3>Dòng tiền</h3><div class="big"><span class="up">${burst.length}</span> bùng nổ · <span class="dn">${dry.length}</span> cạn kiệt</div>
      <div class="sub">Bùng nổ: ${burst.map(r=>r.m.t).join(', ')||'—'}<br>Cạn kiệt: ${dry.map(r=>r.m.t).join(', ')||'—'}</div></div>
    <div class="card"><h3>Tâm lý đám đông (TB)</h3><div class="big ${avgSe>=60?'up':avgSe<40?'dn':'wr'}">${avgSe.toFixed(0)}/100</div>
      <div class="sub">${avgSe<20?'Hoảng loạn':avgSe<40?'Sợ hãi':avgSe<60?'Trung lập':avgSe<80?'Hưng phấn':'Cực kỳ hưng phấn'} · ${R.filter(r=>r.se.idx>=80).length} mã quá nóng, ${R.filter(r=>r.se.idx<=20).length} mã hoảng loạn</div></div>
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>Khối ngoại — 5 phiên gần nhất${est?' (ước tính)':''}</h3><div class="big ${cl(sumF)}">${sumF>=0?'Mua ròng':'Bán ròng'} ${f(Math.abs(sumF),0)} tỷ</div>
      <div class="sub">Mua ròng nhiều nhất: ${topN('fn',-1)}<br>Bán ròng nhiều nhất: ${topN('fn',1)}</div></div>
    <div class="card"><h3>Tự doanh — 5 phiên gần nhất${est?' (không có dữ liệu)':''}</h3><div class="big ${cl(sumP)}">${sumP>=0?'Mua ròng':'Bán ròng'} ${f(Math.abs(sumP),0)} tỷ</div>
      <div class="sub">Mua ròng nhiều nhất: ${topN('pr',-1)}<br>Bán ròng nhiều nhất: ${topN('pr',1)}</div></div>
  </div>
  <div class="toolbar">
    <input id="q" placeholder="Tìm mã / tên công ty…" value="${state.q}">
    <select id="sec"><option value="">Mọi ngành</option>${sects.map(s=>`<option ${state.sector===s?'selected':''}>${s}</option>`).join('')}</select>
    ${chips.map(([k,t])=>`<button class="chip ${state.verdict===k?'on':''}" data-v="${k}">${t}</button>`).join('')}
  </div>`)+`
  <div class="tw"><table><thead><tr><th></th>
    ${[['t','Mã','l'],['px','Giá'],['d1','%1D'],['d5','%5D'],['d20','%1T'],['phase','Xu hướng','l'],['flow','Dòng tiền','l'],['nn','NN 5D'],['td','TD 5D'],['fa','Cơ bản'],['te','Kỹ thuật'],['fl','DT lớn'],['se','Tâm lý'],['total','Nhận định','l']].map(([k,t,c])=>`<th class="${c||''}" data-s="${k}">${t}${state.sort===k?(state.dir<0?' ▼':' ▲'):''}</th>`).join('')}
  </tr></thead><tbody id="rows"></tbody></table></div>
  ${lockNote()}
  <div class="legend">Điểm 0–100: <span class="s-p">■ ≥62 tích cực</span> · <span class="s-n">■ 45–61 trung lập</span> · <span class="s-ng">■ &lt;45 tiêu cực</span>. Tổng hợp = Kỹ thuật 35% + Dòng tiền lớn 25% + Cơ bản 20% + Tâm lý 20%. NN = khối ngoại, TD = tự doanh (mua/bán ròng 5 phiên, tỷ đồng). Bấm một mã để xem chi tiết, bấm ☆ để thêm Watchlist.</div>`;
  if(onlyWatch){$('#addsel').onchange=e=>{if(e.target.value){toggleWL(e.target.value);dash(true)}};
    document.querySelectorAll('[data-list]').forEach(b=>b.onclick=()=>{store.set('activeList',b.dataset.list);updNav();dash(true)});
    $('#newList').onclick=()=>{const n=nameOk(prompt('Tên danh sách mới (tối đa 30 ký tự):',''));if(!n)return;const L=lists(),id='l'+Date.now();L.push({id,name:n,tickers:[]});store.set('lists',L);store.set('activeList',id);updNav();dash(true)};
    $('#renList').onclick=()=>{const c=curList(),n=nameOk(prompt('Đổi tên danh sách:',c.name),c.id);if(!n)return;const L=lists();L.find(x=>x.id===c.id).name=n;store.set('lists',L);dash(true)};
    $('#delList').onclick=()=>{const L=lists();if(L.length<2){alert('Cần giữ lại ít nhất một danh sách.');return}const c=curList();if(!confirm(`Xóa danh sách “${c.name}” (${c.tickers.length} mã)?`))return;store.set('lists',L.filter(x=>x.id!==c.id));store.set('activeList','');updNav();dash(true)}}
  else{
    $('#q').oninput=e=>{state.q=e.target.value;rows(false)};$('#sec').onchange=e=>{state.sector=e.target.value;rows(false)};
    document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{state.verdict=b.dataset.v;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));rows(false)});
  }
  document.querySelectorAll('th[data-s]').forEach(th=>th.onclick=()=>{const k=th.dataset.s;state.dir=state.sort===k?-state.dir:(k==='t'||k==='phase'?1:-1);state.sort=k;dash(onlyWatch)});
  rows(onlyWatch);
}
const key=(r,k)=>({t:r.m.t,px:r.px,d1:r.d1,d5:r.d5,d20:r.d20,phase:r.te.phase,flow:r.fl.r5,nn:r.fl.fn.s5,td:r.fl.pr.s5,fa:r.fa.score,te:r.te.score,fl:r.fl.score,se:r.se.score,total:r.total})[k];
function rows(onlyWatch){
  const q=state.q.trim().toLowerCase(),v=state.verdict,w=WL();
  let L=VR().filter(r=>onlyWatch?w.includes(r.m.t):((!q||r.m.t.toLowerCase().includes(q)||r.m.n.toLowerCase().includes(q))&&(!state.sector||r.m.s===state.sector)&&
    (!v||(v==='pos'&&['sp','p'].includes(r.verdict.k))||(v==='neu'&&r.verdict.k==='n')||(v==='neg'&&['ng','sn'].includes(r.verdict.k))||(v==='burst'&&r.fl.state==='Bùng nổ')||(v==='dry'&&r.fl.state==='Cạn kiệt')||
    (v==='nnb'&&r.fl.fn.dir>0)||(v==='nns'&&r.fl.fn.dir<0)||(v==='tdb'&&r.fl.pr.dir>0))));
  L.sort((a,b)=>{const x=key(a,state.sort),y=key(b,state.sort);return(x>y?1:x<y?-1:0)*state.dir});
  const e=R[0].s.est;
  const hid=proStatus().active?[]:R.filter(r=>r.sig.locked&&(onlyWatch?w.includes(r.m.t):!q&&!state.sector&&!v)).sort((a,b)=>b.sig.n-a.sig.n);
  const maskRow=r=>`<tr class="mrow" data-lock="1"><td>🔒</td><td class="l"><div class="tk">••••</div><div class="tn">Mã Pro</div></td><td>•••</td><td>•••</td><td>•••</td><td>•••</td><td class="l">•••••••</td><td class="l">•••••</td><td>•••</td><td>•••</td><td>••</td><td>••</td><td>••</td><td>••</td><td class="l">${tierBadge(r.sig)}</td></tr>`;
  $('#rows').innerHTML=hid.map(maskRow).join('')+L.map(r=>`<tr data-t="${r.m.t}"><td>${starBtn(r.m.t)}</td>
    <td class="l"><div class="tk">${r.m.t}${r.m.x?'<span class="tag">ngoài VN30</span>':''}${tierTag(r.sig)}</div><div class="tn">${r.m.n}</div></td>
    <td>${f(r.px)}</td><td class="${cl(r.d1)}">${sg(r.d1)}</td><td class="${cl(r.d5)}">${sg(r.d5)}</td><td class="${cl(r.d20)}">${sg(r.d20)}</td>
    <td class="l ph">${r.te.phase}</td>
    <td class="l"><span class="fs ${flowCls(r.fl.state)}">${r.fl.state}</span> <span class="muted">${r.fl.r5.toFixed(2)}×</span></td>
    <td>${netCell(r.fl.fn,e)}</td><td>${e?'<span class="muted">—</span>':netCell(r.fl.pr)}</td>
    <td>${scBar(r.fa.score)}</td><td>${scBar(r.te.score)}</td><td>${scBar(r.fl.score)}</td><td>${scBar(r.se.score)}</td>
    <td class="l"><span class="vd ${r.verdict.k}">${r.verdict.t}</span> </td></tr>`).join('')||
    `<tr><td colspan="15" class="empty">${onlyWatch?'Danh sách đang trống — chọn mã ở ô “Thêm mã” phía trên hoặc bấm ☆ ở trang Tổng quan.':'Không có mã phù hợp.'}</td></tr>`;
  document.querySelectorAll('#rows tr[data-t]').forEach(tr=>tr.onclick=()=>location.hash='#/'+tr.dataset.t);
  document.querySelectorAll('#rows tr[data-lock]').forEach(tr=>tr.onclick=()=>location.hash='#/pro');
  bindStars($('#rows'));
}

/* ---------- CHI TIẾT ---------- */
function miniBars(a){
  const m=Math.max(...a.map(Math.abs))||1,w=300,h=70,bw=w/a.length;
  return `<svg class="mini" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" x2="${w}" y1="${h/2}" y2="${h/2}" stroke="#d3e4e6"/>`+
    a.map((v,i)=>{const hh=Math.max(1,Math.abs(v)/m*(h/2-2));return `<rect x="${i*bw+1}" width="${bw-2}" y="${v>=0?h/2-hh:h/2}" height="${hh}" fill="${v>=0?'#0f9d58':'#d93025'}" rx="1"/>`}).join('')+`</svg>`;
}
function tradeCard(title,x,est){
  const c=x.dir>0?'up':x.dir<0?'dn':'wr';
  return `<div class="tr"><h4>${title} <span class="${c}">${x.label}${x.accel?` <small>(${x.accel})</small>`:''}</span></h4>${miniBars(x.series)}
    <div class="sub">20 phiên gần nhất (tỷ đồng/phiên)${est?' — ước tính':''}</div>
    <div class="kv" style="margin-top:6px"><span>Phiên gần nhất</span><span class="${cl(x.d1)}">${ty(x.d1)} tỷ</span>
      <span>5 phiên</span><span class="${cl(x.s5)}">${ty(x.s5)} tỷ</span><span>10 phiên</span><span class="${cl(x.s10)}">${ty(x.s10)} tỷ</span>
      <span>20 phiên</span><span class="${cl(x.s20)}">${ty(x.s20)} tỷ</span><span>20 phiên trước đó</span><span class="${cl(x.p20)}">${ty(x.p20)} tỷ</span>
      <span>Chuỗi liên tiếp</span><span class="${cl(x.streak)}">${x.streak===0?'—':Math.abs(x.streak)+' phiên '+(x.streak>0?'mua':'bán')+' ròng'}</span></div></div>`;
}
function newsLinks(t,n){
  const q=encodeURIComponent(t+' cổ phiếu'),qs=s=>`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(s+' '+t)}`;
  return [['Google News',`https://news.google.com/search?q=${q}&hl=vi&gl=VN&ceid=VN:vi`],['Vietstock',`https://finance.vietstock.vn/${t}/tin-moi-nhat.htm`],['CafeF',qs('site:cafef.vn')],['Đầu tư (BNEWS/NDH)',qs('site:nhadautu.vn')],['VnEconomy',qs('site:vneconomy.vn')],['Báo cáo phân tích CTCK',`https://www.google.com/search?q=${encodeURIComponent('báo cáo phân tích cổ phiếu '+t)}`],['Báo cáo tài chính / CBTT',`https://www.google.com/search?q=${encodeURIComponent(t+' công bố thông tin báo cáo tài chính quý')}`]]
   .map(([a,u])=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${a} ↗</a>`).join('');
}
function detail(r){
  const {m,te,fl,fa,se}=r,col=scCol(r.total),oc={bull:'up',bear:'dn',neutral:'wr'}[te.outlook],ot={bull:'Thiên hướng TĂNG',bear:'Thiên hướng GIẢM',neutral:'TRUNG LẬP / chờ xác nhận'}[te.outlook];
  const est=r.s.est,feed=NEWS[m.t]||[];
  const estNote=est?'<div class="sub wr">⚠ Nguồn không có dữ liệu khối ngoại/tự doanh — đang dùng ước tính từ vị trí đóng cửa.</div>':'';
  app.innerHTML=`<a class="back" href="#/">← Danh sách</a>
  <div class="dh"><div><h1>${m.t} ${starBtn(m.t)}<span class="muted" style="font-size:16px;font-weight:400">${m.n} · ${m.s}${m.x?' · ngoài rổ VN30':''}</span></h1>
    <div><span class="px">${f(r.px)}</span> <span class="${cl(r.d1)}">${sg(r.d1)}</span> <span class="muted">· 5D <b class="${cl(r.d5)}">${sg(r.d5)}</b> · 1T <b class="${cl(r.d20)}">${sg(r.d20)}</b> · Vốn hóa ~${m.cap} nghìn tỷ</span></div></div>
    <div style="display:flex;gap:14px;align-items:center"><span class="vd ${r.verdict.k}" style="font-size:16px;padding:6px 16px">${r.verdict.t}</span><div class="ring" style="--v:${r.total};--c:${col}"><div>${r.total.toFixed(0)}</div></div></div></div>
  <div class="inl"><span class="muted">Thêm vào danh sách:</span> ${lists().map(l=>`<button class="chip ${l.tickers.includes(m.t)?'on':''}" data-inlist="${l.id}">${esc(l.name)}</button>`).join('')}</div>
  <div class="jump"><a href="#" data-j="s-sig">Radar tín hiệu</a><a href="#" data-j="s-chart">Biểu đồ</a><a href="#" data-j="s-flow">Khối ngoại &amp; Tự doanh</a><a href="#" data-j="s-an">Phân tích 4 trụ cột</a><a href="#" data-j="s-news">Tin tức &amp; Sự kiện</a><a href="#" data-j="s-note">Ghi chú</a></div>
  <div class="verdict-box" style="--c:${col}"><b>Nhận định tổng hợp.</b> ${r.summary}
    <div class="grid g2" style="margin-top:10px"><div><b class="up">Điểm cộng</b>${bl(r.pos.slice(0,5).map(x=>({t:'pos',x})))}</div><div><b class="dn">Rủi ro</b>${bl(r.neg.slice(0,5).map(x=>({t:'neg',x})))}</div></div></div>
  ${sigCard(r)}
  <section id="s-chart" class="card"><div class="ctl">
    ${[60,120,250].map(n=>`<button class="chip ${n===state.range?'on':''}" data-r="${n}">${n===60?'3 tháng':n===120?'6 tháng':'1 năm'}</button>`).join('')}
    <span style="width:10px"></span>${[20,50,100,200].map(k=>`<button class="chip" data-m="${k}"><span class="dot" style="background:${MA_COL[k]}"></span>MA${k}</button>`).join('')}</div>
    <div class="chart-wrap"><canvas id="cv"></canvas><div class="tt" id="tt"></div></div>${estNote}</section>
  <section id="s-flow" class="card" style="margin-top:14px"><div class="pill"><h2>Xu hướng mua/bán: Khối ngoại &amp; Tự doanh</h2><span class="sub">Đơn vị: tỷ đồng, mua ròng (+) / bán ròng (−)</span></div>
    <div class="grid g2">${tradeCard('Khối ngoại',fl.fn,est)}${est?'<div class="tr"><h4>Tự doanh</h4><div class="sub">Chưa có dữ liệu từ nguồn hiện tại.</div></div>':tradeCard('Tự doanh',fl.pr,false)}</div>
    <div style="margin-top:8px">${bl(fl.bullets.filter(b=>/Khối ngoại|Tự doanh/.test(b.x)))}</div></section>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><div class="pill"><h2>Xu hướng tiếp theo (MA 20/50/100/200)</h2><span class="n ${oc}">${ot}</span></div>
      <div><b>${te.phase}</b> — ${te.outlookText}</div>
      <div class="kv" style="margin-top:10px">${[20,50,100,200].map(k=>`<span>MA${k}</span><span>${f(r.ma[k].at(-1))} <small class="${cl(r.px-r.ma[k].at(-1))}">(${sg((r.px/r.ma[k].at(-1)-1)*100)})</small></span>`).join('')}</div>
      <div style="margin-top:10px" class="sub">Hỗ trợ gần:</div><div class="lv">${te.sup.map(([n,v])=>`<span class="dn">${n} ${f(v)}</span>`).join('')||'<span>—</span>'}</div>
      <div class="sub">Kháng cự gần:</div><div class="lv">${te.res.map(([n,v])=>`<span class="up">${n} ${f(v)}</span>`).join('')||'<span>—</span>'}</div>
      <div class="sub">Kịch bản: nếu giá đóng cửa vượt kháng cự đầu tiên kèm khối lượng &gt; TB20 → xu hướng tăng được củng cố; nếu thủng hỗ trợ gần nhất → chuyển sang điều chỉnh/giảm.</div></div>
    <div class="card"><div class="pill"><h2>Trạng thái dòng tiền</h2><span class="fs ${flowCls(fl.state)}" style="font-size:16px">${fl.state}</span></div>
      <div>${fl.nuance}.</div>
      <div class="kv" style="margin-top:10px"><span>GTGD TB5 / TB20</span><span>${fl.r5.toFixed(2)}×</span><span>GTGD TB20 / TB60</span><span>${fl.r20.toFixed(2)}×</span>
        <span>Dòng tiền lớn 10 phiên</span><span class="${cl(fl.bm10)}">${ty(fl.bm10)} tỷ</span><span>Dòng tiền lớn 20 phiên</span><span class="${cl(fl.bm20)}">${ty(fl.bm20)} tỷ</span>
        <span>CMF20 / MFI14</span><span>${fl.cmf.toFixed(2)} / ${fl.mfi.toFixed(0)}</span><span>Phiên gom / phân phối</span><span>${fl.acc} / ${fl.dist}</span></div>
      <div class="sub" style="margin-top:8px">Phân loại theo GTGD 5 phiên so với TB 20 phiên: ≥1.8× Bùng nổ · ≥1.25× Tăng · 0.8–1.25× Bình thường · 0.55–0.8× Suy yếu · &lt;0.55× Cạn kiệt.</div></div>
  </div>
  <div id="s-an" class="grid g2" style="margin-top:14px">${pillar('Phân tích Kỹ thuật',te)}${pillar('Đo lường Dòng tiền lớn',fl)}${pillar('Phân tích Cơ bản',fa)}${pillar('Tâm lý đám đông',se,`<div class="sub">Chỉ số ${se.idx.toFixed(0)}/100 — <b>${se.lbl}</b> (0 = hoảng loạn, 100 = cực kỳ hưng phấn)</div>`)}</div>
  <section id="s-news" class="card" style="margin-top:14px"><div class="pill"><h2>Tin tức &amp; Sự kiện ${m.t}</h2></div>
    <div class="sub">Đọc tin mới nhất từ các nguồn (mở tab mới):</div><div class="src">${newsLinks(m.t)}</div>
    ${feed.length?`<div class="sub" style="margin-top:8px">Tin trong <code>data/news.json</code>:</div><ul class="news">${feed.map(n=>`<li><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a> <span class="muted">· ${n.src||''} ${n.date||''}</span></li>`).join('')}</ul>`:`<div class="sub" style="margin-top:6px">Chưa có bản tin nạp sẵn. Trang không tự bịa tin tức — thêm tin vào <code>data/news.json</code> (xem README) để hiển thị tại đây.</div>`}
    <div class="pill" style="margin-top:14px"><h2 style="font-size:15px">Sự kiện nổi bật rút ra từ dữ liệu giá &amp; dòng tiền (60 phiên)</h2></div>
    ${r.events.length?bl(r.events):'<div class="sub">Không có sự kiện đáng chú ý trong 60 phiên gần nhất.</div>'}</section>
  <section id="s-note" class="card" style="margin-top:14px"><div class="pill"><h2>Ghi chú cá nhân về ${m.t}</h2><span class="sub">Lưu tự động trên trình duyệt này</span></div>
    <textarea id="note" placeholder="Ví dụ: theo dõi MA50, chờ báo cáo quý, xem lại khi dòng tiền cải thiện…">${(store.get('notes',{})[m.t]||'').replace(/</g,'&lt;')}</textarea></section>`;
  const ch=new StockChart($('#cv'),$('#tt'));ch.range=state.range;
  const ms=store.get('ma',{20:1,50:1,100:1,200:1});ch.show={...ms};
  document.querySelectorAll('[data-m]').forEach(b=>{b.classList.toggle('on',!!ch.show[b.dataset.m]);b.onclick=()=>{const k=b.dataset.m;ch.show[k]=ch.show[k]?0:1;b.classList.toggle('on',!!ch.show[k]);store.set('ma',ch.show);ch.draw()}});
  ch.draw();
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{state.range=ch.range=+b.dataset.r;document.querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('on',x===b));ch.draw()});
  document.querySelectorAll('[data-j]').forEach(a=>a.onclick=e=>{e.preventDefault();document.getElementById(a.dataset.j).scrollIntoView({behavior:'smooth'})});
  $('#note').oninput=e=>{const n=store.get('notes',{});n[m.t]=e.target.value;store.set('notes',n)};
  document.querySelectorAll('[data-inlist]').forEach(b=>b.onclick=()=>{toggleIn(b.dataset.inlist,m.t);window.__wlrefresh()});
  window.__wlrefresh=()=>{const L=lists();document.querySelectorAll('[data-inlist]').forEach(b=>b.classList.toggle('on',L.find(x=>x.id===b.dataset.inlist).tickers.includes(m.t)));
    document.querySelectorAll('.dh [data-star]').forEach(x=>{const on=inWL(m.t);x.classList.toggle('on',on);x.textContent=on?'★':'☆'})};
  bindStars(app);
}

/* ---------- PRO: MÃ TÍN HIỆU MẠNH ---------- */
const tierBadge=g=>g.tier?`<span class="vd ${g.tier==='strong'?'tstrong':'tgood'}">${g.tier==='strong'?'⭐':'✓'} ${g.tierLabel}</span>`:'';
const tierTag=g=>g.tier?`<span class="tag ${g.tier==='strong'?'gold':'good'}">${g.tier==='strong'?'⭐':'✓'} ${g.tierLabel}</span>`:'';
const NOADV='Chỉ phân tích xu hướng, không phải khuyến nghị đầu tư.';
function lockNote(){
  if(proStatus().active)return '';
  const ns=R.filter(r=>r.sig.tier==='strong').length,ng=R.filter(r=>r.sig.tier==='good').length;
  return ns+ng>0?`<div class="lockbar"><div>🔒 Đang ẩn tên mã, giá và chỉ số của <b>${ns}</b> mã <b>Tín hiệu mạnh</b> (đạt ${CONFIG.proTiers.strong}/5 tiêu chí) và <b>${ng}</b> mã <b>Tín hiệu tốt</b> (đạt ${CONFIG.proTiers.good}/5 tiêu chí). Bấm vào dòng 🔒 hoặc nút bên cạnh để xem gói Pro.</div><a class="btn" href="#/pro">Mở khóa Pro</a></div>`
    :`<div class="lockbar"><div>⭐ Hôm nay chưa có mã nào đạt nhóm Tín hiệu mạnh/tốt (≥${CONFIG.proTiers.good}/5 tiêu chí).</div><a href="#/pro">Xem gói Pro</a></div>`;
}
function sigCard(r){
  const g=r.sig;
  return `<section id="s-sig" class="card sig-card" style="margin-bottom:14px"><div class="pill"><h2>Radar tín hiệu xu hướng</h2><span class="${g.tier==='strong'?'tag gold big':g.tier==='good'?'tag good big':'fs'}">${g.tier?g.tierLabel+' · ':''}${g.n}/5 tiêu chí</span></div>
    <ul class="chk">${g.checks.map(c=>`<li class="${c.ok?'ok':'no'}"><b>${c.ok?'✓':'✗'} ${c.label}</b><span>${c.detail}</span></li>`).join('')}</ul>
    <div class="sub" style="margin-top:6px">${NOADV}${r.s.est?' Khối ngoại/tự doanh là số ước tính.':''}</div></section>`;
}
function lockedPage(){
  app.innerHTML=`<a class="back" href="#/">← Danh sách</a><div class="card lockscreen"><div class="big">🔒 Mã thuộc nhóm “Tín hiệu mạnh / Tín hiệu tốt” (Pro)</div>
    <p>Mã này đạt từ ${CONFIG.proTiers.good}/5 tiêu chí trở lên: xu hướng mạnh, nhận định tích cực, dòng tiền mạnh, khối ngoại + tự doanh cùng mua mạnh, tâm lý đám đông tốt. Mở khóa Pro để xem mã và toàn bộ chỉ số phân tích.</p>
    <a class="btn" href="#/pro">Mở khóa Pro</a><div class="sub" style="margin-top:10px">${NOADV}</div></div>`;
}
function proPage(){
  const st=proStatus(),py=CONFIG.payment,hasPay=py.bank||py.account||py.zalo||py.email,msg=state.promsg;state.promsg=null;
  const strong=R.filter(r=>r.sig.tier==='strong'),good=R.filter(r=>r.sig.tier==='good'),T=CONFIG.proTiers;
  const crit=`<div class="card"><h3>5 tiêu chí “tín hiệu xu hướng mạnh”</h3><ol style="margin:0;padding-left:20px;line-height:1.8"><li>Xu hướng mạnh (giá trên ≥3/4 đường MA 20/50/100/200, điểm kỹ thuật ≥70)</li><li>Nhận định tổng hợp tích cực (≥62/100)</li><li>Dòng tiền mạnh (bùng nổ/tăng, CMF dương)</li><li>Khối ngoại và tự doanh cùng mua ròng mạnh</li><li>Tâm lý đám đông tốt nhưng chưa quá nóng</li></ol>
    <div class="sub" style="margin-top:6px"><b>⭐ Tín hiệu mạnh</b> = đạt ${T.strong}/5 tiêu chí; <b>✓ Tín hiệu tốt</b> = đạt ${T.good}/5. Cả hai nhóm bị ẩn tên mã, giá và chỉ số với gói miễn phí. Hôm nay: <b>${strong.length}</b> mã mạnh, <b>${good.length}</b> mã tốt.</div></div>`;
  const plans=`<div class="plans">${CONFIG.plans.map(p=>`<div class="plan ${p.badge?'hot':''}"><h3 style="margin:0 0 6px;color:var(--deep)">${esc(p.name)} ${p.badge?`<span class="tag">${esc(p.badge)}</span>`:''}</h3><div class="price">${esc(p.price)} <small>${esc(p.per)}</small></div>
    <ul class="b"><li class="pos">Xem tên mã, giá nhóm Tín hiệu mạnh &amp; Tín hiệu tốt</li><li class="pos">Toàn bộ chỉ số phân tích của các mã đó</li><li class="pos">Radar 5 tiêu chí hằng ngày</li></ul></div>`).join('')}</div>`;
  const pay=`<div class="card"><h3>Cách mở khóa — 3 bước</h3><ol style="margin:0;padding-left:20px;line-height:1.9">
    <li><b>Chọn gói và thanh toán</b> (ngoài trang này — ArrowStock không thu thông tin thẻ trên trang).${hasPay?`<div class="kv" style="max-width:420px;margin:6px 0">${py.bank?`<span>Ngân hàng</span><span>${esc(py.bank)}</span>`:''}${py.account?`<span>Số tài khoản</span><span>${esc(py.account)}</span>`:''}${py.holder?`<span>Chủ tài khoản</span><span>${esc(py.holder)}</span>`:''}${py.note?`<span>Nội dung CK</span><span>${esc(py.note)}</span>`:''}</div>`:'<div class="warnb">Chủ trang chưa cấu hình thông tin thanh toán (js/config.js → payment).</div>'}</li>
    <li><b>Nhận mã kích hoạt</b> qua ${[py.zalo&&'Zalo '+esc(py.zalo),py.email&&esc(py.email)].filter(Boolean).join(' hoặc ')||'kênh liên hệ của chủ trang'}.</li>
    <li><b>Nhập mã</b> vào ô bên dưới để mở khóa ngay.</li></ol></div>`;
  const key=`<div class="card" style="margin-top:14px"><h3>${st.active?'Gia hạn / nhập mã mới':'Nhập mã kích hoạt'}</h3><div class="keyrow"><input id="lk" placeholder="ARROW-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false"><button class="btn" id="lkb">Kích hoạt</button></div>
    <div class="msg ${msg?(msg.ok?'ok':'err'):''}">${msg?esc(msg.msg):(st.reason?esc(st.reason):'')}</div></div>`;
  const status=st.active?`<div class="card pro-card"><div class="pill"><h2>🔓 Đã mở khóa — ${esc(st.plan)}</h2><span class="n up">còn ${st.left} ngày</span></div><div class="sub">Hết hạn ${st.end.toLocaleDateString('vi-VN')}</div></div>`:'';
  const ck=g=>g.checks.map(c=>`<td class="${c.ok?'up':'muted'}" style="text-align:center">${c.ok?'✓':'–'}</td>`).join('');
  const tbl=(list,title)=>`<h3 style="margin:16px 0 6px;color:var(--deep)">${title} (${list.length})</h3><div class="tw"><table style="min-width:0"><thead><tr><th class="l">Mã</th><th>Giá</th><th>%1D</th><th title="Xu hướng">XH</th><th title="Nhận định">NĐ</th><th title="Dòng tiền">DT</th><th title="Khối ngoại + tự doanh">NN+TD</th><th title="Tâm lý">TL</th><th>Điểm</th></tr></thead><tbody>${list.length?list.map(r=>`<tr data-t="${r.m.t}"><td class="l"><div class="tk">${r.m.t}</div><div class="tn">${r.m.n}</div></td><td>${f(r.px)}</td><td class="${cl(r.d1)}">${sg(r.d1)}</td>${ck(r.sig)}<td><b>${r.total.toFixed(0)}</b></td></tr>`).join(''):'<tr><td colspan="9" class="empty">Hôm nay chưa có mã nào.</td></tr>'}</tbody></table></div>`;
  const radar=st.active?`<h2 style="margin:18px 0 0;color:var(--deep)">Radar tín hiệu xu hướng</h2>${MKT.source==='sim'?'<div class="warnb">⚠ Dữ liệu MÔ PHỎNG — chỉ để minh họa.</div>':''}${tbl(strong.sort((a,b)=>b.total-a.total),'⭐ Tín hiệu mạnh — đạt '+T.strong+'/5 tiêu chí')}${tbl(good.sort((a,b)=>b.total-a.total),'✓ Tín hiệu tốt — đạt '+T.good+'/5 tiêu chí')}
    <div class="legend">XH = xu hướng · NĐ = nhận định · DT = dòng tiền · NN+TD = khối ngoại + tự doanh · TL = tâm lý. ✓ = đạt tiêu chí. Bấm một mã để xem chi tiết.</div>`:'';
  app.innerHTML=`<div class="hero"><h1>⭐ ArrowStock <em>Pro</em></h1><p>Mở khóa tên mã, giá và chỉ số của các mã Tín hiệu mạnh (5/5) và Tín hiệu tốt (4/5) trên 5 tiêu chí: xu hướng mạnh, nhận định tích cực, dòng tiền mạnh, khối ngoại + tự doanh cùng mua mạnh, tâm lý đám đông tốt.</p></div>
    ${status}${st.active?'':crit+plans+pay}${key}${radar}
    <div class="legend" style="margin-top:14px"><b>${NOADV}</b> Xem “Tuyên bố miễn trừ” cuối trang.</div>`;
  $('#lkb').onclick=()=>{state.promsg=activateKey($('#lk').value);updNav();proPage()};
  $('#lk').onkeydown=e=>{if(e.key==='Enter')$('#lkb').click()};
  document.querySelectorAll('tbody tr[data-t]').forEach(tr=>tr.onclick=()=>location.hash='#/'+tr.dataset.t);
}

/* ---------- HƯỚNG DẪN ---------- */
function guide(){
  app.innerHTML=`<h2 style="margin:0 0 4px;color:var(--deep)">Hướng dẫn sử dụng</h2><p class="muted" style="margin:0 0 14px">Đọc 2 phút là dùng được.</p>
  <ol class="steps"><li><b>Xem tổng quan</b><br>Trang Tổng quan cho biết bao nhiêu mã tích cực/tiêu cực, dòng tiền đang bùng nổ hay cạn kiệt, khối ngoại và tự doanh đang mua hay bán.</li>
   <li><b>Lọc &amp; chọn mã</b><br>Dùng ô tìm kiếm, lọc ngành, các nút lọc nhanh (Tích cực, Bùng nổ, NN mua ròng…) hoặc bấm tiêu đề cột để sắp xếp.</li>
   <li><b>Bấm vào mã để xem sâu</b><br>Biểu đồ nến + MA, xu hướng khối ngoại/tự doanh, phân tích 4 trụ cột, tin tức. Bấm ☆ để đưa vào Watchlist.</li></ol>
  <h3 style="margin:20px 0 8px;color:var(--deep)">Giải thích chi tiết</h3>
  <details open><summary>Nhận định “Tích cực / Tiêu cực” được tính thế nào?</summary><p>Mỗi mã có 4 điểm (0–100): <b>Kỹ thuật 35%</b>, <b>Dòng tiền lớn 25%</b>, <b>Cơ bản 20%</b>, <b>Tâm lý 20%</b>. Điểm tổng ≥68 = Tích cực mạnh; 56–67 = Tích cực; 44–55 = Trung lập; 34–43 = Tiêu cực; &lt;34 = Tiêu cực mạnh. Mỗi trụ cột đều liệt kê lý do cụ thể (▲ điểm cộng, ▼ rủi ro) để bạn tự kiểm chứng.</p></details>
  <details><summary>MA 20 / 50 / 100 / 200 và “Xu hướng tiếp theo”</summary><p>MA là đường trung bình giá của 20, 50, 100, 200 phiên gần nhất (ngắn → dài hạn). Giá nằm trên cả 4 đường và MA20 &gt; MA50 &gt; MA100 &gt; MA200 là xu hướng tăng hoàn chỉnh; ngược lại là xu hướng giảm. Hệ thống xếp mã vào một “pha” (tăng mạnh, điều chỉnh trong xu hướng tăng, suy yếu, tích lũy, giảm…) và nêu kịch bản tiếp theo cùng vùng hỗ trợ/kháng cự gần nhất. Golden Cross (MA ngắn cắt lên MA dài) là tín hiệu tốt; Death Cross là tín hiệu xấu.</p></details>
  <details><summary>Dòng tiền “Bùng nổ” và “Cạn kiệt”</summary><p>So giá trị giao dịch bình quân 5 phiên với 20 phiên: <b>≥1.8× Bùng nổ</b>, ≥1.25× Tăng, 0.8–1.25× Bình thường, 0.55–0.8× Suy yếu, <b>&lt;0.55× Cạn kiệt</b>. Hệ thống đọc kèm hướng giá: bùng nổ + giá tăng = lực cầu chủ động; bùng nổ + giá giảm = dấu hiệu xả hàng; cạn kiệt sau nhịp giảm = cạn cung, có thể sắp tạo đáy; giá tăng nhưng thanh khoản co lại = phân kỳ, thiếu bền vững.</p></details>
  <details><summary>Khối ngoại &amp; Tự doanh</summary><p>Hiển thị mua/bán ròng (tỷ đồng) theo phiên gần nhất, 5, 10, 20 phiên và so với 20 phiên trước đó để biết lực mua/bán đang <i>tăng tốc</i> hay <i>chậm lại</i>. Nhãn xu hướng: Mua ròng liên tục, Mua ròng, Đảo chiều sang mua, Giảm mua/chốt lời, Bán ròng, Bán ròng liên tục. Khi cả hai cùng mua ròng thì dòng tiền lớn đồng thuận (tích cực); trái chiều thì tín hiệu chưa rõ.</p></details>
  <details><summary>Tâm lý đám đông</summary><p>Chỉ số 0–100 (0 hoảng loạn, 100 cực kỳ hưng phấn) tính từ RSI, tỷ lệ khối lượng phiên tăng/giảm, độ lệch khỏi MA20, đà tăng 10 phiên và biến động. Hưng phấn vừa phải được chấm tốt; hưng phấn cực độ bị trừ điểm vì thường đi trước nhịp chỉnh (tín hiệu ngược đám đông).</p></details>
  <details><summary>Watchlist &amp; ghi chú</summary><p>Mở tab “★ Watchlist” để tạo nhiều danh sách có tên riêng (nút “+ Tạo list mới”), đổi tên hoặc xóa list. Bấm ☆ cạnh mã để thêm/bỏ khỏi list đang chọn; ở trang chi tiết có thể thêm mã vào nhiều list cùng lúc. Mỗi mã có ô ghi chú cá nhân. Dữ liệu lưu trong trình duyệt của bạn (không gửi đi đâu) — xóa dữ liệu trình duyệt hoặc đổi máy sẽ mất.</p></details>
  <details><summary>Tin tức</summary><p>Mỗi mã có các nút mở nhanh tin mới nhất trên Google News, Vietstock, CafeF… và mục “Sự kiện nổi bật” do hệ thống tự rút ra từ dữ liệu giá (breakout, khối lượng đột biến, golden/death cross, khối ngoại mua/bán đột biến). Muốn hiện tin ngay trong trang, thêm vào <code>data/news.json</code>.</p></details>
  <details><summary>Gói Pro: Tín hiệu mạnh &amp; Tín hiệu tốt</summary><p>Mỗi mã được chấm 5 tiêu chí: <b>xu hướng mạnh, nhận định tích cực, dòng tiền mạnh, khối ngoại + tự doanh cùng mua mạnh, tâm lý đám đông tốt</b>. Đạt <b>5/5 = ⭐ Tín hiệu mạnh</b>, đạt <b>4/5 = ✓ Tín hiệu tốt</b>. Với gói miễn phí, các mã thuộc hai nhóm này hiện thành dòng 🔒 — ẩn tên mã, giá và mọi chỉ số, chỉ cho biết nhóm. Mở khóa Pro để xem đầy đủ cùng bảng Radar. Các mã còn lại (≤3/5) xem miễn phí, kèm Radar n/5 tiêu chí ở trang chi tiết. <b>Đây chỉ là phân tích xu hướng, không phải khuyến nghị đầu tư.</b></p></details>
  <details><summary>Về dữ liệu — đọc kỹ</summary><p>Nếu góc trên bên phải ghi <b>“Dữ liệu MÔ PHỎNG”</b> nghĩa là giá, khối lượng, khối ngoại, tự doanh đều là số giả lập để minh họa giao diện và thuật toán — <b>không dùng để ra quyết định</b>. Chỉ số cơ bản (P/E, ROE…) là số ước chừng. Nạp dữ liệu thật theo hướng dẫn trong README (<code>scripts/fetch_data.py</code> → <code>data/market.json</code>). HDG không thuộc rổ VN30, được thêm riêng để theo dõi. Mọi nhận định chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.</p></details>`;
}
load();
