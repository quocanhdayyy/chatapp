# Theo dõi / Bỏ theo dõi

Luồng: FriendRow → followPerson/unfollowPerson → API client → mock friends handler → social storage → cập nhật danh sách.

- Nút Theo dõi/Bỏ theo dõi ở các danh sách trong Bạn bè; có tab Đang theo dõi và Người theo dõi.
- Theo dõi là một chiều, có thể theo dõi khi chưa kết bạn; bỏ theo dõi không hủy kết bạn và không thay đổi chiều ngược lại.
- Gửi lời mời chưa tạo theo dõi. Chấp nhận kết bạn tự thêm cả hai chiều, cùng lần lưu với quan hệ bạn bè và thông báo.
- Hủy kết bạn giữ các lựa chọn theo dõi; muốn dừng theo dõi dùng nút Bỏ theo dõi riêng.
- Bạn bè cũ được khởi tạo theo dõi hai chiều khi đọc dữ liệu cũ. Sau khi đã lưu phiên bản 3, các lựa chọn bỏ theo dõi/rỗng được giữ nguyên, không tự thêm lại khi tải trang.
- Hồ sơ hiển thị hai số lượng và liên kết tới danh sách tương ứng.
- POST `/friends/:personId/follow` và `/friends/:personId/unfollow` dùng tài khoản từ token; không nhận ID người thực hiện từ body. Yêu cầu cùng trạng thái không ghi lặp.
- Dữ liệu v1 (mảng quan hệ) và v2 tiếp tục đọc được; lần thay đổi tiếp theo lưu `{ version: 3, relations, follows, notifications }` bằng một lần ghi.
- Lỗi mạng/storage không báo thành công hoặc thay đổi dữ liệu. Không tự theo dõi chính mình, không theo dõi ID không tồn tại.

Các danh sách vẫn dùng dữ liệu giả lưu tại trình duyệt. Bảng tin Tất cả bài viết giữ cách hiển thị hiện tại.
