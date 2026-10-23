import { mockTransport } from '../../dev/mockTransport';
import { clearSession, loadSession, saveSession } from '../../storage/session';
import type { AuthSession } from '../../types/auth';
import { ApiError } from './ApiError';
import type { HttpRequest, HttpTransport } from './contracts';

export class ApiClient {
  private refreshing: Promise<AuthSession> | null = null;

  constructor(private transport: HttpTransport = mockTransport) {}

  private async send<T>(request: HttpRequest): Promise<T> {
    try {
      const response = await this.transport(request);
      if (response.status < 200 || response.status >= 300) {
        throw new ApiError(response.message ?? 'Yêu cầu không thành công.', response.status, response.code);
      }
      return response.data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Không kết nối được. Hãy thử lại.', 0, 'NETWORK');
    }
  }

  private refresh(): Promise<AuthSession> {
    if (this.refreshing) return this.refreshing;
    const original = loadSession();
    if (!original) return Promise.reject(new ApiError('Vui lòng đăng nhập lại.', 401, 'UNAUTHENTICATED'));

    this.refreshing = this.send<AuthSession>({ method: 'POST', path: '/auth/refresh', body: { refreshToken: original.refreshToken } })
      .then((session) => {
        if (loadSession()?.refreshToken !== original.refreshToken) {
          throw new ApiError('Phiên đăng nhập đã thay đổi.', 401, 'SESSION_CHANGED');
        }
        saveSession(session);
        return session;
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401 && loadSession()?.refreshToken === original.refreshToken) clearSession();
        throw error;
      })
      .finally(() => { this.refreshing = null; });
    return this.refreshing;
  }

  async request<T>(request: HttpRequest, authenticated = true): Promise<T> {
    if (!authenticated) return this.send<T>(request);
    const initial = loadSession();
    if (!initial) throw new ApiError('Vui lòng đăng nhập.', 401, 'UNAUTHENTICATED');
    const authorized = (token: string): HttpRequest => ({ ...request, headers: { ...request.headers, Authorization: `Bearer ${token}` } });

    try {
      return await this.send<T>(authorized(initial.accessToken));
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      const current = loadSession();
      if (!current || (current.refreshToken !== initial.refreshToken && current.accessToken === initial.accessToken)) throw error;
      const session = current.accessToken !== initial.accessToken ? current : await this.refresh();
      try {
        return await this.send<T>(authorized(session.accessToken));
      } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401 && loadSession()?.accessToken === session.accessToken) clearSession();
        throw retryError;
      }
    }
  }

  get<T>(path: string) { return this.request<T>({ method: 'GET', path }); }
  post<T>(path: string, body: unknown, authenticated = true) { return this.request<T>({ method: 'POST', path, body }, authenticated); }
  patch<T>(path: string, body: unknown) { return this.request<T>({ method: 'PATCH', path, body }); }
}

export const apiClient = new ApiClient();
