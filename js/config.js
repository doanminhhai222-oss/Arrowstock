/* Cấu hình gói Pro. SỬA các giá trị này theo thực tế kinh doanh của bạn. */
const CONFIG={
  /* Phân hạng theo số tiêu chí đạt (trên 5): đạt `strong` = Tín hiệu mạnh, đạt `good` = Tín hiệu tốt. Cả hai hạng đều bị ẩn với người chưa trả phí. */
  proTiers:{strong:5,good:4},
  plans:[
    {id:'month',name:'Pro 1 tháng',price:'199.000đ',per:'/tháng',days:30},
    {id:'year',name:'Pro 1 năm',price:'1.490.000đ',per:'/năm',days:365,badge:'Tiết kiệm ~38%'}
  ],
  /* Thông tin nhận thanh toán — để trống thì trang hiện hướng dẫn liên hệ. Trang KHÔNG thu thông tin thẻ. */
  payment:{bank:'',account:'',holder:'',note:'ARROW + email của bạn',zalo:'',email:''},
  /* Danh sách mã kích hoạt hợp lệ — chỉ lưu SHA-256 của mã. Tạo bằng: python3 scripts/make_license.py */
  licenses:[
    {h:'4443c5da443d82dd002fc553b2d838eba26f8f501ffffb572bf192bcd0748f20',plan:'Dùng thử 3 ngày (DEMO — xóa dòng này trước khi bán)',days:3}
  ]
};
