<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal checkout-modal">

      <!-- Header -->
      <div class="modal-header">
        <div>
          <h2>📋 Finalizar Compra</h2>
          <p style="font-size:.8rem;color:var(--text-muted);margin-top:3px">
            {{ items.length }} producto{{ items.length !== 1 ? 's' : '' }} · Total:
            <strong style="color:var(--accent-dk);font-family:var(--mono)">${{ total.toFixed(2) }}</strong>
          </p>
        </div>
        <button class="btn btn-ghost btn-icon" @click="$emit('close')">✕</button>
      </div>

      <div class="checkout-layout">

        <!-- Form -->
        <form class="checkout-form" @submit.prevent="handleSubmit">
          <p class="section-label">Datos del comprador</p>

          <div class="field">
            <label class="label">Nombre completo *</label>
            <input v-model="form.nombre" class="input" :class="{error:e.nombre}"
                   placeholder="Ana García" />
            <span v-if="e.nombre" class="error-msg">{{ e.nombre }}</span>
          </div>

          <div class="field">
            <label class="label">Email (se envía confirmación) *</label>
            <input v-model="form.email" type="email" class="input" :class="{error:e.email}"
                   placeholder="ana@ejemplo.com" />
            <span v-if="e.email" class="error-msg">{{ e.email }}</span>
          </div>

          <div class="field">
            <label class="label">Notas (opcional)</label>
            <textarea v-model="form.notas" class="input" rows="2"
                      placeholder="Instrucciones especiales…" style="resize:vertical"></textarea>
          </div>

          <!-- Order summary (mobile) -->
          <div class="order-summary">
            <p class="section-label">Resumen del pedido</p>
            <ul class="summary-list">
              <li v-for="item in items" :key="item.id" class="summary-item">
                <span class="summary-name">{{ item.nombre }} <em>×{{ item.cantidad }}</em></span>
                <span class="summary-sub">${{ (item.precio * item.cantidad).toFixed(2) }}</span>
              </li>
            </ul>
            <div class="summary-total">
              <span>Total</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
          </div>

          <div class="modal-footer" style="padding:0;border:none;margin-top:4px">
            <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="processing">
              {{ processing ? '⏳ Procesando…' : '✅ Confirmar pedido' }}
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  items:      { type: Array,  default: () => [] },
  total:      { type: Number, default: 0 },
  processing: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'confirm']);

const form = ref({ nombre: '', email: '', notas: '' });
const e    = ref({});

const handleSubmit = () => {
  e.value = {};
  if (!form.value.nombre.trim()) e.value.nombre = 'El nombre es requerido.';
  if (!form.value.email)         e.value.email  = 'El email es requerido.';
  else if (!/\S+@\S+\.\S+/.test(form.value.email)) e.value.email = 'Email inválido.';
  if (Object.keys(e.value).length) return;
  emit('confirm', { ...form.value });
};
</script>

<style scoped>
.checkout-modal { max-width: 500px; }
.checkout-layout { padding: 0; }
.checkout-form { display: flex; flex-direction: column; gap: 14px; padding: 22px 28px 24px; }
.section-label { font-size: .72rem; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .06em; margin-bottom: -4px; }

.order-summary {
  background: var(--bg); border-radius: var(--radius); padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border);
}
.summary-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.summary-item { display: flex; justify-content: space-between; font-size: .83rem; }
.summary-name { color: var(--text); }
.summary-name em { color: var(--text-muted); font-style: normal; }
.summary-sub  { font-family: var(--mono); font-size: .8rem; }
.summary-total { display: flex; justify-content: space-between; font-weight: 700;
  font-size: .95rem; padding-top: 10px; border-top: 1px solid var(--border-md);
  font-family: var(--mono); }
</style>
