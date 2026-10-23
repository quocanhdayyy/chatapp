import { getImage } from '../api/media';
import { ApiError } from '../core/network/ApiError';
import { loadProfile, saveProfile } from '../storage/profile';
import { PROFILE_TEXT_LIMITS, type Profile, type UpdateProfileInput } from '../types/profile';

const initialProfile: Profile = {
  id: '1', name: 'Quốc Anh', email: 'anh@example.com',
  bio: 'Đang học React Native và xây dựng ChatApp.',
  city: '', hometown: '', workplace: '', education: '', avatarImageId: null, coverImageId: null,
};

function findProfile(userId: string): Profile {
  if (userId !== initialProfile.id) throw new ApiError('Không tìm thấy hồ sơ.', 404, 'NOT_FOUND');
  return loadProfile(userId) ?? { ...initialProfile };
}

export async function readUserProfile(userId: string): Promise<Profile> { return findProfile(userId); }

export async function writeUserProfile(userId: string, input: Record<string, unknown>): Promise<Profile> {
  findProfile(userId);
  const changes: UpdateProfileInput = {};
  const textFields = Object.keys(PROFILE_TEXT_LIMITS) as (keyof typeof PROFILE_TEXT_LIMITS)[];
  const allowed = [...textFields, 'avatarImageId', 'coverImageId'];
  if (Object.keys(input).length === 0 || Object.keys(input).some((key) => !allowed.includes(key))) throw new ApiError('Thông tin hồ sơ không hợp lệ.', 400, 'VALIDATION');
  for (const field of textFields) {
    if (!(field in input)) continue;
    const value = input[field];
    if (typeof value !== 'string') throw new ApiError('Thông tin hồ sơ phải là văn bản.', 400, 'VALIDATION');
    const text = value.trim();
    if (field === 'name' && !text) throw new ApiError('Họ tên không được để trống.', 400, 'VALIDATION');
    if (text.length > PROFILE_TEXT_LIMITS[field]) throw new ApiError(`Thông tin quá dài (tối đa ${PROFILE_TEXT_LIMITS[field]} ký tự).`, 400, 'VALIDATION');
    changes[field] = text;
  }
  for (const field of ['avatarImageId', 'coverImageId'] as const) {
    if (!(field in input)) continue;
    const id = input[field];
    if (id !== null && (typeof id !== 'string' || !id.trim())) throw new ApiError('Ảnh hồ sơ không hợp lệ.', 400, 'VALIDATION');
    if (typeof id === 'string') await getImage(id);
    changes[field] = id as string | null;
  }
  // Đọc lại sau khi chờ kiểm tra ảnh để không ghi đè một thay đổi hồ sơ khác.
  const updated = { ...findProfile(userId), ...changes };
  saveProfile(updated);
  return updated;
}
