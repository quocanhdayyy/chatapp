# Mục 1 — nền tảng web và tài khoản

Dự án dùng React Native + Expo Web. API và dữ liệu đều giả lập tại trình duyệt.

## Chạy và kiểm tra

```bash
npm run web
npm run lint
npm run typecheck
npm run check:core
npm run build:web
```

Sau khi chuyển sang Expo Router, dừng Metro cũ (Ctrl+C) rồi chạy lại `npm run web -- --clear`.
Tài khoản mẫu: `anh@example.com`, mật khẩu ban đầu `123456`; nếu đã đổi thì dùng mật khẩu mới.
Hồ sơ, bài viết, bình luận, ảnh và mật khẩu mẫu đã lưu trước đây vẫn được giữ.
Phiên cũ chỉ lưu tên người dùng sẽ yêu cầu đăng nhập lại một lần để tạo token giả.

## Kết quả kiểm tra ngày 23/10/2026

Phạm vi bàn giao là nhóm nhiệm vụ 1 trên web, sử dụng API giả và dữ liệu cục bộ.

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` | Đạt |
| `npm run typecheck` | Đạt |
| `npm run check:core` | Đạt: tài khoản, hồ sơ, mật khẩu, token/refresh, lỗi mạng và giữ phiên |
| Build web | Đạt; artifact kiểm tra tại `/private/tmp/chatapp-core-final-web` |
| Thao tác trực tiếp trên Safari | Chưa xác minh: công cụ điều khiển trình duyệt không khởi động được |

Các kiểm tra logic dùng storage trong RAM, không thay đổi tài khoản hay dữ liệu đã lưu trên Safari.
Danh sách kiểm tra thủ công bên dưới là bước nghiệm thu giao diện còn cần thực hiện; kết quả build không thay thế bước này.

## Bảng đối chiếu nhiệm vụ

| Yêu cầu | Phần triển khai |
|---|---|
| Cấu trúc, routing, state | `src/app`, `providers/AuthProvider.tsx` |
| HTTP client, interceptor, lỗi | `core/network/apiClient.ts`, `ApiError.ts` |
| JWT/refresh | `dev/mockTokens.ts`, tự gắn Bearer và refresh một lần khi gặp 401 |
| Storage | `storage/session.ts`, `profile.ts`, IndexedDB trong `media.ts` |
| Theme, button, input | `core/theme.ts`, `components/ui` |
| Loading/error/empty, retry | `components/ui/StateViews.tsx` |
| Splash | `screens/SplashScreen.tsx`, khôi phục phiên trong AuthProvider |
| Login/Home shell | `/login`, `/`, Header và HomeScreen |
| My Profile/Edit Profile | `/profile`, `/profile/edit` |
| Change Password | `/profile/password` |
| Shared Post/Comment/Media | PostCard, shared/CommentCard, shared/MediaViewer |
| Auth/User API | `api/auth.ts`, `api/profile.ts`, `dev/mockTransport.ts` |
| Build web | `npm run build:web` tạo thư mục `dist` |

## Luồng mở web

`index.ts` → Expo Router → `src/app/_layout.tsx` → App/AuthProvider → Splash.
Sau khi đọc và kiểm tra phiên: chưa đăng nhập thì về Login; có phiên thì mở đúng URL đang truy cập.
URL hồ sơ được bảo vệ khi chưa đăng nhập. Back/Forward và refresh dùng lịch sử của trình duyệt.

## Luồng gọi API

Màn hình → api/auth hoặc api/profile → ApiClient → MockTransport → dữ liệu giả.
ApiClient tự gắn access token. Token hết hạn thì gọi refresh, lưu token mới và gửi lại request một lần.
Nhiều request hết hạn cùng lúc dùng chung một lần refresh. Refresh hết hạn thì xóa phiên và về Login.
Mất mạng hoặc lỗi 500 không tự xóa phiên, người dùng có thể thử lại.

Các hợp đồng đang mô phỏng:

| Method | Path | Đầu vào |
|---|---|---|
| POST | /auth/login | email, password |
| POST | /auth/refresh | refreshToken |
| POST | /auth/logout | refreshToken |
| GET | /users/me | Bearer token |
| GET/PATCH | /users/:id | name, bio khi PATCH |
| POST | /auth/change-password | userId, currentPassword, newPassword, confirmPassword |

Access token giả hết hạn sau 2 phút; refresh token sau 7 ngày. Đây là mô phỏng JWT, không phải xác thực bảo mật cho production.
Ảnh/video trong MediaViewer là nguồn được truyền vào component; upload video thuộc nhóm Social/Media sau.
Các module Social đã có vẫn hoạt động, nhưng chưa phải toàn bộ nhóm nhiệm vụ Social + Relationship + Chat.

## Kiểm tra thủ công

1. Mở URL `/profile` khi chưa đăng nhập → về Login.
2. Đăng nhập sai → báo lỗi; đăng nhập đúng → vào bảng tin.
3. Mở `/profile/edit`, sửa và lưu → hồ sơ và Header cập nhật.
4. Refresh tại `/profile` → vẫn ở hồ sơ sau Splash.
5. Đợi hơn 2 phút, mở hồ sơ → client tự refresh token.
6. Đổi mật khẩu, đăng xuất, đăng nhập bằng mật khẩu mới.
7. Đăng xuất rồi Back → không vào lại trang được bảo vệ.
8. Mở ảnh từ bài viết → MediaViewer, đóng bằng nút Đóng hoặc Escape.

## Quy ước

- Route chỉ nằm trong `src/app`; code nghiệp vụ và component nằm ngoài đó.
- Màn hình tài khoản gọi API wrapper; không tự thêm token.
- Màu/khoảng cách chung lấy từ `core/theme.ts`.
- Dùng AppButton/AppTextField và các state view khi thêm màn hình mới.
- Chưa phát hành online; build web là artifact để review/chạy thử.
