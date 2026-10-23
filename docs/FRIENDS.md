# Mục bạn bè

Frontend dùng API giả và dữ liệu mẫu. Không có backend hay người dùng thật trong module này.

## Chạy thử

Mở web, đăng nhập rồi chọn **Bạn bè** ở menu bên trái hoặc thanh trên cùng. Đường dẫn là `/friends`, nằm trong nhóm route yêu cầu đăng nhập.

- Tất cả bạn bè: ban đầu có Mai; hủy kết bạn có bước xác nhận.
- Lời mời nhận: Dũng và Sơn; có thể chấp nhận hoặc từ chối.
- Đã gửi: Nam; có thể hủy lời mời.
- Tìm bạn: danh bạ mẫu, tìm tên/email không phân biệt dấu; mỗi người có nút phù hợp với quan hệ hiện tại.

Chấp nhận lời mời chuyển người đó từ Lời mời nhận sang Tất cả bạn bè. Lời mời do mình gửi không tự động được chấp nhận. Danh sách và số lượng cập nhật từ kết quả API sau khi lưu thành công.

## Luồng code

1. `src/app/(main)/friends.tsx` lấy người đang đăng nhập và mở FriendsScreen.
2. `src/screens/FriendsScreen.tsx` gọi API, giữ danh sách, tab, tìm kiếm và trạng thái chờ/lỗi.
3. `src/components/FriendRow.tsx` hiển thị một người cùng các nút thao tác.
4. `src/api/friends.ts` gửi yêu cầu qua apiClient đang dùng cho auth/profile.
5. `src/dev/mockTransport.ts` kiểm tra token rồi chuyển yêu cầu sang `friendsHandlers.ts`.
6. `src/dev/friendsHandlers.ts` kiểm tra quyền/trạng thái, lưu dữ liệu rồi trả danh sách mới.
7. `src/storage/friends.ts` lưu quan hệ dưới khóa localStorage `chatapp-friend-relations`; `friendsData.ts` chứa dữ liệu ban đầu.

Tải lại trang giữ các thay đổi. Tab khác cùng origin được tải lại danh sách khi dữ liệu bạn bè thay đổi. Dữ liệu JSON lỗi hoặc storage bị chặn được báo lỗi thay vì tự ghi đè.

## API giả

Tất cả đều yêu cầu token. Người thao tác được xác định từ token, không lấy userId do giao diện tự gửi.

| Method | Path | Body | Kết quả |
| --- | --- | --- | --- |
| GET | /friends | — | Danh bạ và trạng thái quan hệ của tài khoản hiện tại |
| POST | /friends/requests | personId | Gửi lời mời |
| POST | /friends/requests/:id/accept | {} | Chấp nhận lời mời nhận |
| POST | /friends/requests/:id/decline | {} | Từ chối lời mời nhận |
| POST | /friends/requests/:id/cancel | {} | Hủy lời mời do mình gửi |
| POST | /friends/:personId/remove | {} | Hủy quan hệ bạn bè |

Mỗi thao tác thành công trả danh bạ mới. Đây là contract tạm cho frontend, có thể đổi khi tích hợp backend.

Quy tắc: không tự kết bạn; không gửi trùng hoặc gửi ngược một lời mời đang chờ; chỉ người nhận được chấp nhận/từ chối, chỉ người gửi được hủy. Một quan hệ bạn bè có hiệu lực hai chiều.

Phần này chưa gồm theo dõi, chặn, báo cáo, hồ sơ người khác hoặc chat.
