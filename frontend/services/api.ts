// Simple API wrapper for the backend
// Adjust BASE_URL to your machine's LAN IP when testing on a real device
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const message = (data && (data.error || data.message)) || res.statusText;
      // Throw as-is for server errors so UI shows the real backend message
      throw new Error(message);
    }
    return data;
  } catch (err: any) {
    // Only append hint for actual network failures (TypeError from fetch)
    const isNetworkError = err && (err.name === 'TypeError' || /Network request failed/i.test(err.message || ''));
    if (isNetworkError) {
      const hint = `Network error calling ${url}. Ensure EXPO_PUBLIC_API_BASE_URL is reachable from your device/emulator and backend is running.`;
      const msg = err?.message ? `${err.message} — ${hint}` : hint;
      throw new Error(msg);
    }
    throw err;
  }
}

export async function apiPost(path: string, body?: any, token?: string) {
  return request(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function apiGet(path: string, token?: string) {
  return request(path, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function apiPatch(path: string, body?: any, token?: string) {
  return request(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
