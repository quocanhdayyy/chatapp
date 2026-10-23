import { saveDemoPassword, verifyDemoPassword } from '../storage/demoCredential';
import { loadProfile } from '../storage/profile';

export type User = {
  id: string;
  name: string;
  email: string;
};

type LoginResponse = {
  user: User;
  accessToken: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {

  if (email !== 'anh@example.com' || !(await verifyDemoPassword(password))) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }

  const savedProfile = loadProfile('1');

  return {
    user: {
      id: '1',
      name: savedProfile?.name ?? 'Quốc Anh',
      email: 'anh@example.com',
    },
    accessToken: 'demo-token',
  };
}

export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {

  if (userId !== '1') {
    throw new Error('Không tìm thấy tài khoản.');
  }

  if (!input.currentPassword || !input.newPassword || !input.confirmPassword) {
    throw new Error('Vui lòng nhập đầy đủ ba ô mật khẩu.');
  }

  if (input.newPassword.length < 6 || input.newPassword.length > 64) {
    throw new Error('Mật khẩu mới phải có từ 6 đến 64 ký tự.');
  }

  if (input.newPassword !== input.confirmPassword) {
    throw new Error('Mật khẩu xác nhận không khớp.');
  }

  if (input.newPassword === input.currentPassword) {
    throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
  }

  if (!(await verifyDemoPassword(input.currentPassword))) {
    throw new Error('Mật khẩu hiện tại không đúng.');
  }

  await saveDemoPassword(input.newPassword);
}
