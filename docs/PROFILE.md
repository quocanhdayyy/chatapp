# Hồ sơ cá nhân

Giữ nền sáng của ChatApp theo lựa chọn người dùng. Bố cục tham khảo: ảnh bìa lớn, avatar chồng lên mép ảnh, tên và số bạn bè, các tab và hai cột nội dung.

## Chức năng

- Thêm/đổi ảnh bìa và avatar: ảnh JPG, PNG hoặc WebP tối đa 4MB, lưu bằng IndexedDB hiện có. Avatar được dùng lại trên Header, bài viết, ô soạn và danh sách bạn bè.
- Nút Tạo bài viết mở tab Bài viết và đưa con trỏ vào ô soạn.
- Chỉnh sửa tên, giới thiệu, nơi sống, quê quán, công việc và học vấn. Thông tin mới mặc định trống.
- Bài viết: chỉ bài của tài khoản hiện tại; đăng/sửa/xóa/thích/bình luận dùng module có sẵn.
- Giới thiệu: thông tin cá nhân và đổi mật khẩu.
- Bạn bè: lấy quan hệ đã chấp nhận, đếm theo dữ liệu thực của mock API, có lối sang quản lý bạn bè.
- Ảnh: avatar, ảnh bìa và ảnh từ bài cá nhân; bấm để mở trình xem ảnh.
- Cửa sổ nhỏ: nội dung chuyển về một cột.

## File chính

- `src/screens/ProfileScreen.tsx`: tải dữ liệu khi mở/quay lại hồ sơ, tab, chọn ảnh và bài viết cá nhân.
- `src/components/ProfileHero.tsx`: ảnh bìa, avatar, tên, nút và thanh tab.
- `src/components/ProfileIntro.tsx`: thông tin cá nhân.
- `src/screens/EditProfileScreen.tsx`: form sửa thông tin.
- `src/types/profile.ts`: cấu trúc dữ liệu và giới hạn độ dài.
- `src/dev/profileHandlers.ts`: kiểm tra nội dung và ID ảnh trước khi lưu; patch một phần giữ các trường khác.
- `src/components/ui/UserAvatar.tsx`, `src/hooks/useStoredImage.ts`: tải avatar đã lưu, dùng chữ viết tắt nếu ảnh không đọc được.

Dữ liệu hồ sơ cũ vẫn đọc được: các trường mới được bổ sung giá trị rỗng khi tải. Lưu text trong localStorage, chỉ lưu ID tham chiếu ảnh trong hồ sơ. Upload ảnh thất bại hoặc cập nhật hồ sơ thất bại không làm mất ảnh hiện tại.

Chưa có Stories hoặc Reels; giao diện chỉ hiển thị những tab/nút đã có luồng hoạt động.
