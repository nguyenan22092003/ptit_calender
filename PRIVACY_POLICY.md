# Chính sách quyền riêng tư – PTIT Calendar

Cập nhật: 19/10/2026. Áp dụng cho mã nguồn phiên bản 1.5.0 trong kho này.

## Dữ liệu và mục đích xử lý

PTIT Calendar chuyển thời khóa biểu từ cổng PTIT sang Google Calendar hoặc tệp ICS theo thao tác của người dùng.

Tiện ích nhận token phiên PTIT từ dữ liệu phiên của trang qldttx.pttc1.edu.vn hoặc tiêu đề xác thực của yêu cầu đến API thời khóa biểu. Token và mã idpc dùng để gọi API thời khóa biểu. Tiện ích không đọc hoặc lưu mật khẩu đăng nhập; người dùng đăng nhập trực tiếp trên cổng PTIT.

Dữ liệu lịch gồm học kỳ, môn học, mã môn, lớp, nhóm, giảng viên, ngày giờ, tiết học, phòng học và đường dẫn học trực tuyến nếu có trong phản hồi. Dữ liệu này dùng để hiển thị, chuyển đổi và tạo sự kiện. Đường dẫn học hoặc mật khẩu phòng có trong dữ liệu nguồn có thể được giữ trong mô tả sự kiện.

Khi người dùng kết nối Google, tiện ích dùng chrome.identity để nhận token OAuth phục vụ Google Calendar API. Tiện ích không yêu cầu người dùng nhập mật khẩu Google vào giao diện của mình.

## Lưu trữ và thời hạn

Token PTIT, idpc, phản hồi lịch gốc và học kỳ của phản hồi được lưu trong chrome.storage.session của tiện ích. Thông tin theo dõi tab đăng nhập cũng được lưu tại đây; mốc 30 phút chỉ áp dụng việc tự đóng tab và quay về tiện ích, không phải thời hạn token. Dữ liệu phiên không được lưu bền qua việc khởi động lại trình duyệt.

Học kỳ đã chọn được lưu trong chrome.storage.local và tồn tại cho tới khi dữ liệu tiện ích bị xóa hoặc tiện ích bị gỡ. Token Google được giữ trong bộ nhớ trang và cơ chế bộ nhớ đệm xác thực của Chrome. Tiện ích không tự lưu token Google vào chrome.storage.local.

Sự kiện đã nhập được lưu trong tài khoản Google Calendar cho đến khi bị xóa hoặc thay lịch. Tệp ICS đã tải được lưu trên thiết bị theo lựa chọn của người dùng.

## Truyền và chia sẻ dữ liệu

Theo mã nguồn phiên bản này, các yêu cầu mạng của chức năng tiện ích được gửi đến cổng PTIT để lấy lịch và Google Calendar API để quản lý lịch. Không có máy chủ trung gian của nhà phát triển, công cụ phân tích, quảng cáo hoặc dịch vụ AI trong mã nguồn này. Không bán dữ liệu người dùng.

Các yêu cầu mạng dùng HTTPS. Dữ liệu trên PTIT và Google chịu chính sách của các đơn vị tương ứng. Quyền xem lịch và nội dung sự kiện phụ thuộc cài đặt chia sẻ Google Calendar của người dùng.

## Quyền Google Calendar và thay lịch

Tiện ích yêu cầu calendar.app.created để tạo và quản lý lịch do ứng dụng tạo, cùng calendar.calendarlist.readonly để đọc danh sách lịch và nhận diện lịch đích.

Mỗi lần nhập, tiện ích tạo lịch phụ mới tên **ptit calendar**, nhập các sự kiện được chọn, sau đó mới xóa lịch cũ thỏa tất cả điều kiện: cùng tên, có dấu quản lý đúng trong mô tả, người dùng có quyền chủ sở hữu và không phải lịch chính. Lịch chỉ trùng tên nhưng không có dấu quản lý không bị xóa. Các sự kiện thêm thủ công trong lịch do tiện ích quản lý sẽ mất theo khi lịch đó bị thay thế.

Nếu nhập sự kiện lỗi, tiện ích thử xóa lịch mới nhập dở và giữ lịch cũ; nếu việc dọn dẹp lỗi, giao diện báo lỗi. Nếu không có buổi học, lịch cũ được giữ nguyên.

Sự kiện nhập qua API có thông báo và email nhắc trước 5 phút. Email do Google Calendar xử lý cho tài khoản thực hiện nhập, tùy khả năng hỗ trợ và cấu hình dịch vụ; tiện ích không truy cập hộp thư hoặc gửi thư qua Gmail API.

Dữ liệu nhận qua Google API chỉ được sử dụng cho chức năng lịch học. Việc sử dụng và chuyển dữ liệu Google tuân thủ [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), bao gồm yêu cầu Limited Use. Không sử dụng dữ liệu Google cho quảng cáo cá nhân hóa hoặc bán dữ liệu.

## Xóa dữ liệu và thu hồi quyền

- Nút **Xóa dữ liệu phiên** xóa chrome.storage.session, dữ liệu lịch đang hiển thị và bộ nhớ đệm xác thực Google của tiện ích; không xóa học kỳ lưu cục bộ, phiên đăng nhập của trang PTIT hoặc lịch trên Google.
- Đóng các tab PTIT để ngừng việc tiện ích nhận lại token từ các tab đang mở.
- Nút **Ngắt kết nối** xóa bộ nhớ đệm Google của tiện ích, không tương đương thu hồi quyền OAuth.
- Thu hồi quyền tại [Kết nối tài khoản Google](https://myaccount.google.com/connections).
- Xóa lịch hoặc sự kiện trực tiếp trong Google Calendar. Xóa tệp ICS đã tải trên thiết bị nếu không còn cần.
- Gỡ tiện ích để xóa dữ liệu cục bộ của tiện ích. Lịch Google và các tệp đã tải vẫn cần được xóa riêng.

## Liên hệ và thay đổi

Liên hệ nhà phát triển qua [GitHub Issues](https://github.com/nguyenan22092003/ptit_calender/issues). Không đăng token, mật khẩu, lịch cá nhân hoặc dữ liệu nhạy cảm trong issue công khai.

Thay đổi chính sách được công bố tại tệp này cùng ngày cập nhật. Nhà phát triển cần cập nhật chính sách khi cách xử lý dữ liệu của tiện ích thay đổi.
