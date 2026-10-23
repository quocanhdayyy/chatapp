export type User = { id: string; name: string; email: string };

export type AuthSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};
