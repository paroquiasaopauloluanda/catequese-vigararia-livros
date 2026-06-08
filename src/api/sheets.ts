const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL as string;

function encodePayload(data: unknown): string {
  // encodeURIComponent produces ASCII-only percent-encoded string → btoa is safe
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

function getSession() {
  try {
    const raw = localStorage.getItem('catequese_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expiresAt && Date.now() > s.expiresAt) {
      localStorage.removeItem('catequese_session');
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export async function callApi(action: string, payload?: unknown): Promise<unknown> {
  if (!SCRIPT_URL) {
    throw new Error('VITE_SCRIPT_URL não configurado. Crie o ficheiro .env com a URL do Apps Script.');
  }

  const session = getSession();
  const params  = new URLSearchParams({ action });

  if (payload !== undefined) {
    params.set('payload', encodePayload(payload));
  }
  if (session?.userId) {
    params.set('userId', session.userId);
    params.set('token',  session.token);
  }

  const url = `${SCRIPT_URL}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { redirect: 'follow' });
  } catch (e) {
    throw new Error('Sem conexão com o servidor. Verifique a ligação à internet.');
  }

  let data: Record<string, unknown>;
  try {
    const text = await response.text();
    data = JSON.parse(text);
  } catch {
    throw new Error('Resposta inválida do servidor.');
  }

  if (data?.error) {
    const msg = data.error as string;
    if (msg.includes('Sessão inválida')) {
      localStorage.removeItem('catequese_session');
      window.location.href = '/';
    }
    throw new Error(msg);
  }

  return data;
}

export { getSession };