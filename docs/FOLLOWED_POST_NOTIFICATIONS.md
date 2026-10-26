# Thông báo bài mới từ người đang theo dõi

Luồng: đăng/chia sẻ bài → chụp danh sách người đang theo dõi → lưu bài và thông báo bằng một lần ghi → NotificationsProvider tải thông báo → chuông tăng số chưa đọc → mở `/posts/:id`.

- Chỉ người theo dõi tác giả tại thời điểm đăng nhận thông báo; không tự gửi cho tác giả.
- Chấp nhận kết bạn đã tự theo dõi hai chiều nên áp dụng cùng quy tắc.
- Bỏ theo dõi dừng nhận bài sau đó; thông báo cũ vẫn ở lịch sử. Theo dõi mới không gửi lại bài cũ.
- Chia sẻ tạo thông báo từ người chia sẻ cho người theo dõi họ. Sửa bài/Thích/Tim/bình luận không gửi lại thông báo bài mới.
- Một ID thông báo cho mỗi bài/người nhận, không lặp khi refresh hoặc reload.
- Bấm thông báo đánh dấu đã đọc và mở đúng bài, kèm bình luận. Bài đã xóa có màn hình thông báo và nút về bảng tin.
- Bài và các thông báo phát sinh lưu chung trong `chatapp-posts`: `{ version: 2, posts, notifications }`. Dữ liệu mảng cũ vẫn đọc được, không gửi thông báo hồi tố.
- Phần social giữ trạng thái đọc; khi ghép thông báo thì bản đã đọc luôn được ưu tiên. Lỗi lưu bài không tạo thông báo mồ côi.
- Chuông cập nhật qua sự kiện trong cùng tab và storage event giữa các tab.

Trong `expo start --web`, mục Thông báo có nút **Thử thông báo bài mới** để mô phỏng người đang theo dõi đăng bài. Nút chỉ có trong chế độ phát triển; không tự sinh bài. Bản build production không hiển thị nút này.

Đây là thông báo bên trong ứng dụng với dữ liệu giả trên cùng trình duyệt, chưa phải push hay trao đổi giữa các máy.
