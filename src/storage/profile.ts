import { ApiError } from '../core/network/ApiError';
import type { Profile } from '../types/profile';

const listeners = new Set<(userId: string) => void>();
export function profileStorageKey(userId: string) { return `chatapp-profile-${userId}`; }

export function loadProfile(userId: string): Profile | null {
  try {
    const saved = localStorage.getItem(profileStorageKey(userId));
    if (!saved) return null;
    const profile = JSON.parse(saved);
    if (profile?.id !== userId || typeof profile?.name !== 'string' || typeof profile?.email !== 'string' || typeof profile?.bio !== 'string') return null;
    const fields = ['city', 'hometown', 'workplace', 'education'] as const;
    if (fields.some((field) => profile[field] !== undefined && typeof profile[field] !== 'string')) return null;
    if (['avatarImageId', 'coverImageId'].some((field) => profile[field] !== undefined && profile[field] !== null && typeof profile[field] !== 'string')) return null;
    return {
      id: profile.id, name: profile.name, email: profile.email, bio: profile.bio,
      city: profile.city ?? '', hometown: profile.hometown ?? '',
      workplace: profile.workplace ?? '', education: profile.education ?? '',
      avatarImageId: profile.avatarImageId ?? null, coverImageId: profile.coverImageId ?? null,
    };
  } catch { return null; }
}

export function saveProfile(profile: Profile) {
  try { localStorage.setItem(profileStorageKey(profile.id), JSON.stringify(profile)); }
  catch { throw new ApiError('Không lưu được hồ sơ trên trình duyệt. Hãy thử lại.', 500, 'STORAGE_WRITE'); }
  listeners.forEach((listener) => { try { listener(profile.id); } catch { /* Hồ sơ đã được lưu. */ } });
}

export function subscribeProfile(listener: (userId: string) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
