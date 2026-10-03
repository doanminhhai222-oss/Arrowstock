const Ind={
 sma(a,n){const o=Array(a.length).fill(null);let s=0;for(let i=0;i<a.length;i++){s+=a[i];if(i>=n)s-=a[i-n];if(i>=n-1)o[i]=s/n}return o},
 ema(a,n){const k=2/(n+1),o=Array(a.length).fill(null);let p=null;for(let i=0;i<a.length;i++){if(a[i]==null)continue;p=p==null?a[i]:a[i]*k+p*(1-k);o[i]=p}return o},
 rsi(c,n=14){const o=Array(c.length).fill(null);let g=0,l=0;for(let i=1;i<c.length;i++){const d=c[i]-c[i-1],u=Math.max(d,0),w=Math.max(-d,0);
   if(i<=n){g+=u;l+=w;if(i===n){g/=n;l/=n;o[i]=100-100/(1+g/(l||1e-9))}}else{g=(g*(n-1)+u)/n;l=(l*(n-1)+w)/n;o[i]=100-100/(1+g/(l||1e-9))}}return o},
 macd(c){const e12=this.ema(c,12),e26=this.ema(c,26),m=c.map((_,i)=>e12[i]-e26[i]),s=this.ema(m,9);return{macd:m,signal:s,hist:m.map((x,i)=>x-s[i])}},
 clv(x){return x.h===x.l?0:((x.c-x.l)-(x.h-x.c))/(x.h-x.l)},
 cmf(C,n=20){const i1=C.length,s=C.slice(i1-n);let a=0,b=0;s.forEach(x=>{a+=this.clv(x)*x.v;b+=x.v});return a/(b||1)},
 mfi(C,n=14){let p=0,q=0;for(let i=C.length-n;i<C.length;i++){const t=(C[i].h+C[i].l+C[i].c)/3,t0=(C[i-1].h+C[i-1].l+C[i-1].c)/3,f=t*C[i].v;t>t0?p+=f:q+=f}return 100-100/(1+p/(q||1))},
 avg(a,i0,i1){let s=0;for(let i=i0;i<i1;i++)s+=a[i];return s/(i1-i0)}
};
