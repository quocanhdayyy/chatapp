# Tin nhắn chưa đọc / đã đọc

Mỗi người có một mốc đọc riêng: `{ userId, conversationId, messageId }`. Mock lưu mốc tại `chatapp-chat-read-cursors`, tách khỏi tin nhắn cũ. Không có mốc thì các tin do người kia gửi được tính là chưa đọc; tin tự gửi không được tính.

## Luồng

1. `GET /conversations/summary` lấy tin cuối, mốc đã đọc và số chưa đọc của từng cuộc trò chuyện mà người đăng nhập tham gia.
2. `ChatInboxProvider` dùng chung dữ liệu cho Header và danh sách chat; cập nhật khi tin/mốc đọc thay đổi, khi trở lại tab và khi tab khác cập nhật storage.
3. Khi cuộc trò chuyện đang mở, route có focus, tab đang hiển thị và tin đã tải thành công, `ChatScreen` gọi `POST /conversations/:id/read` với `{ messageId }` của tin cuối đã hiển thị.
4. Handler chỉ cập nhật mốc của tài khoản trong token. Mốc không lùi và chỉ đến đúng ID gửi lên; tin mới tới sau mốc vẫn chưa đọc, kể cả cùng thời gian `createdAt`.
5. Sau lưu thành công, số trên icon và dòng chat được tải lại. Lỗi không xóa badge giả; có thông báo và nút Thử lại trong trang Tin nhắn. Icon hiện `!` khi không cập nhật được số.

Mock dùng thứ tự lưu/nhận trong mảng tin làm thứ tự mốc. Không dùng `Date.now()` làm mốc nên một tin tới trong lúc xác nhận đọc không bị tính nhầm là đã đọc. Backend thật cần cung cấp thứ tự tin ổn định tương đương.

## Dùng thử

- Chạy `npm run web`, đăng nhập rồi mở Tin nhắn. Với dữ liệu mới sẽ có một tin mẫu của Mai chưa đọc.
- Chưa chọn cuộc trò chuyện, bấm **Mai gửi tin thử**: dòng Mai in đậm, số chưa đọc tăng ở dòng và icon.
- Chọn Mai, chờ tải xong: số giảm về 0. Tin tới khi đang xem Mai sẽ tự được đánh dấu đã đọc.
- Tải lại trang: mốc đã đọc còn nguyên.
- Mở hai tab cùng địa chỉ/cổng: ở tab A chọn Mai rồi chuyển sang tab B. Tại B chưa chọn cuộc trò chuyện và tạo tin thử. Tab A đang ẩn không tự đánh dấu đọc; quay lại A thì đọc và cả hai tab cập nhật số.
- Rời trang chat về Trang chủ: tin tới vẫn tăng badge, không tự đọc bởi ChatScreen còn trong stack.

Đây là trạng thái đã đọc của chính bạn. Chưa hiển thị “Mai đã xem” dưới bong bóng; chưa có WebSocket/STOMP hay đồng bộ giữa hai máy.

## Kiểm tra

`npm run check:chat-unread` kiểm tra quyền truy cập, tách mốc hai người, giữ tin mới trong lúc đọc, mốc không lùi/trùng, tải lại, dữ liệu hỏng/lỗi lưu/mạng và chống kết quả API cũ ghi đè badge mới. Script chỉ dùng storage trong RAM.

Chạy thêm `npm run typecheck`, `npm run lint`, `npm run check:core`, `npm run check:chat`, `npm run check:chat-events` và `npm run build:web`.
