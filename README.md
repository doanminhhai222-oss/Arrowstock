# ArrowStock — Phân tích xu hướng VN30 + HDG

Web tĩnh (HTML/CSS/JS, không cần build). Chạy: `python3 -m http.server 8000` rồi mở http://localhost:8000

## Tính năng
- Bảng 30 mã VN30: giá, %1D/5D/1T, pha xu hướng, trạng thái dòng tiền (Bùng nổ → Cạn kiệt), điểm 4 trụ cột, nhận định.
- Trang chi tiết mỗi mã: nến + MA20/50/100/200, khối lượng (đánh dấu phiên bùng nổ), dòng tiền lớn, xu hướng tiếp theo + hỗ trợ/kháng cự.
- 4 trụ cột: Cơ bản (20%), Kỹ thuật (35%), Dòng tiền lớn (25%), Tâm lý đám đông (20%) → Tích cực mạnh / Tích cực / Trung lập / Tiêu cực / Tiêu cực mạnh.

## Dữ liệu
Mặc định dùng dữ liệu **mô phỏng** (js/sim.js) và chỉ số cơ bản **minh họa** (js/data.js). Để dùng dữ liệu thật:
`pip3 install -U vnstock && python3 scripts/fetch_data.py` → tạo `data/market.json` và `data/market.js`; mở lại `index.html` (bấm đúp cũng được, không cần server). Cần bổ sung khối ngoại/tự doanh và cập nhật chỉ số cơ bản từ BCTC; danh mục VN30 cần đối chiếu kỳ rà soát mới nhất.

Chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.

## Watchlist, ghi chú
Nhiều danh sách có tên (tạo/đổi tên/xóa). Lưu trong localStorage của trình duyệt (không có server).

## Tin tức (tùy chọn)
Tạo `data/news.json`:
```json
{"HDG":[{"title":"Tiêu đề","url":"https://...","src":"CafeF","date":"2026-10-01"}]}
```
Nếu không có file, trang chỉ hiện nút mở tin trên Google News/Vietstock/CafeF… và các sự kiện tự rút ra từ dữ liệu giá.

## Khối ngoại / tự doanh thật
`data/market.json` nhận thêm `"foreign":[...]` và `"prop":[...]` (tỷ đồng, mua ròng dương, cùng độ dài với `candles`). Thiếu thì web ước tính.

## Gói Pro — khuyến nghị đầu tư trả phí
Mục ⭐ Pro mở khóa **vùng mua, cắt lỗ, Target 1, Target 2, R:R, tỷ trọng gợi ý** cho từng mã (`analyzeTrade` trong `js/analysis.js`) và bảng khuyến nghị toàn danh mục.
- **Cấu hình gói/giá/thông tin nhận tiền:** `js/config.js` (giá mặc định chỉ là ví dụ — tự đặt giá; để trống `payment` thì trang hiện hướng dẫn liên hệ).
- **Tạo mã kích hoạt:** `python3 scripts/make_license.py "Pro 1 tháng" 30 5` → in 5 mã gửi khách (bí mật) + các dòng băm SHA-256 dán vào `licenses` trong `js/config.js`. Mã demo `ARROW-DEMO-2026` (3 ngày) — **xóa dòng demo trước khi bán**.
- **Giới hạn quan trọng:** trang là web tĩnh nên khóa chỉ là rào cản mềm (ai mở DevTools vẫn xem được logic/số liệu). Muốn khóa thật phải có backend: tính khuyến nghị ở server, cấp token sau khi thanh toán (PayOS/Stripe/VietQR + serverless function), kiểm tra token mỗi lần tải.
- **Pháp lý:** thu phí cho khuyến nghị mua/bán chứng khoán ở Việt Nam có thể thuộc hoạt động tư vấn đầu tư chứng khoán cần giấy phép — hãy hỏi luật sư/UBCKNN trước khi bán thật.
- Trang không thu thông tin thẻ; thanh toán thực hiện ngoài trang.
