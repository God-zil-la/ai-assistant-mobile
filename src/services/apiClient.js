const unauthorizedListeners = new Set();

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, retryAfter = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.retryAfter = retryAfter;
  }
}

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function errorText(data) {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(errorText).filter(Boolean).join(' ');
  if (data && typeof data === 'object') {
    return errorText(data.error || data.detail || data.errors || Object.values(data));
  }
  return '';
}

// A lost response can follow a committed write. Never retry mutations automatically.
export async function request(url, { token, method = 'GET', body, multipart = false, timeout = 30000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method, signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token) unauthorizedListeners.forEach((listener) => listener(token));
      const seconds = Number(response.headers.get('Retry-After') || data?.retry_after_seconds);
      throw new ApiError(errorText(data) || (response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : 'The service is temporarily unavailable. Please try again.'),
      { status: response.status, data, retryAfter: seconds > 0 ? seconds : null });
    }
    if (data === null) throw new ApiError('The server returned an invalid response.');
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted
      ? 'The request timed out. Check your connection and try again.'
      : 'Unable to connect. Check your internet connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}
