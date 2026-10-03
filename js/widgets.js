/* Tài khoản, hỗ trợ (chat tự động), liên hệ quản trị viên, ô quảng cáo.
   LƯU Ý: trang không có máy chủ — hồ sơ tài khoản chỉ lưu trên thiết bị này (không đồng bộ, không có mật khẩu). */
const noDia=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const safeUrl=u=>/^(https?:\/\/[^\s"'<>]+|[\w\-./]+)$/i.test(u||'')?u:'';
const digits=s=>String(s||'').replace(/\D/g,'');
const profile=()=>store.get('profile',null);
const initials=n=>(n||'?').trim().split(/\s+/).slice(-2).map(w=>w[0]).join('').toUpperCase();
function updAcc(){const p=profile(),el=document.getElementById('acc');if(el)el.textContent=p?p.name.trim().split(/\s+/).slice(-1)[0]:'Tài khoản'}

/* ---------- Liên hệ quản trị viên (góc trên bên phải) ---------- */
function renderContact(){
  const c=CONFIG.contact||{},el=document.getElementById('cbar'),parts=[];
  if(c.name)parts.push(`<span>Quản trị viên: <b>${esc(c.name)}</b></span>`);
  if(c.phone)parts.push(`<a href="tel:${digits(c.phone)}">📞 ${esc(c.phone)}</a>`);
  if(c.zalo)parts.push(`<a href="https://zalo.me/${digits(c.zalo)}" target="_blank" rel="noopener noreferrer">💬 Zalo ${esc(c.zalo)}</a>`);
  if(c.email)parts.push(`<a href="mailto:${esc(c.email)}">✉ ${esc(c.email)}</a>`);
  if(!c.phone&&!c.zalo&&!c.email)parts.push('<button class="clink" id="cbtn">💬 Liên hệ quản trị viên</button>');
  el.innerHTML=parts.join('');const b=document.getElementById('cbtn');if(b)b.onclick=()=>openChat();
}

/* ---------- Quảng cáo ---------- */
const AD_SIZE={top:'728×90',mid:'728×90',inline:'728×90',left:'160×600',right:'160×600'};
function renderAds(){
  document.querySelectorAll('.ad[data-slot]').forEach(el=>{
    const s=el.dataset.slot,a=(CONFIG.ads||{})[s]||{},img=safeUrl(a.img),link=safeUrl(a.link);
    if(img){const im=`<img src="${esc(img)}" alt="${esc(a.alt||'Quảng cáo')}" loading="lazy">`;
      el.innerHTML=`<small>Quảng cáo</small>${link?`<a href="${esc(link)}" target="_blank" rel="sponsored noopener noreferrer">${im}</a>`:im}`}
    else{el.innerHTML=`<div class="adph ${s==='left'||s==='right'?'tall':''}"><small>Quảng cáo</small><span>Ô quảng cáo ${AD_SIZE[s]||''}<br>Liên hệ quản trị viên để đặt vị trí</span></div>`;
      el.querySelector('.adph').onclick=()=>openChat('Tôi muốn đặt quảng cáo');}
  });
}

/* ---------- Tài khoản ---------- */
function parseJwt(t){try{const b=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(b))))}catch(e){return {}}}
function loadGoogle(cb,onErr){
  if(window.google&&google.accounts){cb();return}
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=cb;s.onerror=onErr;document.head.appendChild(s);
}
function accountPage(){
  const p=profile(),st=proStatus(),gid=(CONFIG.google||{}).clientId,msg=state.accmsg;state.accmsg=null;
  const pic=p&&p.picture&&/^https:\/\//.test(p.picture)?`<img class="avatar" src="${esc(p.picture)}" alt="" referrerpolicy="no-referrer">`:`<div class="avatar">${esc(initials(p&&p.name))}</div>`;
  const prof=p?`<div class="card"><div class="acc-head">${pic}<div><div class="big" style="font-size:20px">${esc(p.name)}</div><div class="sub">${esc(p.email||'Chưa có email')} · Đăng nhập: ${p.provider==='google'?'Google':'hồ sơ trên thiết bị'}</div></div><button class="chip" id="logout">Đăng xuất</button></div>
      <div class="formgrid"><label>Họ tên<input id="pn" value="${esc(p.name)}" ${p.provider==='google'?'disabled':''}></label><label>Email<input id="pe" value="${esc(p.email||'')}" ${p.provider==='google'?'disabled':''}></label><label>Số điện thoại / Zalo<input id="pp" value="${esc(p.phone||'')}" placeholder="Không bắt buộc"></label></div>
      <button class="btn" id="psave" style="margin-top:8px">Lưu thông tin</button> <span class="msg ok" id="pmsg"></span></div>`
    :`<div class="card"><h3>Đăng nhập</h3>
      <div id="gbtn" style="min-height:44px">${gid?'':'<button class="chip" disabled title="Quản trị viên chưa cấu hình Google Client ID">Đăng nhập bằng Google (chưa kích hoạt)</button>'}</div><div class="sub" id="gmsg">${gid?'':'Quản trị viên chưa cấu hình Google Client ID trong js/config.js.'}</div>
      <div class="sub" style="margin:10px 0 4px">Hoặc tạo hồ sơ ngay trên thiết bị này (không cần mật khẩu):</div>
      <div class="formgrid"><label>Họ tên<input id="pn" placeholder="Nguyễn Văn A"></label><label>Email<input id="pe" placeholder="ban@gmail.com" type="email"></label><label>Số điện thoại / Zalo<input id="pp" placeholder="Không bắt buộc"></label></div>
      <button class="btn" id="pcreate" style="margin-top:8px">Tạo hồ sơ</button> <span class="msg err" id="pmsg"></span>
      <div class="warnb" style="margin-top:10px">Trang chưa có máy chủ: hồ sơ chỉ lưu trong trình duyệt này, không đồng bộ giữa các thiết bị và không có mật khẩu bảo vệ. Gói Pro gắn với trình duyệt đang dùng.</div></div>`;
  const plan=`<div class="card pro-card" style="margin-top:14px"><div class="pill"><h2>Gói Pro</h2>${st.active?`<span class="n up">còn ${st.left} ngày</span>`:'<span class="fs">Chưa kích hoạt</span>'}</div>
    ${st.active?`<div>Gói hiện tại: <b>${esc(st.plan)}</b> · hết hạn <b>${st.end.toLocaleDateString('vi-VN')}</b></div>`:`<div class="muted">${st.reason?esc(st.reason)+'. ':''}Bạn đang dùng gói miễn phí.</div>`}
    <div class="keyrow"><input id="rk" placeholder="Nhập mã ${st.active?'gia hạn':'kích hoạt'}: ARROW-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false"><button class="btn" id="rkb">${st.active?'Gia hạn':'Kích hoạt'}</button></div>
    <div class="msg ${msg?(msg.ok?'ok':'err'):''}">${msg?esc(msg.msg):''}</div>
    <div class="sub">Gia hạn bằng mã mới sẽ <b>cộng dồn</b> vào thời hạn còn lại. <a href="#/pro" style="color:var(--acc);font-weight:700">Xem các gói &amp; cách thanh toán →</a></div></div>`;
  app.innerHTML=`<h2 style="margin:0 0 10px;color:var(--deep)">👤 Tài khoản</h2>${prof}${plan}<div class="legend" style="margin-top:12px">Thông tin cá nhân chỉ lưu trong trình duyệt của bạn; ArrowStock không gửi đi đâu nếu bạn không chủ động gửi góp ý cho quản trị viên.</div>`;
  const $$=id=>document.getElementById(id);
  $$('rkb').onclick=()=>{state.accmsg=activateKey($$('rk').value);updNav();accountPage()};$$('rk').onkeydown=e=>{if(e.key==='Enter')$$('rkb').click()};
  if(p){
    $$('logout').onclick=()=>{store.set('profile',null);updAcc();accountPage()};
    $$('psave').onclick=()=>{const n=$$('pn').value.trim();if(!n){$$('pmsg').textContent='Họ tên không được để trống';$$('pmsg').className='msg err';return}
      store.set('profile',{...p,name:n.slice(0,60),email:$$('pe').value.trim().slice(0,80),phone:$$('pp').value.trim().slice(0,20)});updAcc();$$('pmsg').className='msg ok';$$('pmsg').textContent='Đã lưu'};
  }else{
    $$('pcreate').onclick=()=>{const n=$$('pn').value.trim(),e=$$('pe').value.trim();
      if(!n){$$('pmsg').textContent='Vui lòng nhập họ tên';return}
      if(e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){$$('pmsg').textContent='Email chưa đúng định dạng';return}
      store.set('profile',{name:n.slice(0,60),email:e.slice(0,80),phone:$$('pp').value.trim().slice(0,20),provider:'local'});updAcc();accountPage()};
    if(gid)loadGoogle(()=>{google.accounts.id.initialize({client_id:gid,callback:r=>{const d=parseJwt(r.credential);if(!d.email){$$('gmsg').textContent='Đăng nhập Google không thành công.';return}
        store.set('profile',{name:d.name||d.email,email:d.email,picture:d.picture||'',provider:'google'});updAcc();accountPage()}});
      google.accounts.id.renderButton($$('gbtn'),{theme:'outline',size:'large',text:'signin_with',locale:'vi'})},()=>{$$('gmsg').textContent='Không tải được Google Sign-In (kiểm tra mạng hoặc Client ID).'});
  }
}

/* ---------- Chat hỗ trợ tự động + nhắn quản trị viên ---------- */
const CHAT={open:false,mode:'idle',draft:''};
function planText(){return CONFIG.plans.map(p=>`${p.name}: ${p.price}${p.per}`).join('; ')}
function faqList(){
  const c=CONFIG.contact||{},tiers=CONFIG.proTiers||{strong:5,good:4};
  const contact=[c.phone&&'ĐT '+c.phone,c.zalo&&'Zalo '+c.zalo,c.email&&c.email].filter(Boolean).join(' · ')||'quản trị viên chưa cập nhật thông tin liên hệ';
  return [
   ...(CONFIG.faq||[]).map(f=>({k:f.k.map(noDia),a:f.a,links:f.links})),
   {k:['gioi thieu','la gi','website','trang web','arrowstock','de lam gi','dung de'],a:'ArrowStock là trang web phân tích xu hướng cổ phiếu VN30 + HDG. Mỗi mã được chấm điểm theo 4 trụ cột: Cơ bản, Kỹ thuật (MA 20/50/100/200), Dòng tiền lớn (kể cả khối ngoại, tự doanh) và Tâm lý đám đông. Trang chỉ phân tích xu hướng, không phải khuyến nghị đầu tư.',links:[['Xem hướng dẫn','#/guide']]},
   {k:['huong dan','cach dung','su dung','chuc nang','tinh nang','lam sao xem','dung the nao'],a:'Các chức năng chính: (1) Tổng quan: bảng điểm cả danh mục, lọc theo nhận định/dòng tiền/khối ngoại; (2) Bấm một mã để xem biểu đồ nến + MA, khối ngoại & tự doanh, 4 trụ cột, sự kiện; (3) ★ Watchlist: tạo nhiều danh sách có tên; (4) ⭐ Pro: xem các mã Tín hiệu mạnh/tốt. Trang Hướng dẫn giải thích chi tiết từng chỉ báo.',links:[['Mở trang Hướng dẫn','#/guide'],['Mở Watchlist','#/watchlist']]},
   {k:['pro','goi pro','mo khoa','kich hoat','nang cap','tin hieu manh','tin hieu tot'],a:`Gói Pro mở khóa tên mã, giá và khối ngoại/tự doanh của các mã Tín hiệu mạnh (đạt ${tiers.strong}/5 tiêu chí) và Tín hiệu tốt (đạt ${tiers.good}/5). Giá: ${planText()}. Cách mở: (1) thanh toán theo hướng dẫn ở trang Pro, (2) nhận mã kích hoạt từ quản trị viên, (3) nhập mã ở trang Pro hoặc Tài khoản.`,links:[['Xem gói Pro','#/pro'],['Nhập mã ở Tài khoản','#/account']]},
   {k:['gia han','het han','con bao nhieu ngay','thoi han'],a:'Vào mục Tài khoản để xem ngày hết hạn và nhập mã gia hạn. Mã mới sẽ được cộng dồn vào thời hạn còn lại.',links:[['Mở Tài khoản','#/account']]},
   {k:['thanh toan','gia bao nhieu','bao nhieu tien','chuyen khoan','phi'],a:`Giá hiện tại: ${planText()}. Thanh toán thực hiện ngoài trang (chuyển khoản), sau đó quản trị viên gửi mã kích hoạt. Trang không thu thông tin thẻ. Liên hệ: ${contact}.`,links:[['Xem hướng dẫn thanh toán','#/pro']]},
   {k:['dang nhap','tai khoan','gmail','google','dang ky','mat khau'],a:'Bạn có thể tạo hồ sơ trên thiết bị hoặc đăng nhập bằng Google (nếu quản trị viên đã bật). Lưu ý: trang chưa có máy chủ nên hồ sơ và gói Pro chỉ lưu trong trình duyệt đang dùng.',links:[['Mở Tài khoản','#/account']]},
   {k:['watchlist','danh sach theo doi','theo doi'],a:'Bấm ☆ cạnh mã để thêm vào Watchlist. Ở tab ★ Watchlist bạn có thể tạo nhiều danh sách, đặt tên, đổi tên, xóa. Dữ liệu lưu trong trình duyệt của bạn.',links:[['Mở Watchlist','#/watchlist']]},
   {k:['du lieu','gia that','mo phong','sai gia','gia sai','nguon'],a:'Nếu góc trên ghi “Dữ liệu MÔ PHỎNG” thì giá, khối lượng, khối ngoại/tự doanh là số giả lập để minh họa, không dùng để giao dịch. Quản trị viên cần nạp dữ liệu thật thì trang mới hiện “Dữ liệu thực”. Nếu bạn thấy số liệu lệch so với thực tế, hãy báo để quản trị viên kiểm tra.'},
   {k:['nen mua','nen ban','mua ma nao','khuyen nghi','tu van','dau tu','loi nhuan','chac thang'],a:'ArrowStock chỉ phân tích xu hướng, không phải khuyến nghị đầu tư và không cam kết lợi nhuận. Quyết định mua/bán là của bạn; hãy tự cân nhắc rủi ro.'},
   {k:['quang cao','dat quang cao','banner','tai tro'],a:`Bạn muốn đặt quảng cáo trên ArrowStock? Vui lòng liên hệ quản trị viên: ${contact}.`},
   {k:['lien he','quan tri','admin','so dien thoai','zalo','hotline','gap nguoi'],a:`Thông tin liên hệ quản trị viên: ${contact}. Bạn cũng có thể gửi tin nhắn ngay tại đây: nhập “góp ý” để gửi cho quản trị viên.`},
   {k:['xin chao','chao','hello','hi ','alo'],a:'Xin chào! Mình là trợ lý tự động của ArrowStock. Bạn muốn hỏi về chức năng trang web, gói Pro hay cần báo lỗi?'},
   {k:['cam on','thanks','ok roi'],a:'Rất vui được hỗ trợ bạn! Cần gì thêm cứ nhắn nhé.'}
  ];
}
const FEEDBACK_KEYS=['loi','bug','sai','khong duoc','khong hien','bat cap','cham','treo','khong vao','that vong','khieu nai','phan anh','gop y','bao loi','de xuat','kho dung','hong'];
function botReply(text){
  const t=' '+noDia(text)+' ';
  if(FEEDBACK_KEYS.some(k=>t.includes(k))){CHAT.mode='feedback';return {t:'Cảm ơn bạn đã phản hồi, mình rất tiếc vì sự bất tiện này. Bạn hãy mô tả chi tiết giúp mình: bạn đang ở trang nào, đã thao tác gì và kết quả mong đợi là gì? Tin nhắn tiếp theo của bạn sẽ được ghi nhận để gửi cho quản trị viên.'}}
  let best=null,bs=0;for(const f of faqList()){const sc=f.k.filter(k=>t.includes(k)).length;if(sc>bs){bs=sc;best=f}}
  if(best)return {t:best.a,links:best.links};
  return {t:'Mình chưa hiểu rõ câu hỏi này. Bạn thử chọn một chủ đề bên dưới, hoặc nhập “góp ý” để gửi câu hỏi cho quản trị viên.'};
}
function addMsg(role,text,links,actions){
  const box=document.getElementById('chatmsgs'),d=document.createElement('div');d.className='cm '+role;
  d.innerHTML=esc(text).replace(/\n/g,'<br>');
  const row=document.createElement('div');row.className='cacts';
  (links||[]).forEach(([l,h])=>{const a=document.createElement('a');a.className='chip';a.href=h;a.textContent=l;row.appendChild(a)});
  (actions||[]).forEach(([l,fn])=>{const b=document.createElement('button');b.className='chip on';b.textContent=l;b.onclick=fn;row.appendChild(b)});
  if(row.children.length)d.appendChild(row);box.appendChild(d);box.scrollTop=box.scrollHeight;
}
function feedbackText(msg){const p=profile()||{};return `[ArrowStock] Góp ý/báo lỗi\nTừ: ${p.name||'(ẩn danh)'} ${p.email?'<'+p.email+'>':''} ${p.phone||''}\nTrang: ${location.href}\nThời gian: ${new Date().toLocaleString('vi-VN')}\nNội dung: ${msg}`}
function sendActions(msg){
  const c=CONFIG.contact||{},txt=feedbackText(msg),acts=[];
  if(c.feedbackEndpoint)acts.push(['Gửi cho quản trị viên',async()=>{try{const r=await fetch(c.feedbackEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,page:location.href,name:(profile()||{}).name||'',email:(profile()||{}).email||'',time:new Date().toISOString()})});
    addMsg('bot',r.ok?'Đã gửi tin nhắn cho quản trị viên. Cảm ơn bạn!':'Gửi chưa thành công, bạn thử lại hoặc liên hệ trực tiếp nhé.')}catch(e){addMsg('bot','Gửi chưa thành công (lỗi mạng). Bạn thử lại hoặc liên hệ trực tiếp nhé.')}}]);
  if(c.zalo)acts.push(['Gửi qua Zalo',()=>{try{navigator.clipboard.writeText(txt)}catch(e){}window.open('https://zalo.me/'+digits(c.zalo),'_blank','noopener');addMsg('bot','Nội dung đã được sao chép — hãy dán (Cmd/Ctrl + V) vào khung chat Zalo của quản trị viên.')}]);
  if(c.email)acts.push(['Gửi qua email',()=>{location.href='mailto:'+c.email+'?subject='+encodeURIComponent('[ArrowStock] Góp ý/báo lỗi')+'&body='+encodeURIComponent(txt)}]);
  return acts;
}
function userSend(text){
  text=String(text||'').trim().slice(0,1000);if(!text)return;addMsg('user',text);const hist=store.get('chat',[]);hist.push({r:'user',t:text});
  let rep;
  if(CHAT.mode==='feedback'){
    CHAT.mode='idle';const box=store.get('outbox',[]);box.push({t:new Date().toISOString(),m:text,page:location.hash});store.set('outbox',box.slice(-30));
    const acts=sendActions(text);
    rep={t:acts.length?'Mình đã ghi nhận nội dung của bạn. Để quản trị viên nhận được, hãy bấm một nút bên dưới:':'Mình đã lưu nội dung của bạn trên thiết bị này. Hiện quản trị viên chưa cấu hình kênh nhận tin (Zalo/email/biểu mẫu) nên tin chưa thể gửi đi tự động — bạn vui lòng liên hệ trực tiếp khi có thông tin liên hệ.',actions:acts};
  }else rep=botReply(text);
  setTimeout(()=>{addMsg('bot',rep.t,rep.links,rep.actions);hist.push({r:'bot',t:rep.t});store.set('chat',hist.slice(-40))},350);
}
const CHIPS=['Giới thiệu trang web','Hướng dẫn chức năng','Làm sao để mở gói Pro?','Gia hạn gói Pro','Báo lỗi / góp ý','Liên hệ quản trị viên'];
function buildChat(){
  const w=document.createElement('div');w.id='chatw';
  w.innerHTML=`<button id="chatfab" aria-label="Mở hỗ trợ">💬 <span>Hỗ trợ</span></button>
    <div id="chatpanel" hidden><div class="chead"><div><b>Hỗ trợ ArrowStock</b><small>Trả lời tự động · quản trị viên phản hồi qua Zalo/email</small></div><button id="chatx" aria-label="Đóng">✕</button></div>
    <div id="chatmsgs"></div><div class="cchips" id="cchips"></div><form id="cform"><input id="cin" placeholder="Nhập câu hỏi…" autocomplete="off" maxlength="1000"><button class="btn" type="submit">Gửi</button></form></div>`;
  document.body.appendChild(w);
  const panel=w.querySelector('#chatpanel');
  w.querySelector('#chatfab').onclick=()=>openChat();w.querySelector('#chatx').onclick=()=>{panel.hidden=true;CHAT.open=false};
  w.querySelector('#cchips').innerHTML=CHIPS.map(c=>`<button class="chip" type="button">${c}</button>`).join('');
  w.querySelectorAll('#cchips .chip').forEach(b=>b.onclick=()=>userSend(b.textContent));
  w.querySelector('#cform').onsubmit=e=>{e.preventDefault();const i=document.getElementById('cin');userSend(i.value);i.value=''};
  const hist=store.get('chat',[]);
  if(hist.length)hist.forEach(m=>addMsg(m.r==='user'?'user':'bot',m.t));
  else addMsg('bot','Xin chào! Mình là trợ lý tự động của ArrowStock. Mình có thể giới thiệu trang web, hướng dẫn chức năng, hướng dẫn mở/gia hạn gói Pro và tiếp nhận góp ý, báo lỗi để chuyển cho quản trị viên. Bạn muốn hỏi gì?');
}
function openChat(prefill){
  const p=document.getElementById('chatpanel');p.hidden=false;CHAT.open=true;const m=document.getElementById('chatmsgs');m.scrollTop=m.scrollHeight;
  if(prefill)userSend(prefill);else document.getElementById('cin').focus();
}
function initWidgets(){renderContact();buildChat();renderAds();updAcc()}
