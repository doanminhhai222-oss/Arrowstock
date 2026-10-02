---
name: arrowstock
description: Dự án ArrowStock — web tĩnh phân tích xu hướng cổ phiếu VN30 + HDG (chấm điểm 4 trụ cột, MA 20/50/100/200, dòng tiền, khối ngoại/tự doanh, watchlist có tên). Dùng khi sửa/mở rộng giao diện, thuật toán chấm điểm, nạp dữ liệu giá thật, thêm mã, hoặc hướng dẫn người dùng chạy/triển khai trang.
---

# ArrowStock — VN30 + HDG

Web tĩnh (HTML/CSS/JS thuần, không build, không phụ thuộc CDN). Giao diện tiếng Việt, nền sáng xanh ngọc + điểm nhấn vàng (theo ảnh `assets/hero.jpg` của người dùng). Người dùng xưng "tao/mày", không rành Terminal (dùng MacBook) — hướng dẫn phải từng thao tác một, và nhắc `cd ` + kéo thả thư mục, không gõ sai dấu cách.

## Cấu trúc
- `index.html` — khung trang, nav (Tổng quan / ★ Watchlist / Hướng dẫn), nạp script theo thứ tự: `data/market.js` (tùy chọn) → `js/data.js` → `sim.js` → `indicators.js` → `analysis.js` → `chart.js` → `app.js`.
- `js/data.js` — mảng `VN30` (cả HDG, `x:1` = ngoài rổ). Trường: t, n, s, p, pe, pb, roe, g, dy, risk (NPL nếu bank, D/E nếu không), cap, v, vol. **Chỉ số cơ bản là số ước chừng, chưa phải số thật.** Thêm mã = thêm một dòng ở đây.
- `js/sim.js` — dữ liệu MÔ PHỎNG xác định theo mã (460 phiên, khối ngoại/tự doanh có xu hướng theo giai đoạn). Dùng khi không có dữ liệu thật; banner "Dữ liệu MÔ PHỎNG".
- `js/indicators.js` — SMA/EMA/RSI/MACD/CMF/MFI.
- `js/analysis.js` — engine: `analyzeFundamental`, `analyzeTechnical`, `analyzeFlow` (+`tradeTrend` cho khối ngoại/tự doanh), `analyzeSentiment`, `autoEvents`, `analyze`.
- `js/chart.js` — canvas: nến + MA + khối lượng (đánh dấu bùng nổ >1.5× TB20) + dòng tiền lớn, crosshair/tooltip. Bảng màu sáng.
- `js/app.js` — router theo hash (`#/`, `#/watchlist`, `#/guide`, `#/MÃ`), bảng sắp xếp/lọc, trang chi tiết, hướng dẫn, watchlist.
- `css/style.css`, `scripts/fetch_data.py`, `README.md`.

## Quy tắc chấm điểm
Tổng = Kỹ thuật 35% + Dòng tiền lớn 25% + Cơ bản 20% + Tâm lý 20%. Nhãn: ≥68 Tích cực mạnh, ≥56 Tích cực, ≥44 Trung lập, ≥34 Tiêu cực, còn lại Tiêu cực mạnh. Điểm trụ cột: ≥62 tích cực, 45–61 trung lập, <45 tiêu cực.
- Dòng tiền (GTGD TB5/TB20): ≥1.8 Bùng nổ, ≥1.25 Tăng, ≥0.8 Bình thường, ≥0.55 Suy yếu, <0.55 Cạn kiệt; đọc kèm hướng giá.
- Pha xu hướng từ vị trí giá so với 4 MA, sắp xếp MA, độ dốc, golden/death cross, RSI, MACD; có hỗ trợ/kháng cự gần.
- Khối ngoại/tự doanh: mua/bán ròng 1/5/10/20 phiên, so 20 phiên trước, chuỗi phiên, nhãn (Mua ròng liên tục, Đảo chiều sang mua, Giảm mua/chốt lời, Bán ròng…).
- Tâm lý: chỉ số 0–100 (RSI, tỷ lệ KL tăng/giảm, lệch MA20, đà 10 phiên, biến động); thái cực bị trừ điểm (contrarian).

## Tính năng đã có
Hero + 4 thẻ tổng quan + thẻ khối ngoại/tự doanh 5 phiên; bảng (cột NN 5D, TD 5D, bộ lọc nhanh); trang chi tiết (biểu đồ, khối ngoại & tự doanh, xu hướng tiếp theo, 4 trụ cột, tin tức & sự kiện, ghi chú); trang Hướng dẫn; **nhiều watchlist có tên** (tạo/đổi tên/xóa, lưu `localStorage` khóa `arrowstock.lists`, tự chuyển từ khóa cũ `wl`); tin tức: nút mở Google News/Vietstock/CafeF… + `data/news.json` tùy chọn + sự kiện tự rút ra từ dữ liệu (KHÔNG bịa tin).
Bảng đã thu gọn để cột "Nhận định" không bị cắt; <1250px ẩn cột %1T.

## Dữ liệu thật
Môi trường cloud của Claude KHÔNG ra được nguồn giá VN (TCBS/Vietcap/DNSE/Yahoo bị chặn) → không tự lấy giá thật được; phải nhờ người dùng chạy trên máy họ:
`pip3 install -U vnstock && python3 scripts/fetch_data.py` → `data/market.json` + `data/market.js` (`window.MARKET_DATA`, chạy được khi bấm đúp `index.html`). Script thử VCI→TCBS→MSN, tự đổi đơn vị đồng→nghìn đồng; **chưa được kiểm thử với mạng thật**. Khối ngoại/tự doanh để null → app ước tính từ CLV×GTGD và cảnh báo (`s.est`). Định dạng thật: `{asOf,source,stocks:{MÃ:{candles:[{t,o,h,l,c,v}],foreign:[tỷ]|null,prop:[tỷ]|null}}}`.
Không bao giờ trình bày dữ liệu mô phỏng như giá thật.

## Chạy & triển khai
- Cục bộ: bấm đúp `index.html` hoặc `python3 -m http.server 8000`.
- Người dùng đang dùng GitHub Pages trỏ nhánh `claude/vn30-stock-analysis-platform-44vvkz` (repo `doanminhhai222-oss/Arrowstock`): push là tự cập nhật sau 1–2 phút (xem tab Actions), tải lại bằng Cmd+Shift+R. Giá thật: người dùng upload `data/market.js` lên đúng nhánh qua web GitHub (Add file → Upload files).
- Không tạo PR nếu người dùng chưa yêu cầu.

## Kiểm thử nhanh
Smoke test engine bằng Node (`vm.runInNewContext` nạp data/sim/indicators/analysis, in điểm 31 mã); chụp ảnh bằng `playwright-core` + `/opt/pw-browsers/chromium` qua `python3 -m http.server`. Server nền có thể chết giữa các lượt — khởi động lại trước khi chụp.

## Nhật ký 2026-10-02
Dựng web từ đầu (dữ liệu mô phỏng) → đổi style sáng theo ảnh, thêm HDG, watchlist, hướng dẫn, tin tức, khối ngoại/tự doanh → script giá thật + `market.js` → thu gọn bảng → watchlist nhiều list có tên → hướng dẫn người dùng Mac chạy/cập nhật/đưa giá thật lên Pages.
