export type HttpRequest = {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export type HttpResponse = {
  status: number;
  data?: unknown;
  message?: string;
  code?: string;
};

export type HttpTransport = (request: HttpRequest) => Promise<HttpResponse>;
