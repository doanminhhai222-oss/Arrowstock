/* Kích hoạt Pro bằng mã. LƯU Ý: kiểm tra phía trình duyệt chỉ là rào cản mềm — xem README (cần backend để khóa thật). */
function sha256(str){
  const P=[];for(let n=2;P.length<64;n++)if(P.every(p=>n%p))P.push(n);
  const fr=(x,r)=>Math.floor((Math.pow(x,r)%1)*4294967296),K=P.map(p=>fr(p,1/3));let H=P.slice(0,8).map(p=>fr(p,1/2));
  const b=[...new TextEncoder().encode(str)],l=b.length*8;b.push(128);while(b.length%64!==56)b.push(0);
  for(let i=7;i>=0;i--)b.push(i>3?0:(l>>>(i*8))&255);
  const rr=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<b.length;o+=64){const w=[];for(let i=0;i<16;i++)w[i]=(b[o+4*i]<<24)|(b[o+4*i+1]<<16)|(b[o+4*i+2]<<8)|b[o+4*i+3];
    for(let i=16;i<64;i++){const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3),s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
    let [a,b2,c2,d2,e2,f2,g2,h2]=H;
    for(let i=0;i<64;i++){const S1=rr(e2,6)^rr(e2,11)^rr(e2,25),ch=(e2&f2)^(~e2&g2),t1=(h2+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),mj=(a&b2)^(a&c2)^(b2&c2),t2=(S0+mj)|0;
      h2=g2;g2=f2;f2=e2;e2=(d2+t1)|0;d2=c2;c2=b2;b2=a;a=(t1+t2)|0}
    H=[a,b2,c2,d2,e2,f2,g2,h2].map((v,i)=>(v+H[i])|0)}
  return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
const normKey=k=>(k||'').toUpperCase().replace(/\s+/g,'');
function proStatus(){
  const l=store.get('license',null);if(!l)return {active:false};
  const lic=CONFIG.licenses.find(x=>x.h===l.h);if(!lic)return {active:false,reason:'Mã không còn hiệu lực'};
  const end=new Date(l.start).getTime()+lic.days*864e5+(l.bonus||0),left=Math.ceil((end-Date.now())/864e5);
  return left>0?{active:true,plan:lic.plan,left,end:new Date(end)}:{active:false,reason:'Gói đã hết hạn',plan:lic.plan};
}
function activateKey(raw){
  const h=sha256(normKey(raw)),lic=CONFIG.licenses.find(x=>x.h===h);
  if(!lic)return {ok:false,msg:'Mã không hợp lệ. Kiểm tra lại cách gõ (không phân biệt hoa/thường).'};
  const old=store.get('license',null),cur=proStatus();
  if(!(old&&old.h===h))store.set('license',{h,start:new Date().toISOString(),bonus:cur.active?Math.max(0,cur.end.getTime()-Date.now()):0});
  const s=proStatus();return s.active?{ok:true,msg:`Đã kích hoạt “${s.plan}”, còn ${s.left} ngày.`}:{ok:false,msg:'Mã này đã hết hạn.'};
}
