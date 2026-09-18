// The access token lives ONLY in memory (never localStorage) — this is what
// limits the damage of an XSS. The refresh token travels in an HttpOnly cookie
// managed by the backend.

let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};

/** Endpoints that must never trigger the refresh-and-retry loop. */
const NO_RETRY_PATHS = [
  '/login/',
  '/login/verificar/',
  '/login/reenviar/',
  '/refresh/',
  '/logout/',
  '/registro/',
];

async function refresh(): Promise<boolean> {
  const response = await fetch('/api/auth/refresh/', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    tokenStore.clear();
    return false;
  }
  const data = (await response.json()) as { access: string };
  tokenStore.set(data.access);
  return true;
}

async function request(url: string, init: RequestInit = {}): Promise<Response> {
  // With FormData the browser sets Content-Type itself (it carries the
  // multipart boundary), so it must not be set here.
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string>),
  };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { ...init, headers, credentials: 'include' });
  if (response.status !== 401 || NO_RETRY_PATHS.some((path) => url.endsWith(path))) {
    return response;
  }

  // Access token expired: one refresh attempt and a single retry.
  if (!(await refresh())) return response;
  const retryHeaders = { ...headers, Authorization: `Bearer ${tokenStore.get()}` };
  return fetch(url, { ...init, headers: retryHeaders, credentials: 'include' });
}

export const api = {
  get: (url: string) => request(url),
  post: (url: string, body?: unknown) =>
    request(url, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: (url: string, body: unknown) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (url: string, body: unknown) =>
    request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url: string) => request(url, { method: 'DELETE' }),
  /** Multipart (files), with the same automatic token refresh as the rest. */
  postForm: (url: string, formData: FormData) => request(url, { method: 'POST', body: formData }),
  patchForm: (url: string, formData: FormData) =>
    request(url, { method: 'PATCH', body: formData }),
};
