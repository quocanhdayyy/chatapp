# Chat 1–1: gửi và lưu tin nhắn văn bản

Mốc này hoàn thành gửi văn bản bằng API giả trong trình duyệt. Danh sách cuộc trò chuyện vẫn dùng dữ liệu mẫu: Quốc Anh (`1`) và Mai (`2`) trong `chat-1`.

## Dùng thử

1. Chạy `npm run web`, đăng nhập rồi chọn **Tin nhắn** trên Header.
2. Chọn Mai, nhập nội dung và bấm **Gửi** hoặc Enter. Shift + Enter để xuống dòng.
3. Tin được lưu thành công sẽ hiện bên phải, nền xanh lá. Ô nhập được xóa sau khi lưu thành công.
4. Tải lại trang, mở lại cuộc trò chuyện với Mai: tin vừa gửi vẫn còn.
5. Mỗi cuộc trò chuyện giữ bản nháp riêng trong thời gian màn hình còn mở. Bản nháp chưa gửi không được lưu sau khi tải lại trang.

Nút Gửi và ô nhập khóa tạm khi đang gửi; bấm liên tục không tạo thêm yêu cầu. Khi gửi lỗi, nội dung còn nguyên và có thông báo để thử lại. Enter trong lúc đang gõ bằng bộ gõ IME không gửi sớm.

## Luồng để đọc code

`ChatComposer` → `ChatScreen.handleSend` → `api/chat.sendMessage` → `ApiClient` → `mockTransport` → `handleChatRequest` → `saveChatMessages` → trả `Message` → cập nhật `threads` và xóa bản nháp đã gửi.

- `src/components/ChatComposer.tsx`: ô nhập, nút Gửi, giới hạn ký tự và phím Enter.
- `src/screens/ChatScreen.tsx`: giữ lịch sử/bản nháp theo mã cuộc trò chuyện, khóa thao tác gửi và xử lý kết quả/lỗi.
- `src/api/chat.ts`: GET danh sách/lịch sử và POST gửi tin.
- `src/dev/chatHandlers.ts`: kiểm tra người tham gia, nội dung; tạo mã/thời gian/người gửi và lưu trước khi trả kết quả.
- `src/storage/chat.ts`: đọc/ghi danh sách tin nhắn bằng localStorage.
- `src/core/chat.ts`: giới hạn dùng chung 2.000 ký tự.
- `src/utils/chatMessages.ts`: gộp tin theo ID và đúng cuộc trò chuyện, giữ tin vừa gửi nếu lịch sử cũ trả về muộn.

## API giả

| Phương thức | Đường dẫn | Kết quả |
|---|---|---|
| GET | `/conversations` | Những cuộc trò chuyện người đang đăng nhập tham gia |
| GET | `/conversations/:id/messages` | Tin của cuộc trò chuyện, từ cũ đến mới |
| POST | `/conversations/:id/messages` | Nhận `{ content: string }`, trả một `Message` mới |

Người gửi lấy từ token đã kiểm tra, không lấy `senderId` trong body. Nội dung được trim, không được rỗng và tối đa 2.000 ký tự. Người ngoài cuộc trò chuyện hoặc mã không tồn tại đều nhận 404. Các phương thức chưa hỗ trợ nhận 405.

## Lưu dữ liệu và lỗi

- Khóa localStorage: `chatapp-chat-messages`, chứa mảng `Message` của dữ liệu demo.
- Chưa có khóa thì đọc hai tin mẫu; lần gửi đầu lưu cả tin mẫu và tin mới. Mảng rỗng đã lưu được giữ nguyên.
- Lỗi đọc, JSON hỏng, bản ghi sai kiểu hoặc trùng ID được báo lỗi; không tự xóa hay thay dữ liệu cũ bằng tin mẫu.
- Không ghi được thì API báo lỗi, không thêm bong bóng thành công. Giao diện giữ bản nháp.
- Phản hồi gửi được gắn với đúng mã cuộc trò chuyện khi người dùng chuyển sang người khác. Rời màn hình không cập nhật state của màn hình đã đóng.
- Tin nhắn đã gửi lưu trong trình duyệt/origin hiện tại. Mốc này chưa kết nối backend, WebSocket/STOMP hoặc tự sinh phản hồi từ Mai.

## Kiểm tra

```bash
npm run typecheck
npm run lint
npm run check:core
npm run check:chat
npm run build:web
```

`check:chat` dùng storage trong RAM để kiểm tra quyền, validation, lưu/reload, lỗi mạng/storage, gửi đồng thời, token hết hạn và gộp lịch sử. Không thay đổi dữ liệu đang lưu trong Safari.
