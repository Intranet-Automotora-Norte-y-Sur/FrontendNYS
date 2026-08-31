// Access token vive SOLO en memoria (nunca localStorage) — mitiga robo por XSS.
// El refresh token viaja en cookie HttpOnly gestionada por el backend.

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

async function refrescar(): Promise<boolean> {
  const resp = await fetch('/api/auth/refresh/', {
    method: 'POST',
    credentials: 'include',
  });
  if (!resp.ok) {
    tokenStore.clear();
    return false;
  }
  const data = (await resp.json()) as { access: string };
  tokenStore.set(data.access);
  return true;
}

async function solicitud(url: string, init: RequestInit = {}): Promise<Response> {
  // Con FormData el navegador fija el Content-Type (incluye el boundary multipart)
  const esFormulario = init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(esFormulario ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string>),
  };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(url, { ...init, headers, credentials: 'include' });
  const SIN_REINTENTO = ['/login/', '/refresh/', '/logout/', '/registro/'];
  if (resp.status !== 401 || SIN_REINTENTO.some((ruta) => url.endsWith(ruta))) return resp;

  // Access expirado: un intento de refresh y reintento único
  if (!(await refrescar())) return resp;
  const headersReintento = { ...headers, Authorization: `Bearer ${tokenStore.get()}` };
  return fetch(url, { ...init, headers: headersReintento, credentials: 'include' });
}

export const api = {
  get: (url: string) => solicitud(url),
  post: (url: string, body?: unknown) =>
    solicitud(url, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: (url: string, body: unknown) =>
    solicitud(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (url: string, body: unknown) =>
    solicitud(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url: string) => solicitud(url, { method: 'DELETE' }),
  /** Multipart (archivos) con el mismo auto-refresh de token que el resto. */
  postForm: (url: string, datos: FormData) => solicitud(url, { method: 'POST', body: datos }),
  patchForm: (url: string, datos: FormData) => solicitud(url, { method: 'PATCH', body: datos }),
};
