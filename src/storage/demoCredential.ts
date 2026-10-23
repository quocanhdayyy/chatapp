const STORAGE_KEY = 'chatapp-demo-password-hash';

async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Chỉ dùng cho tài khoản mẫu trên web; không thay thế xác thực từ backend.
export async function verifyDemoPassword(password: string): Promise<boolean> {
  const savedHash = localStorage.getItem(STORAGE_KEY);

  if (savedHash === null) {
    return password === '123456';
  }

  return (await hashPassword(password)) === savedHash;
}

export async function saveDemoPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem(STORAGE_KEY, hash);
}
