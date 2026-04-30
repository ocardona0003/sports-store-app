/**
 * Auth Store — gestiona tokens JWT en memoria (no localStorage por seguridad)
 * El refreshToken sí se guarda en localStorage para sobrevivir recargas.
 *
 * Flujo:
 *  1. login()  → guarda accessToken en memoria, refreshToken en localStorage
 *  2. apiFetch() → adjunta accessToken en Authorization header
 *  3. Si recibe 401 TOKEN_EXPIRED → llama refresh() automáticamente y reintenta
 *  4. logout() → borra todo y llama al backend para revocar el refreshToken
 */
import { reactive, computed } from 'vue';

const REFRESH_KEY = 'sports_refresh_token';

// ── Estado reactivo en memoria ─────────────────────────────────────────────────
const state = reactive({
  accessToken:  null,   // nunca en disco
  user:         null,
  loading:      false,
  error:        null,
});

// ── Getters ────────────────────────────────────────────────────────────────────
export const isAuthenticated = computed(() => !!state.accessToken);
export const currentUser     = computed(() => state.user);
export const authLoading     = computed(() => state.loading);
export const authError       = computed(() => state.error);

// ── Internos ───────────────────────────────────────────────────────────────────
const setTokens = (accessToken, refreshToken, user) => {
  state.accessToken = accessToken;
  state.user        = user;
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
};

const clearAuth = () => {
  state.accessToken = null;
  state.user        = null;
  localStorage.removeItem(REFRESH_KEY);
};

// Decodifica el payload JWT sin verificar firma (solo para leer datos)
const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

// ── Renovar access token ───────────────────────────────────────────────────────
let refreshPromise = null;   // evitar múltiples llamadas simultáneas

const refresh = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    if (!storedRefresh) throw new Error('No hay refresh token.');

    const res  = await fetch('/api/auth/refresh', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken: storedRefresh }),
    });
    const data = await res.json();

    if (!res.ok) {
      clearAuth();
      throw new Error(data.error || 'No se pudo renovar la sesión.');
    }

    setTokens(data.data.accessToken, data.data.refreshToken, state.user);
    return data.data.accessToken;
  })().finally(() => { refreshPromise = null; });

  return refreshPromise;
};

// ── apiFetch — fetch con JWT + auto-refresh ────────────────────────────────────
export const apiFetch = async (url, options = {}) => {
  const doRequest = async (token) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Si options.body es FormData, NO ponemos Content-Type (lo maneja el browser)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    return fetch(url, { ...options, headers });
  };

  let res = await doRequest(state.accessToken);

  // Si el access token expiró, refrescarlo y reintentar UNA vez
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED') {
      try {
        const newToken = await refresh();
        res = await doRequest(newToken);
      } catch {
        clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud.');
  return data;
};

// ── Acciones públicas ──────────────────────────────────────────────────────────
export const authStore = {
  state,

  async login(email, password) {
    state.loading = true;
    state.error   = null;
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales inválidas.');
      setTokens(data.data.accessToken, data.data.refreshToken, data.data.user);
      return data.data.user;
    } catch (err) {
      state.error = err.message;
      throw err;
    } finally {
      state.loading = false;
    }
  },

  async logout() {
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    try {
      if (state.accessToken && storedRefresh) {
        await fetch('/api/auth/logout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.accessToken}` },
          body:    JSON.stringify({ refreshToken: storedRefresh }),
        });
      }
    } catch {}
    clearAuth();
  },

  // Restaurar sesión al recargar la página (si hay refreshToken en localStorage)
  async restoreSession() {
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    if (!storedRefresh) return false;
    try {
      await refresh();
      // Obtener datos del usuario
      const data = await apiFetch('/api/auth/me');
      state.user = data.data;
      return true;
    } catch {
      clearAuth();
      return false;
    }
  },

  isAdmin()    { return state.user?.rol === 'admin'; },
  isEmpleado() { return state.user?.rol === 'empleado' || state.user?.rol === 'admin'; },
};
