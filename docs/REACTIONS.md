# Hàng tương tác bài viết

- Ba ô bằng nhau trên một hàng: Thích/Tim · Bình luận · Chia sẻ.
- Nhấn Thích để thích nhanh. Nhấn mũi tên cạnh nó (hoặc giữ nút) để chọn Thích hoặc Tim.
- Bấm lại cảm xúc đang chọn để bỏ. Đổi giữa hai loại không tăng tổng số cảm xúc.
- Số Thích, Tim, bình luận đã tải và chia sẻ nằm phía trên hàng nút.
- Bấm Bình luận mở/đóng phần bình luận ở dưới; giữ luồng thêm/xóa hiện có.

`toggleReaction()` lưu một loại cảm xúc cho mỗi người ở `reactions[userId]`. `likes` giữ tổng cảm xúc và `likedBy` giữ ID đã phản ứng để tương thích code cũ. Dữ liệu Like cũ chuyển sang Thích, giữ nguyên tổng số.

Bài gốc và bài chia sẻ có cảm xúc riêng. Dữ liệu được lưu bằng API giả trên trình duyệt.
