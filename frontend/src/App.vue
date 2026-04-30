<template>
  <div>
    <!-- Login modal (bloquea si no autenticado en rutas protegidas) -->
    <LoginView v-if="showLogin" @success="onLoginSuccess" />

    <!-- Navbar principal -->
    <nav class="app-nav">
      <div class="nav-inner">
        <div class="nav-tabs">
          <button :class="['nav-tab', { active: tab === 'tienda' }]" @click="tab = 'tienda'">
            🏆 Tienda
          </button>
          <button :class="['nav-tab', { active: tab === 'admin' }]"
                  @click="goProtected('admin')">
            ⚙️ Administración
          </button>
          <button :class="['nav-tab', { active: tab === 'empleados' }]"
                  @click="goProtected('empleados')">
            👥 Empleados
          </button>
        </div>

        <!-- User info + logout -->
        <div class="nav-user" v-if="user">
          <span class="user-badge">
            <span class="user-rol" :class="`rol-${user.rol}`">{{ user.rol }}</span>
            {{ user.nombre }}
          </span>
          <button class="btn btn-ghost btn-sm logout-btn" @click="handleLogout">
            Salir
          </button>
        </div>
        <div v-else>
          <button class="btn btn-ghost btn-sm" @click="showLogin = true">
            🔐 Iniciar sesión
          </button>
        </div>
      </div>
    </nav>

    <!-- Vistas -->
    <TiendaView   v-if="tab === 'tienda'" />
    <AdminView    v-else-if="tab === 'admin'" />
    <EmpleadosView v-else />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { authStore, isAuthenticated, currentUser } from './stores/auth.js';
import LoginView    from './views/LoginView.vue';
import TiendaView   from './views/TiendaView.vue';
import AdminView    from './views/AdminView.vue';
import EmpleadosView from './views/EmpleadosView.vue';

const tab       = ref('tienda');
const showLogin = ref(false);
const pendingTab = ref('');
const user = currentUser;

// Escuchar evento de sesión expirada (desde apiFetch)
window.addEventListener('auth:expired', () => {
  showLogin.value = true;
  tab.value = 'tienda';
});

// Ir a una tab protegida: si no autenticado, pedir login primero
const goProtected = (targetTab) => {
  if (!isAuthenticated.value) {
    pendingTab.value = targetTab;
    showLogin.value  = true;
  } else {
    tab.value = targetTab;
  }
};

const onLoginSuccess = (userData) => {
  showLogin.value = false;
  if (pendingTab.value) {
    tab.value    = pendingTab.value;
    pendingTab.value = '';
  }
};

const handleLogout = async () => {
  await authStore.logout();
  tab.value = 'tienda';
};

// Al montar: intentar restaurar sesión desde localStorage
onMounted(async () => {
  const restored = await authStore.restoreSession();
  if (restored) {
    console.log('✅ Sesión restaurada:', currentUser.value?.email);
  }
});
</script>

<style>
.app-nav { background: #111; border-bottom: 2px solid #222; padding: 0 20px; }
.nav-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-tabs  { display: flex; gap: 4px; }
.nav-tab {
  padding: 12px 18px; background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,.5); font-family: var(--font); font-size: .875rem; font-weight: 500;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: all 180ms ease;
}
.nav-tab:hover  { color: rgba(255,255,255,.85); }
.nav-tab.active { color: #fff; border-bottom-color: var(--accent); }

.nav-user { display: flex; align-items: center; gap: 10px; }
.user-badge {
  display: flex; align-items: center; gap: 7px;
  font-size: .78rem; color: rgba(255,255,255,.7); font-family: var(--font);
}
.user-rol {
  font-size: .65rem; font-weight: 700; padding: 2px 8px; border-radius: 99px;
  text-transform: uppercase; letter-spacing: .06em;
}
.rol-admin    { background: #e94560; color: #fff; }
.rol-empleado { background: #2d6a4f; color: #fff; }
.rol-cliente  { background: #1d4e89; color: #fff; }
.logout-btn   { color: rgba(255,255,255,.5) !important; border-color: rgba(255,255,255,.2) !important; }
.logout-btn:hover { color: #fff !important; }
</style>
