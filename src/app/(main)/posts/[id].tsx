import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import PostDetailScreen from '../../../screens/PostDetailScreen';

export default function PostDetailRoute() {
  const { user, signOut } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (!user) return null;
  return <PostDetailScreen
    key={typeof id === 'string' ? id : ''}
    postId={typeof id === 'string' ? id : ''}
    user={user}
    onFeed={() => router.navigate('/')}
    onFriends={() => router.navigate('/friends')}
    onProfile={() => router.navigate('/profile')}
    onLogout={() => { void signOut(); }}
    onShared={(post) => router.push({ pathname: '/posts/[id]', params: { id: post.id } })}
  />;
}
