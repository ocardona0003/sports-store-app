<template>
  <div>
    <nav class="app-nav">
      <div class="nav-inner">
        <button :class="['nav-tab', { active: tab === 'tienda' }]" @click="tab = 'tienda'">
          🏆 Tienda Deportiva
        </button>
        <button :class="['nav-tab', { active: tab === 'admin' }]" @click="tab = 'admin'">
          ⚙️ Administración
        </button>
        <button :class="['nav-tab', { active: tab === 'empleados' }]" @click="tab = 'empleados'">
          👥 Empleados
        </button>
      </div>
    </nav>

    <TiendaView   v-if="tab === 'tienda'" />
    <AdminView    v-else-if="tab === 'admin'" />
    <EmpleadosView v-else />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TiendaView    from './views/TiendaView.vue';
import AdminView     from './views/AdminView.vue';
import EmpleadosView from './views/EmpleadosView.vue';

const tab = ref('tienda');
</script>

<style>
.app-nav { background: #111; border-bottom: 2px solid #222; padding: 0 20px; }
.nav-inner { max-width: 1200px; margin: 0 auto; display: flex; gap: 4px; }
.nav-tab {
  padding: 12px 20px; background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,.5); font-family: var(--font); font-size: .875rem; font-weight: 500;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: all 180ms ease;
}
.nav-tab:hover  { color: rgba(255,255,255,.85); }
.nav-tab.active { color: #fff; border-bottom-color: var(--accent); }
</style>
