<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal history-modal">
      <div class="modal-header">
        <h2>📜 Historial de Compras</h2>
        <button class="btn btn-ghost btn-icon" @click="$emit('close')">✕</button>
      </div>

      <!-- Email search -->
      <div class="history-search">
        <div class="field" style="flex:1">
          <label class="label">Buscar por email</label>
          <input v-model="email" class="input" placeholder="tu@email.com"
                 @keyup.enter="fetchHistory" />
        </div>
        <button class="btn btn-primary btn-sm" style="align-self:flex-end;margin-bottom:1px"
                :disabled="loading" @click="fetchHistory">
          {{ loading ? '…' : 'Buscar' }}
        </button>
      </div>

      <!-- States -->
      <div v-if="loading" class="h-state">
        <div class="spinner"></div>
      </div>
      <div v-else-if="error" class="h-state" style="color:var(--danger)">{{ error }}</div>
      <div v-else-if="searched && !orders.length" class="h-state">
        No se encontraron órdenes para <strong>{{ email }}</strong>.
      </div>

      <!-- Orders -->
      <div v-else-if="orders.length" class="orders-list">
        <details v-for="o in orders" :key="o.id" class="order-card">
          <summary class="order-summary-row">
            <div class="order-meta">
              <span class="order-num">#{{ String(o.id).padStart(6,'0') }}</span>
              <span class="order-date">{{ fmtDate(o.created_at) }}</span>
            </div>
            <div class="order-right">
              <span class="order-total">${{ Number(o.total).toFixed(2) }}</span>
              <span :class="`badge ${o.estado === 'completada' ? 'badge-green' : 'badge-gray'}`">
                {{ o.estado }}
              </span>
            </div>
          </summary>
          <ul class="order-items-list">
            <li v-for="item in o.items" :key="item.id" class="oi">
              <span>{{ item.nombre }} <em>×{{ item.cantidad }}</em></span>
              <span style="font-family:var(--mono)">${{ Number(item.subtotal).toFixed(2) }}</span>
            </li>
          </ul>
        </details>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="$emit('close')">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ordenesApi } from '../services/tienda.js';

defineEmits(['close']);

const email    = ref('');
const orders   = ref([]);
const loading  = ref(false);
const error    = ref('');
const searched = ref(false);

const fetchHistory = async () => {
  if (!email.value) return;
  loading.value  = true;
  error.value    = '';
  searched.value = false;
  try {
    const res = await ordenesApi.history(email.value);
    orders.value   = res.data;
    searched.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-ES', { dateStyle: 'medium' }) + ' ' +
  new Date(d).toLocaleTimeString('es-ES', { timeStyle: 'short' });
</script>

<style scoped>
.history-modal { max-width: 520px; }
.history-search { display: flex; gap: 10px; padding: 16px 24px 0; align-items: flex-end; }
.h-state { padding: 40px; text-align: center; color: var(--text-muted);
  display: flex; flex-direction: column; align-items: center; gap: 10px; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.orders-list { max-height: 420px; overflow-y: auto; padding: 14px 20px; display: flex; flex-direction: column; gap: 8px; }

.order-card { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.order-summary-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; cursor: pointer; list-style: none;
  background: var(--bg); transition: background var(--transition);
}
.order-summary-row:hover { background: var(--border); }
.order-meta { display: flex; align-items: center; gap: 10px; }
.order-num  { font-family: var(--mono); font-weight: 700; font-size: .88rem; }
.order-date { font-size: .78rem; color: var(--text-muted); }
.order-right { display: flex; align-items: center; gap: 10px; }
.order-total { font-family: var(--mono); font-weight: 700; color: var(--accent-dk); }

.order-items-list { list-style: none; padding: 10px 16px; display: flex; flex-direction: column; gap: 5px; background: var(--surface); }
.oi { display: flex; justify-content: space-between; font-size: .82rem; }
.oi em { color: var(--text-muted); font-style: normal; }
</style>
