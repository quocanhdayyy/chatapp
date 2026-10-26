# Chia sẻ bài viết

Luồng: PostCard → SharePostDialog → sharePost() → localStorage → cập nhật bảng tin.

- Bấm Chia sẻ, thêm lời nhắn tùy chọn (tối đa 2.000 ký tự), xem trước rồi xác nhận.
- Tạo bài mới dưới tên người chia sẻ, xuất hiện ở bảng tin, Bài viết của tôi và hồ sơ.
- Chỉ lưu `sharedPostId`, không sao chép nội dung hoặc upload lại ảnh gốc.
- `getPosts()` dựng `sharedPost` và tính `shareCount` từ danh sách đang lưu.
- Chia sẻ lại một bài chia sẻ tham chiếu thẳng đến bài gốc; mỗi bài mới có Like/bình luận riêng.
- Sửa bài chia sẻ chỉ sửa lời nhắn. Xóa bài chia sẻ chỉ xóa bài đó và giảm số lượt chia sẻ.
- Bài gốc được sửa thì phần trích dẫn cập nhật. Bài gốc bị xóa thì hiện “Bài viết gốc không còn tồn tại” và khóa chia sẻ lại.
- Lỗi lưu giữ nguyên lời nhắn để thử lại; khóa nút gửi và thao tác đóng cửa sổ trong khi gửi để tránh bấm lặp.
- Dữ liệu cũ vẫn đọc được. Tải lại trình duyệt hoặc quay về từ hồ sơ sẽ tải danh sách hiện tại.

Đây là tính năng frontend với API giả, dữ liệu nằm trên trình duyệt đang dùng.
