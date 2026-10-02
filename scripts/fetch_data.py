#!/usr/bin/env python3
"""Lấy giá THẬT cho VN30 + HDG -> data/market.json và data/market.js (chạy trên máy có Internet).
Cài:  pip3 install -U vnstock
Chạy: python3 scripts/fetch_data.py        (đứng ở thư mục gốc của dự án)
Giá lưu theo nghìn đồng. Khối ngoại/tự doanh: nguồn này không cung cấp -> để null, web sẽ ước tính và cảnh báo."""
import json, re, sys, datetime as dt, statistics
try:
    from vnstock import Vnstock
except ImportError:
    sys.exit('Thiếu thư viện. Chạy:  pip3 install -U vnstock   rồi chạy lại.')

SYMS = re.findall(r"\{t:'(\w+)'", open('js/data.js', encoding='utf8').read())
end = dt.date.today(); start = end - dt.timedelta(days=900)

def history(sym):
    for src in ('VCI', 'TCBS', 'MSN'):
        try:
            df = Vnstock().stock(symbol=sym, source=src).quote.history(start=str(start), end=str(end), interval='1D')
            if df is not None and len(df) > 250:
                return df.tail(460).to_dict('records'), src
        except Exception as e:
            err = e
    raise RuntimeError(f'không lấy được {sym}: {err if "err" in dir() else "thiếu dữ liệu"}')

out = {"source": "vnstock", "stocks": {}}
for s in SYMS:
    try:
        rows, src = history(s)
    except Exception as e:
        print('BỎ QUA', s, '-', e); continue
    k = 1000 if statistics.median(r['close'] for r in rows) > 1000 else 1  # đổi đồng -> nghìn đồng nếu cần
    out["stocks"][s] = {"candles": [dict(t=str(r['time'])[:10], o=r['open']/k, h=r['high']/k, l=r['low']/k, c=r['close']/k, v=int(r['volume'])) for r in rows],
                        "foreign": None, "prop": None}
    last = out["stocks"][s]["candles"][-1]
    print(f'OK {s:4} {src}  {last["t"]}  đóng cửa {last["c"]:.2f}')
if not out["stocks"]:
    sys.exit('Không lấy được mã nào — kiểm tra Internet.')
out["asOf"] = max(v["candles"][-1]["t"] for v in out["stocks"].values())
js = json.dumps(out, ensure_ascii=False)
open('data/market.json', 'w', encoding='utf8').write(js)
open('data/market.js', 'w', encoding='utf8').write('window.MARKET_DATA=' + js + ';')
print(f'Xong: {len(out["stocks"])}/{len(SYMS)} mã, phiên {out["asOf"]}. Mở lại index.html (nhấn Cmd+Shift+R).')
