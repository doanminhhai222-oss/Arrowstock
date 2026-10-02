/* Bộ sinh dữ liệu MÔ PHỎNG (xác định theo mã) — dùng khi chưa có data/market.json thật. */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function tradingDays(n,end){const out=[];const d=new Date(end+'T00:00:00Z');while(out.length<n){const w=d.getUTCDay();if(w!==0&&w!==6)out.unshift(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()-1)}return out}
function simulateStock(m,dates){
  const rnd=mulberry32(hashStr(m.t)),g=()=>{let u=0,v=0;while(!u)u=rnd();v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
  const N=dates.length,C=[],F=[],P=[];let px=100,i=0;
  const burst=rnd(); // kịch bản dòng tiền 5 phiên cuối
  const tail=burst<.25?1.8+rnd()*.9:burst<.45?.4+rnd()*.2:1;
  let regimes=[];while(i<N){const len=30+Math.floor(rnd()*70);regimes.push({len,mu:(rnd()-.46)*.0042,sg:m.vol*(.8+rnd()*.5),vf:.7+rnd()*.8});i+=len}
  let ri=0,left=regimes[0].len;
  for(i=0;i<N;i++){
    if(left--<=0){ri++;left=regimes[ri].len}
    const R=regimes[ri];let r=R.mu+R.sg*g();r=Math.max(-.068,Math.min(.068,r));
    const o=px*(1+g()*.003),c=px*(1+r),h=Math.max(o,c)*(1+Math.abs(g())*.35*R.sg),l=Math.min(o,c)*(1-Math.abs(g())*.35*R.sg);
    let v=m.v*1e6*R.vf*Math.exp(.35*g())*(1+16*Math.abs(r));
    if(i>=N-5)v*=1+(tail-1)*((i-(N-6))/5);
    C.push({t:dates[i],o,h,l,c,v:Math.round(v)});px=c;
    const val=c*v/1e6; // tỷ đồng
    F.push(val*(.07*Math.sign(r)*rnd()+.05*g()));P.push(val*(.03*Math.sign(r)*rnd()+.04*g()));
  }
  const k=m.p/C[N-1].c;
  C.forEach(x=>{x.o=+(x.o*k).toFixed(2);x.h=+(x.h*k).toFixed(2);x.l=+(x.l*k).toFixed(2);x.c=+(x.c*k).toFixed(2);x.v=Math.round(x.v/k)});
  F.forEach((x,j)=>F[j]=+x.toFixed(2));P.forEach((x,j)=>P[j]=+x.toFixed(2));
  return {candles:C,foreign:F,prop:P};
}
function buildSimMarket(){
  const dates=tradingDays(460,'2026-10-02'),stocks={};
  VN30.forEach(m=>stocks[m.t]=simulateStock(m,dates));
  return {asOf:dates[dates.length-1],source:'sim',stocks};
}
