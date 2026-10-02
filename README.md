# ArrowStock — Phân tích xu hướng VN30

Web tĩnh (HTML/CSS/JS, không cần build). Chạy: `python3 -m http.server 8000` rồi mở http://localhost:8000

## Tính năng
- Bảng 30 mã VN30: giá, %1D/5D/1T, pha xu hướng, trạng thái dòng tiền (Bùng nổ → Cạn kiệt), điểm 4 trụ cột, nhận định.
- Trang chi tiết mỗi mã: nến + MA20/50/100/200, khối lượng (đánh dấu phiên bùng nổ), dòng tiền lớn, xu hướng tiếp theo + hỗ trợ/kháng cự.
- 4 trụ cột: Cơ bản (20%), Kỹ thuật (35%), Dòng tiền lớn (25%), Tâm lý đám đông (20%) → Tích cực mạnh / Tích cực / Trung lập / Tiêu cực / Tiêu cực mạnh.

## Dữ liệu
Mặc định dùng dữ liệu **mô phỏng** (js/sim.js) và chỉ số cơ bản **minh họa** (js/data.js). Để dùng dữ liệu thật:
`pip install vnstock && python3 scripts/fetch_data.py` → tạo `data/market.json`, web tự nhận. Cần bổ sung khối ngoại/tự doanh và cập nhật chỉ số cơ bản từ BCTC; danh mục VN30 cần đối chiếu kỳ rà soát mới nhất.

Chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
