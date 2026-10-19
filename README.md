## Cấu hình bản mã nguồn trên GitHub

1. Sao chép `config.example.json` thành `config.local.json`.
2. Điền Google OAuth Client ID của bạn vào `googleOAuthClientId`.
3. Chạy `node configure.mjs` để tạo `manifest.json`.
4. Vào `chrome://extensions` → Developer mode → Load unpacked → chọn thư mục này.

`config.local.json` và `manifest.json` được loại khỏi Git. Chạy lại lệnh cấu hình sau khi sửa `manifest.template.json`. Client ID được đưa vào bản tiện ích để Chrome sử dụng; nó không phải client secret. Không thêm mật khẩu, access token hay client secret vào repo. Tiện ích không cần API key.

Chính sách quyền riêng tư: [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

---

# ptit calender 1.5.0 — Không cần AI

Chuyển trực tiếp JSON thời khóa biểu PTIT sang sự kiện Google Calendar. Không cần model, API key hay credit AI. Dữ liệu được xử lý trong Chrome.

## Cập nhật / cài đặt
1. Giải nén vào thư mục extension cũ. Nếu đã cấu hình OAuth, giữ lại client_id thật trong manifest.json.
2. Mở chrome://extensions, bật Developer mode, bấm Reload; nếu cài mới chọn Load unpacked vào thư mục ptit-calender.
3. Tải lại tab PTIT đã mở và đóng/mở lại tab extension.

## Cách dùng — một nút
1. Bấm **Đăng nhập trên cổng PTIT**, đăng nhập trực tiếp tại trang trường. Khi nhận token, tool tự đóng tab đăng nhập và đưa bạn về extension. Chỉ tab được mở bằng nút này mới tự đóng; các tab PTIT khác được giữ nguyên. Nếu đóng thủ công hoặc chờ quá 30 phút, bấm đăng nhập lại.
2. Chọn học kỳ rồi bấm **Lấy lịch & nhập Google**.
Tool mở kết nối Google khi cần, tự lấy JSON trực tiếp từ API PTIT, tự đọc total_pages để lấy đủ trang, chuyển ngày/giờ và nhập toàn bộ các buổi vào lịch đích. Không tải, chọn hay nhập file JSON. Không cần bấm chuyển dữ liệu hay bấm nhập lần nữa.

Google OAuth Client ID vẫn cần cấu hình một lần; đây là yêu cầu của Google, không thể bỏ bằng cách gộp nút. Giữ tab mở cho đến khi hiện kết quả.

Nếu muốn kiểm tra và chọn từng buổi trước khi nhập: Tùy chọn nâng cao → Chỉ lấy lịch để xem → bỏ chọn buổi → Nhập các buổi đã chọn. File .ics chỉ là phương án dự phòng, không phải bước bắt buộc.

## Hai cách nhập Google Calendar
### Kết nối trực tiếp — thay lịch riêng mỗi lần nhập
Lịch đích cố định tên **ptit calendar**. Mỗi lần nhập:
1. Lấy dữ liệu PTIT, kiểm tra và chuyển đổi đầy đủ.
2. Tạo lịch phụ mới tên ptit calendar, múi giờ Việt Nam; nhập các buổi đã chọn.
3. Chỉ khi toàn bộ sự kiện đã nhập thành công, xóa các lịch cũ cùng tên do tool quản lý. Nếu lỗi nhập, hủy lịch mới nhập dở và giữ lịch cũ. Nếu xóa lịch cũ lỗi, hiển thị lỗi; lần nhập sau thử dọn lại.

Nhận diện lịch cũ bằng tên + dấu quản lý trong description + quyền owner + không phải primary. Không xóa lịch chỉ trùng tên nhưng không có dấu quản lý. Không xóa sự kiện từng nhập vào lịch chính ở các bản trước. Việc sửa/xóa mô tả lịch trên Google có thể khiến tool không nhận diện được lịch đó. Các sự kiện thêm thủ công trong lịch do tool quản lý cũng bị xóa khi thay lịch. Dữ liệu rỗng không xóa lịch cũ.

Phiên bản này đổi scope thành calendar.app.created và calendar.calendarlist.readonly. Sau Reload, bấm Ngắt kết nối rồi Kết nối Google, chấp nhận các quyền mới. Nếu Google Cloud yêu cầu khai báo Data Access, thêm hai scope đó trong Google Auth Platform. Client ID đã cấu hình được giữ nguyên.

### Không cấu hình OAuth
Bấm Tải lịch .ics. Mở Google Calendar trên máy tính → Cài đặt → Nhập và xuất → chọn file .ics và lịch đích → Nhập. Cách này không cần API key hoặc OAuth Client ID trong extension. Việc xử lý nhập trùng file do Google Calendar quyết định; nên nhập một lần hoặc dùng lịch riêng.

## Quy tắc chuyển đổi
- Schema: data.ds_tiet_trong_ngay và data.ds_tuan_tkb[].ds_thoi_khoa_bieu[]. Hỗ trợ {pages:[phản_hồi_1,phản_hồi_2,...]}.
- Ngày từ ngay_hoc; không suy ngày theo số tuần.
- Bắt đầu: gio_bat_dau của tiet_bat_dau. Kết thúc: gio_ket_thuc của tiết tiet_bat_dau + so_tiet - 1.
- Dùng múi giờ Việt Nam +07:00. Không cộng số tiết bằng thời lượng giả định.
- Bỏ is_nghi_day=true; giữ buổi dạy bù. Không bỏ buổi chỉ đang đề nghị nghỉ (is_dang_duyet_nghi_day).
- Thiếu ngày/giờ, sai ngày hoặc học kỳ không khớp: dừng và báo lỗi, không tự đoán hay nhập phần còn lại.
- Gộp bản ghi có cùng môn/ngày giờ/phòng. Không gộp cùng môn ở những ngày khác nhau dù id_tkb giống nhau.
- Giữ phòng trong địa điểm. Ghi mã môn, lớp, nhóm, giảng viên, tiết và link học online trong mô tả.
- Không loại buổi quá khứ: tự bỏ chọn trên bản xem trước nếu chỉ muốn nhập lịch tương lai.

## Google: cấu hình một lần cho người phát triển
Không thể cung cấp kết nối Google hoạt động sẵn nếu chưa có OAuth Client ID thuộc dự án của bạn.
1. Tạo dự án tại https://console.cloud.google.com/ và bật **Google Calendar API**.
2. Cấu hình **Google Auth Platform / OAuth consent screen**, thêm tài khoản của bạn vào Test users nếu ứng dụng đang Testing. Khai báo scope `https://www.googleapis.com/auth/calendar.app.created` và `https://www.googleapis.com/auth/calendar.calendarlist.readonly`.
3. Vào Clients / Credentials, tạo **OAuth client ID**, loại **Chrome Extension** (một số giao diện ghi Chrome app). Dán extension ID từ chrome://extensions.
4. Điền Client ID vào config.local.json rồi chạy node configure.mjs. Không dùng client secret.
5. Reload extension, bấm biểu tượng mở lại tab rồi **Kết nối Google**.

Nút kết nối gọi chrome.identity.getAuthToken({interactive:true}). Google dùng tài khoản/phiên Chrome có sẵn và hiện màn hình cấp quyền khi cần. Nếu chưa đăng nhập, Google vẫn có thể yêu cầu đăng nhập; extension không thể bỏ qua bước đó. Không nhập mật khẩu Google vào extension. Tài khoản đã cấp quyền thường không phải nhập lại mật khẩu.

Khi chuyển thư mục, thiết bị hoặc phát hành, ID extension có thể thay đổi; phải đăng ký OAuth theo ID tương ứng hoặc cấu hình khóa công khai ổn định trước khi phân phối. Phát hành công khai có thể cần Google xét duyệt OAuth.


## Bảo mật và kiểm tra
Extension không có ô tài khoản/mật khẩu, không điền form hay nhận mật khẩu. Nút đăng nhập chỉ mở https://qldttx.pttc1.edu.vn/#/home. Bạn thực hiện toàn bộ đăng nhập và CAPTCHA trên trang chính thức.

Token và JSON gốc dùng storage.session; cấu hình không nhạy cảm dùng storage.local. Nút Xóa dữ liệu phiên xóa dữ liệu tạm và cache Google của extension, không xóa phiên đăng nhập trên trang PTIT. Đóng trang PTIT để ngừng nhận token mới. Nút Ngắt kết nối không tương đương thu hồi quyền OAuth; thu hồi trong tài khoản Google nếu cần.

Không gọi AI hoặc gửi lịch đến máy chủ AI. Dữ liệu chỉ được gửi đến PTIT khi lấy lịch và đến Google khi người dùng nhập trực tiếp. Link học online/mật khẩu phòng nếu có trong dữ liệu gốc sẽ được giữ trong lịch đích; chọn lịch phù hợp.

Kiểm thử: node core.test.mjs và node ptit.test.mjs. Đã chạy chuyển đổi dữ liệu thực được cung cấp: 45 buổi, 9 môn, từ 17/08/2026 đến 03/12/2026. File dữ liệu cá nhân không được đóng vào ZIP. Chưa kiểm thử đầu cuối bằng tài khoản PTIT và Google thật; môi trường hiện tại thiếu Chromium nên chưa xác nhận giao diện bằng trình duyệt.

Bản 1.4.2 sửa lỗi “Tab mở đăng nhập không hợp lệ” khi Chrome không trả URL từ tabs.get do không có quyền tabs. Nguồn yêu cầu được xác nhận bằng sender.url của trang extension; không cần thêm quyền đọc toàn bộ tab.

## Nhắc lịch trước 5 phút — bản 1.5
Mỗi sự kiện nhập trực tiếp qua Google API có reminders.useDefault=false và hai nhắc: popup 5 phút, email 5 phút. Email do Google Calendar gửi tới tài khoản Google thực hiện import, không phải địa chỉ email tùy nhập. Ví dụ kết nối bằng nvan.work.it@gmail.com thì nhắc áp dụng cho tài khoản đó. Không gửi email ngay lúc import. Không cần để extension mở để Google xử lý nhắc đã lưu. Cấp quyền thông báo Google Calendar trên trình duyệt/điện thoại để thấy thông báo. Các buổi đã qua thời điểm nhắc không được hứa gửi bù.
Sau cập nhật cần bấm Lấy lịch & nhập Google lại để tạo lại lịch có nhắc. Không cần đổi OAuth scope. File ICS dự phòng chưa bao gồm cấu hình email reminder; dùng import trực tiếp cho chức năng này.
