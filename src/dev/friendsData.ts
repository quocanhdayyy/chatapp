import type { FriendPerson, FriendRelation } from '../types/friends';

// Người dùng và quan hệ mẫu để phát triển frontend khi chưa có backend.
export const demoPeople: FriendPerson[] = [
  { id: '1', name: 'Quốc Anh', email: 'anh@example.com', bio: 'Đang học React Native và xây dựng ChatApp.' },
  { id: '2', name: 'Mai', email: 'mai@example.com', bio: 'Thiết kế giao diện và chụp ảnh.' },
  { id: '3', name: 'Dũng', email: 'dung@example.com', bio: 'Lập trình và công nghệ.' },
  { id: '4', name: 'Sơn', email: 'son@example.com', bio: 'Thích bóng đá và du lịch.' },
  { id: '5', name: 'Nam', email: 'nam@example.com', bio: 'Đọc sách và nghe nhạc.' },
  { id: '6', name: 'Thùy Linh', email: 'linh@example.com', bio: 'Vẽ và thiết kế đồ họa.' },
  { id: '7', name: 'Minh Anh', email: 'minhanh@example.com', bio: 'Học ngoại ngữ và khám phá địa điểm mới.' },
  { id: '8', name: 'Hà', email: 'ha@example.com', bio: 'Cà phê, nhiếp ảnh và những chuyến đi.' },
];

export const initialFriendRelations: FriendRelation[] = [
  { id: 'friend-1-2', fromId: '1', toId: '2', status: 'accepted' },
  { id: 'request-3-1', fromId: '3', toId: '1', status: 'pending' },
  { id: 'request-4-1', fromId: '4', toId: '1', status: 'pending' },
  { id: 'request-1-5', fromId: '1', toId: '5', status: 'pending' },
];
