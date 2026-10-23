# Thông báo

Module frontend dùng API giả, mở tại `/notifications` sau khi đăng nhập. Mở bằng chuông trên Header hoặc mục Thông báo bên trái.

## Chức năng

- Danh sách mới nhất trước; tab Tất cả / Chưa đọc.
- Đánh dấu một thông báo hoặc đọc tất cả. Mở thông báo cũng đánh dấu đã đọc trước khi chuyển trang.
- Chuông và menu dùng chung số chưa đọc từ NotificationsProvider.
- Lời mời kết bạn mở đúng tab Lời mời nhận. Thông báo kết bạn mở danh sách bạn bè; chào mừng mở hồ sơ.
- Lưu trạng thái đã đọc sau reload, đồng bộ khi tab khác cùng origin thay đổi dữ liệu.
- Loading, rỗng, lỗi và thử lại. Nếu lưu thất bại thì không báo đã đọc hoặc chuyển trang.

## Gắn với bạn bè

Gửi lời mời tạo thông báo cho **người nhận**. Không tự gửi một thông báo lời mời cho chính người thao tác. Khi chấp nhận: người gửi nhận thông báo đã được chấp nhận; người nhận có thông báo hai người đã trở thành bạn bè. Lời mời đã chấp nhận/từ chối/hủy được đánh dấu đã xử lý trong lịch sử. Người dùng demo không tự động chấp nhận lời mời mình gửi.

Dữ liệu mẫu ban đầu có thông báo chào mừng và lời mời còn đang chờ trong dữ liệu bạn bè hiện tại. Không khởi tạo lại lời mời đã bị từ chối/hủy trước đó.

## Luồng

`NotificationRow` → `NotificationsProvider.markRead` → `api/notifications.ts` → `mockTransport` kiểm tra token → `notificationsHandlers` lưu → Provider cập nhật danh sách và số chưa đọc → route mở màn hình liên quan.

File chính:

- `src/screens/NotificationsScreen.tsx`: tab và thao tác.
- `src/components/NotificationRow.tsx`, `NotificationsLink.tsx`: từng thông báo, chuông và mục menu.
- `src/providers/NotificationsProvider.tsx`: dữ liệu chung của module, chống kết quả tải cũ ghi đè.
- `src/api/notifications.ts`: GET /notifications, PATCH /notifications/:id/read, POST /notifications/read-all.
- `src/dev/notificationsHandlers.ts`: lọc theo tài khoản trong token, không cho đọc/sửa thông báo người khác.
- `src/dev/notificationData.ts`: dữ liệu mẫu và thông báo phát sinh từ quan hệ bạn bè.
- `src/storage/social.ts`: lưu quan hệ và thông báo trong cùng một lần ghi, phát sự kiện để cập nhật số đếm.

Để giữ dữ liệu bạn bè cũ, tiếp tục dùng khóa `chatapp-friend-relations`. Dữ liệu mảng cũ vẫn đọc được; lần lưu tiếp theo chuyển thành `{ version: 2, relations, notifications }`. Không cần xóa dữ liệu trình duyệt.

Đây là thông báo trong app. Chưa gồm push trình duyệt, FCM, thông báo like/comment hay backend.
