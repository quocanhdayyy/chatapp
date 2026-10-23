import type { User } from './auth';

export type Profile = User & {
  bio: string;
  city: string;
  hometown: string;
  workplace: string;
  education: string;
  avatarImageId: string | null;
  coverImageId: string | null;
};

export type UpdateProfileInput = Partial<Omit<Profile, 'id' | 'email'>>;
export const PROFILE_TEXT_LIMITS = { name: 80, bio: 500, city: 120, hometown: 120, workplace: 120, education: 120 } as const;
