import { getFriends } from '../api/friends';
import { createPost } from '../api/posts';

// Thao tác do người dùng bấm trong chế độ phát triển, không tự sinh bài định kỳ.
export async function simulateFollowedPost() {
  const people = await getFriends();
  const author = people.find((person) => person.isFollowing);
  if (!author) throw new Error('Bạn chưa theo dõi ai. Hãy theo dõi một người rồi thử lại.');
  return createPost({ id: author.id, name: author.name, email: author.email }, 'Bài viết mẫu để thử thông báo từ người đang theo dõi.');
}
