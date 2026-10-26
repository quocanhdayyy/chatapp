# Menu Thêm

Menu ở góc phải Header, cạnh avatar. Cửa sổ hẹp dùng biểu tượng ba chấm.

- Hồ sơ cá nhân → `/profile`.
- Chỉnh sửa hồ sơ → `/profile/edit`.
- Đổi mật khẩu → `/profile/password`.
- Đăng xuất → gọi callback `onLogout` hiện có, xóa phiên và về màn hình đăng nhập.

`src/components/MoreMenu.tsx` quản lý mở/đóng, vị trí bảng menu và điều hướng. `Header.tsx` dùng lại component này ở trang chủ, bạn bè, thông báo và hồ sơ.

Bấm ngoài bảng, nút Đóng hoặc Escape sẽ đóng menu. Menu cũng đóng khi chuyển trang hoặc đổi kích thước cửa sổ. Nội dung cuộn được khi cửa sổ thấp.

Không cần API giả mới vì các mục đã có màn hình và luồng xử lý.
