import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, tokenStore } from './api';

describe('tokenStore', () => {
  it('guarda y limpia el access token en memoria', () => {
    tokenStore.set('abc');
    expect(tokenStore.get()).toBe('abc');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    tokenStore.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('añade Authorization cuando hay token', async () => {
    tokenStore.set('tok-1');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await api.get('/api/auth/me/');
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-1');
  });

  it('ante 401 intenta refresh y reintenta una vez', async () => {
    tokenStore.set('viejo');
    const mock = fetch as ReturnType<typeof vi.fn>;
    mock
      .mockResolvedValueOnce(new Response('', { status: 401 }))                                  // petición original
      .mockResolvedValueOnce(new Response(JSON.stringify({ access: 'nuevo' }), { status: 200 })) // refresh
      .mockResolvedValueOnce(new Response(JSON.stringify({ dato: 1 }), { status: 200 }));        // reintento
    const resp = await api.get('/api/contenido/');
    expect(resp.status).toBe(200);
    expect(tokenStore.get()).toBe('nuevo');
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it('si el refresh falla, limpia el token y devuelve el 401', async () => {
    tokenStore.set('viejo');
    const mock = fetch as ReturnType<typeof vi.fn>;
    mock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));
    const resp = await api.get('/api/contenido/');
    expect(resp.status).toBe(401);
    expect(tokenStore.get()).toBeNull();
  });
});
