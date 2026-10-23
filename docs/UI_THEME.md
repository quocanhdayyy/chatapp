# Giao diện ChatApp

Giao diện web đơn giản theo bố cục bảng tin: nền xám nhạt, khung trắng, chữ hệ thống, nút và liên kết xanh lá. Không có slogan, banner trang trí hay widget gợi cảm hứng.

## Các file chính

- `src/core/theme.ts`: màu sắc, khoảng cách và bo góc dùng chung.
- `src/components/Header.tsx`: thanh trên cùng, trang chủ, hồ sơ và đăng xuất.
- `src/components/CommunitySidebar.tsx`: bảng tin, bài viết của tôi, hồ sơ và tạo bài viết.
- `src/components/CommunityWidgets.tsx`: thông tin tài khoản và số bài/lượt thích từ dữ liệu hiện có.
- `src/screens/HomeScreen.tsx`: bố cục bảng tin, bộ lọc và tải lại bài viết.
- `src/components/PostComposer.tsx`, `PostCard.tsx`: khung soạn và bài viết.
- `src/components/ui`: nút, ô nhập, avatar và khung trang.

## Bố cục

- Header nằm trên toàn bộ trang.
- Từ 960px: menu trái xuất hiện.
- Từ 1320px: có thêm cột thông tin tài khoản bên phải.
- Cửa sổ nhỏ: một cột bảng tin, hồ sơ và đăng xuất vẫn truy cập được trên Header.

API giả, lưu trữ và luồng tài khoản không thay đổi trong lần sửa giao diện này.
