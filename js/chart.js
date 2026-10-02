/* Biểu đồ nến + MA + khối lượng + dòng tiền lớn, vẽ bằng canvas (không phụ thuộc thư viện ngoài). */
const MA_COL={20:'#f59e0b',50:'#38bdf8',100:'#c084fc',200:'#f472b6'};
class StockChart{
  constructor(canvas,tip){this.cv=canvas;this.tip=tip;this.hover=-1;this.range=120;this.show={20:1,50:1,100:1,200:1};
    const mv=e=>{const r=canvas.getBoundingClientRect();this.hover=this.idxAt(e.clientX-r.left);this.draw()};
    canvas.addEventListener('pointermove',mv);canvas.addEventListener('pointerdown',mv);
    canvas.addEventListener('pointerleave',()=>{this.hover=-1;this.draw()});
    new ResizeObserver(()=>this.draw()).observe(canvas)}
  set(a){this.a=a;this.vma=Ind.sma(a.C.map(x=>x.v),20);this.draw()}
  idxAt(x){if(!this.L)return -1;const{x0,w,n,s}=this.L;const i=Math.floor((x-x0)/(w/n));return i<0||i>=n?-1:s+i}
  draw(){
    if(!this.a)return;const cv=this.cv,W=cv.clientWidth,H=Math.round(Math.min(640,Math.max(420,W*.62))),dpr=devicePixelRatio||1;
    cv.style.height=H+'px';cv.width=W*dpr;cv.height=H*dpr;const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
    const {C,ma,s}=this.a,N=C.length,n=Math.min(this.range,N),st=N-n,x0=8,pw=W-x0-52,cw=pw/n;
    const hP=H*.56,hV=H*.18,hF=H*.18,yP=6,yV=yP+hP+10,yF=yV+hV+10;
    this.L={x0,w:pw,n,s:st};
    const vis=C.slice(st);let mn=Math.min(...vis.map(x=>x.l)),mx=Math.max(...vis.map(x=>x.h));
    [20,50,100,200].forEach(k=>{if(this.show[k])for(let i=st;i<N;i++){const v=ma[k][i];if(v!=null){mn=Math.min(mn,v);mx=Math.max(mx,v)}}});
    const pad=(mx-mn)*.06;mn-=pad;mx+=pad;const Y=v=>yP+hP*(1-(v-mn)/(mx-mn)),X=i=>x0+(i-st+.5)*cw;
    g.font='11px system-ui';g.textBaseline='middle';g.strokeStyle='#243044';g.fillStyle='#8b98ad';g.lineWidth=1;
    for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4,y=Y(v);g.beginPath();g.moveTo(x0,y);g.lineTo(x0+pw,y);g.stroke();g.textAlign='left';g.fillText(v.toFixed(2),x0+pw+5,y)}
    // nến
    vis.forEach((c,j)=>{const i=st+j,x=X(i),up=c.c>=c.o,col=up?'#22c55e':'#ef4444';g.strokeStyle=g.fillStyle=col;
      g.beginPath();g.moveTo(x,Y(c.h));g.lineTo(x,Y(c.l));g.stroke();const bw=Math.max(1,cw*.7),t=Y(Math.max(c.o,c.c)),b=Y(Math.min(c.o,c.c));g.fillRect(x-bw/2,t,bw,Math.max(1,b-t))});
    [20,50,100,200].forEach(k=>{if(!this.show[k])return;g.strokeStyle=MA_COL[k];g.lineWidth=1.5;g.beginPath();let on=0;
      for(let i=st;i<N;i++){const v=ma[k][i];if(v==null)continue;on?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v));on=1}g.stroke()});
    g.lineWidth=1;
    // khối lượng
    const mv=Math.max(...vis.map(x=>x.v),...this.vma.slice(st).map(v=>v||0));
    vis.forEach((c,j)=>{const i=st+j,h=hV*c.v/mv,burst=this.vma[i]&&c.v>1.5*this.vma[i];g.fillStyle=(c.c>=c.o?'#22c55e':'#ef4444')+(burst?'':'88');g.fillRect(X(i)-Math.max(1,cw*.7)/2,yV+hV-h,Math.max(1,cw*.7),h);
      if(burst){g.fillStyle='#fff';g.fillRect(X(i)-1,yV+hV-h-3,2,2)}});
    g.strokeStyle='#f59e0b';g.beginPath();let on=0;for(let i=st;i<N;i++){if(this.vma[i]==null)continue;const y=yV+hV*(1-this.vma[i]/mv);on?g.lineTo(X(i),y):g.moveTo(X(i),y);on=1}g.stroke();
    g.fillStyle='#8b98ad';g.textAlign='left';g.fillText('KL (chấm trắng = bùng nổ >1.5× TB20)',x0+4,yV+7);
    // dòng tiền lớn
    const net=[];for(let i=0;i<N;i++)net.push((s.foreign[i]||0)+(s.prop[i]||0));
    const fv=net.slice(st),fm=Math.max(...fv.map(Math.abs))||1,mid=yF+hF/2;
    g.strokeStyle='#243044';g.beginPath();g.moveTo(x0,mid);g.lineTo(x0+pw,mid);g.stroke();
    fv.forEach((v,j)=>{const h=hF/2*Math.abs(v)/fm;g.fillStyle=v>=0?'#22c55e':'#ef4444';g.fillRect(X(st+j)-Math.max(1,cw*.7)/2,v>=0?mid-h:mid,Math.max(1,cw*.7),h)});
    let cum=0;const cu=fv.map(v=>cum+=v),cm=Math.max(...cu.map(Math.abs))||1;g.strokeStyle='#38bdf8';g.lineWidth=1.5;g.beginPath();cu.forEach((v,j)=>{const y=mid-hF/2*v/cm;j?g.lineTo(X(st+j),y):g.moveTo(X(st+j),y)});g.stroke();g.lineWidth=1;
    g.fillStyle='#8b98ad';g.fillText('Dòng tiền lớn ròng (khối ngoại + tự doanh, tỷ đ) — đường xanh: lũy kế',x0+4,yF+7);
    // trục ngày
    g.textAlign='center';for(let k=0;k<5;k++){const i=st+Math.floor((n-1)*k/4);g.fillText(C[i].t.slice(5),Math.min(Math.max(X(i),24),W-60),H-4)}
    // crosshair
    const h=this.hover;
    if(h>=st&&h<N){const x=X(h);g.strokeStyle='#8b98ad88';g.setLineDash([4,4]);g.beginPath();g.moveTo(x,yP);g.lineTo(x,yF+hF);g.stroke();g.setLineDash([]);
      const c=C[h],p=h?C[h-1].c:c.o,r=(c.c/p-1)*100;
      this.tip.innerHTML=`<b>${c.t}</b><br>O ${c.o} H ${c.h} L ${c.l} C <b class="${r>=0?'up':'dn'}">${c.c} (${r>=0?'+':''}${r.toFixed(2)}%)</b><br>KL ${(c.v/1e6).toFixed(2)}tr · GTGD ${(c.c*c.v/1e6).toFixed(0)} tỷ<br>`+
        [20,50,100,200].map(k=>ma[k][h]!=null?`<span style="color:${MA_COL[k]}">MA${k} ${ma[k][h].toFixed(2)}</span>`:'').join(' ')+`<br>Dòng tiền lớn ${net[h]>=0?'+':''}${net[h].toFixed(1)} tỷ`;
      this.tip.style.display='block';const tw=this.tip.offsetWidth;this.tip.style.left=Math.min(Math.max(x+14,0),W-tw-4)+'px';this.tip.style.top='10px'}
    else this.tip.style.display='none';
  }
}
