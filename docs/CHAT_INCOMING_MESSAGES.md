# Nhận tin nhắn mới bằng mô phỏng

Mốc này thêm luồng nhận tin tự động trong frontend. Lớp sự kiện giả đọc thay đổi từ localStorage, không mở kết nối WebSocket hoặc STOMP tới server.

## Dùng thử

1. Chạy `npm run web`, đăng nhập rồi mở **Tin nhắn**.
2. Dưới danh sách có nút **Mai gửi tin thử**. Nút này chỉ hiện khi chạy development.
3. Chọn Mai, nhập một bản nháp nhưng chưa gửi. Bấm nút thử: tin mới của Mai hiện bên trái, bản nháp vẫn còn và dòng xem trước cập nhật.
4. Tải lại rồi mở Mai: tin thử đã được lưu cùng lịch sử.
5. Có thể mở thêm tab cùng địa chỉ/cổng, chọn Mai ở cả hai tab và gửi/nhận tin thử: tab kia cập nhật qua sự kiện storage.

Nút thử cũng dùng được trước khi chọn một dòng chat; lúc đó nó dùng cuộc trò chuyện đầu tiên. Mỗi lần bấm chỉ tạo một tin. App không tự trả lời mỗi khi bạn gửi.

## Luồng

`Nút thử` → `simulateIncomingMessage` → `POST /dev/chat/:id/incoming` → kiểm tra tài khoản/người tham gia → lưu tin của người kia → thông báo storage đã đổi → `mockChatTransport` phát tin mới → `ChatScreen` gộp vào đúng cuộc trò chuyện.

Phản hồi từ nút thử không được thêm trực tiếp vào giao diện. Giao diện nhận tin qua adapter để kiểm tra đúng luồng sự kiện.

Gửi tin bình thường vẫn dùng `POST /conversations/:id/messages`. Người gửi lấy từ token; API này không cho tự chọn `senderId`. Sự kiện lưu và phản hồi gửi được gộp theo ID nên chỉ hiện một bong bóng.

## Các file chính

- `src/core/chatTransport.ts`: giao diện đăng ký nhận tin và chọn adapter hiện tại.
- `src/dev/mockChatTransport.ts`: nhận thay đổi cùng tab/tab khác, lọc cuộc trò chuyện theo người tham gia, bỏ ID đã nhận và bắt kịp khi quay lại tab.
- `src/storage/chat.ts`: chỉ thông báo sau khi lưu thành công; lỗi listener không làm một lần lưu thành công bị báo lỗi.
- `src/dev/chatActivity.ts`: lệnh tạo tin thử, chỉ dùng trong development.
- `src/dev/chatHandlers.ts`: cùng dùng kiểm tra nội dung/lưu tin cho gửi thường và mô phỏng. Route mô phỏng không đổi phiên đăng nhập và bị chặn trong bản export.
- `src/screens/ChatScreen.tsx`: đăng ký nhận, giữ bản nháp, cập nhật tin cuối và hủy đăng ký khi rời màn hình.

Tin đã có khi đăng ký được lấy bằng REST API, không phát lại thành sự kiện mới. Lỗi đồng bộ hiện thông báo và nút Thử lại; thao tác thử lại cũng tải lại lịch sử đang mở.

## Phạm vi

Đồng bộ giữa các tab cùng origin của một trình duyệt. Không truyền tin giữa hai máy, không tự gửi thông báo push và chưa có trạng thái đã đọc/chưa đọc.

Khi có backend hỗ trợ WebSocket/STOMP, thay adapter tại `src/core/chatTransport.ts` bằng kết nối được server xác thực và cấp quyền nhận tin. Phần hiển thị vẫn nhận `Message` rồi gộp theo ID.

## Kiểm tra

```bash
npm run typecheck
npm run lint
npm run check:core
npm run check:chat
npm run check:chat-events
npm run build:web
```

Các script kiểm tra dùng storage/sự kiện trong RAM, không đọc hoặc sửa dữ liệu Safari. Chúng kiểm tra nhận một lần, quyền người tham gia, cập nhật tab khác, bắt kịp khi quay lại, lỗi lưu/mạng, hủy listener và chặn route thử ngoài development.
