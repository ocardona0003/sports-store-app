<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal success-modal">
      <div style="text-align:center;padding:36px 32px 28px">
        <div class="success-icon">✅</div>
        <h2 style="margin:14px 0 6px;font-size:1.2rem">¡Pedido confirmado!</h2>
        <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:4px">
          Pedido <strong style="font-family:var(--mono)">#{{ String(orden.id).padStart(6,'0') }}</strong>
        </p>
        <p style="color:var(--text-muted);font-size:.83rem">
          Confirmación enviada a <strong>{{ orden.cliente_email }}</strong>
        </p>
      </div>

      <div class="order-items">
        <p class="items-label">Resumen</p>
        <ul class="items-list">
          <li v-for="item in orden.items" :key="item.id" class="order-item">
            <span>{{ item.nombre }} <em>×{{ item.cantidad }}</em></span>
            <span style="font-family:var(--mono)">${{ Number(item.subtotal).toFixed(2) }}</span>
          </li>
        </ul>
        <div class="order-total">
          <span>Total pagado</span>
          <span style="font-family:var(--mono);color:var(--accent-dk)">${{ Number(orden.total).toFixed(2) }}</span>
        </div>
      </div>

      <div style="padding:20px 28px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid var(--border)">
        <button class="btn btn-ghost btn-sm" @click="$emit('view-history')">Ver historial</button>
        <button class="btn btn-primary" @click="$emit('close')">Seguir comprando</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ orden: { type: Object, required: true } });
defineEmits(['close', 'view-history']);
</script>

<style scoped>
.success-modal { max-width: 420px; }
.success-icon { font-size: 3rem; animation: pop .4s cubic-bezier(.34,1.6,.64,1); }
@keyframes pop { from { transform: scale(.4); opacity:0; } to { transform: scale(1); opacity:1; } }

.order-items { padding: 0 28px 16px; }
.items-label { font-size:.72rem;font-weight:700;color:var(--text-muted);
  text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px; }
.items-list { list-style:none; display:flex;flex-direction:column;gap:6px; }
.order-item { display:flex;justify-content:space-between;font-size:.83rem; }
.order-item em { color:var(--text-muted);font-style:normal; }
.order-total { display:flex;justify-content:space-between;font-weight:700;
  padding-top:10px;border-top:1px solid var(--border);font-size:.95rem;margin-top:8px; }
</style>
