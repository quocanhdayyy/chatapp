import { useEffect, useState } from 'react';
import { useStoredImage } from '../../hooks/useStoredImage';
import { loadProfile, profileStorageKey, subscribeProfile } from '../../storage/profile';
import Avatar from './Avatar';

export default function UserAvatar({ userId, name, size = 42 }: { userId?: string; name: string; size?: number }) {
  const [saved, setSaved] = useState(() => ({ userId, id: userId ? loadProfile(userId)?.avatarImageId ?? null : null }));
  useEffect(() => {
    let active = true;
    const read = () => ({ userId, id: userId ? loadProfile(userId)?.avatarImageId ?? null : null });
    void Promise.resolve().then(() => { if (active) setSaved(read()); });
    const unsubscribe = subscribeProfile((changedId) => { if (active && changedId === userId) setSaved(read()); });
    const onStorage = (event: StorageEvent) => { if (active && userId && (event.key === profileStorageKey(userId) || event.key === null)) setSaved(read()); };
    window.addEventListener('storage', onStorage);
    return () => { active = false; unsubscribe(); window.removeEventListener('storage', onStorage); };
  }, [userId]);
  const { uri } = useStoredImage(saved.userId === userId ? saved.id : null);
  return <Avatar name={name} size={size} uri={uri} />;
}
