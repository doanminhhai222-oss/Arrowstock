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

## Gói Pro — mã "tín hiệu xu hướng mạnh" (trả phí)
Mỗi mã được chấm 5 tiêu chí (`strongSignal` trong `js/analysis.js`): xu hướng mạnh · nhận định tích cực · dòng tiền mạnh · khối ngoại + tự doanh cùng mua mạnh · tâm lý đám đông tốt. Đạt **5/5 = ⭐ Tín hiệu mạnh**, **4/5 = ✓ Tín hiệu tốt** (ngưỡng `proTiers` trong `js/config.js`). Cả hai nhóm bị **ẩn** với người chưa trả phí: bảng chỉ hiện dòng 🔒: ẩn tên mã, giá, %1D, %5D, NN 5D, TD 5D; các cột còn lại vẫn hiển thị, kèm nhãn nhóm, mã biến mất khỏi tìm kiếm/top khối ngoại/tự doanh, trang chi tiết bị khóa. Người đã mở khóa xem đầy đủ + bảng Radar ở trang ⭐ Pro. Các mã còn lại xem miễn phí.
- **Quyết định sản phẩm (đã chốt):** web **chỉ phân tích xu hướng, không phải khuyến nghị đầu tư**. Tính năng "khuyến nghị" (vùng mua, cắt lỗ, Target) đã bị gỡ vì rủi ro pháp lý. Cảnh báo hiển thị ở thanh dưới header, thẻ Radar, trang Pro và footer "Tuyên bố miễn trừ". Giữ ngôn ngữ trung tính, không dùng "nên mua / mục tiêu giá".
- **Cấu hình:** `js/config.js` (gói/giá ví dụ, thông tin nhận tiền — để trống thì trang hiện hướng dẫn liên hệ, `proTiers`).
- **Tạo mã kích hoạt:** `python3 scripts/make_license.py "Pro 1 tháng" 30 5` → in 5 mã gửi khách (bí mật, không commit) + dòng băm SHA-256 dán vào `licenses` trong `js/config.js`. Mã demo `ARROW-DEMO-2026` (3 ngày) — **xóa dòng demo trước khi bán**.
- **Giới hạn:** web tĩnh nên khóa chỉ là rào cản mềm (mở DevTools vẫn đọc được dữ liệu). Khóa thật cần backend (tính/chỉ trả dữ liệu mã Pro từ server sau khi thanh toán).
- **Pháp lý:** dù đã bỏ khuyến nghị, danh sách "mã mạnh" bán thu phí vẫn có thể bị xem là chọn mã — hỏi luật sư/UBCKNN trước khi bán thật. Trang không thu thông tin thẻ.
