import type { Post, SharedPost } from '../api/posts';

function originalId(post: Post) { return post.sharedPostId ?? post.id; }

function preview(post: Post): SharedPost {
  return { id: post.id, authorId: post.authorId, author: post.author, content: post.content, images: post.images };
}

// Cập nhật bảng tin ngay sau thao tác; API vẫn là nơi lưu dữ liệu chính.
export function addPostToFeed(posts: Post[], created: Post): Post[] {
  return [created, ...posts.filter((post) => post.id !== created.id).map((post) => (
    created.sharedPostId && originalId(post) === created.sharedPostId
      ? { ...post, shareCount: created.shareCount ?? 0 }
      : post
  ))];
}

export function updatePostInFeed(posts: Post[], updated: Post): Post[] {
  return posts.map((post) => {
    if (post.id === updated.id) return updated;
    if (post.sharedPostId === updated.id) return { ...post, sharedPost: preview(updated) };
    return post;
  });
}

export function removePostFromFeed(posts: Post[], deletedId: string): Post[] {
  const deleted = posts.find((post) => post.id === deletedId);
  return posts.filter((post) => post.id !== deletedId).map((post) => {
    const updated = post.sharedPostId === deletedId ? { ...post, sharedPost: null } : post;
    return deleted?.sharedPostId && originalId(post) === deleted.sharedPostId
      ? { ...updated, shareCount: Math.max(0, (updated.shareCount ?? 0) - 1) }
      : updated;
  });
}
