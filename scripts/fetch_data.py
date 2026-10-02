#!/usr/bin/env python3
"""Nạp dữ liệu thật cho VN30 -> data/market.json (chưa được kiểm thử trong môi trường dựng, cần mạng).
Yêu cầu: pip install vnstock
Định dạng: {"asOf","source","stocks":{MÃ:{"candles":[{t,o,h,l,c,v}],"foreign":[tỷ đ]|null,"prop":[tỷ đ]|null}}}
Giá tính bằng nghìn đồng. Nếu foreign/prop thiếu, web tự ước tính dòng tiền từ vị trí đóng cửa."""
import json, re, datetime as dt
from vnstock import Vnstock
SYMS = re.findall(r"t:'(\w+)'", open('js/data.js', encoding='utf8').read())
end = dt.date.today(); start = end - dt.timedelta(days=800)
out = {"source": "vnstock", "stocks": {}}
for s in SYMS:
    df = Vnstock().stock(symbol=s, source='VCI').quote.history(start=str(start), end=str(end), interval='1D').tail(460)
    out["stocks"][s] = {"candles": [dict(t=str(r.time)[:10], o=r.open, h=r.high, l=r.low, c=r.close, v=int(r.volume)) for r in df.itertuples()],
                        "foreign": None, "prop": None}
    out["asOf"] = out["stocks"][s]["candles"][-1]["t"]
json.dump(out, open('data/market.json', 'w'))
print('OK', len(SYMS), 'mã')
