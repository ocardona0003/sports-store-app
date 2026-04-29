<template>
  <!-- Backdrop -->
  <div v-if="open" class="drawer-backdrop" @click="$emit('close')"></div>

  <!-- Drawer panel -->
  <aside class="drawer" :class="{ 'drawer-open': open }">
    <div class="drawer-header">
      <div>
        <h2 class="drawer-title">🛒 Mi Carrito</h2>
        <p class="drawer-sub">{{ items.length }} producto{{ items.length !== 1 ? 's' : '' }}</p>
      </div>
      <button class="btn btn-ghost btn-icon" @click="$emit('close')">✕</button>
    </div>

    <!-- Empty -->
    <div v-if="!items.length" class="cart-empty">
      <span class="empty-icon">🛍️</span>
      <p>Tu carrito está vacío.</p>
      <button class="btn btn-ghost btn-sm" @click="$emit('close')">Ver productos</button>
    </div>

    <!-- Items -->
    <div v-else class="drawer-body">
      <ul class="cart-list">
        <li v-for="item in items" :key="item.id" class="cart-item">
          <img :src="item.imagen_url" :alt="item.nombre" class="item-img"
               @error="e => e.target.src='https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&q=60'" />
          <div class="item-info">
            <p class="item-name">{{ item.nombre }}</p>
            <p class="item-price">${{ Number(item.precio).toFixed(2) }}</p>
          </div>
          <div class="item-controls">
            <div class="qty-ctrl">
              <button class="qty-btn" :disabled="updating" @click="$emit('decrease', item)">−</button>
              <span class="qty-num">{{ item.cantidad }}</span>
              <button class="qty-btn" :disabled="updating || item.cantidad >= item.stock" @click="$emit('increase', item)">＋</button>
            </div>
            <button class="remove-btn" :disabled="updating" @click="$emit('remove', item)" title="Eliminar">🗑</button>
          </div>
          <div class="item-subtotal">${{ (item.precio * item.cantidad).toFixed(2) }}</div>
        </li>
      </ul>
    </div>

    <!-- Footer totales + checkout -->
    <div v-if="items.length" class="drawer-footer">
      <div class="total-row">
        <span>Subtotal</span>
        <span class="total-price">${{ total.toFixed(2) }}</span>
      </div>
      <button class="btn btn-primary checkout-btn" @click="$emit('checkout')">
        Finalizar compra →
      </button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  open:     { type: Boolean, default: false },
  items:    { type: Array,   default: () => [] },
  total:    { type: Number,  default: 0 },
  updating: { type: Boolean, default: false },
});
defineEmits(['close', 'increase', 'decrease', 'remove', 'checkout']);
</script>

<style scoped>
.drawer-backdrop {
  position: fixed; inset: 0; background: rgba(28,27,24,.4);
  backdrop-filter: blur(2px); z-index: 200;
  animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(420px, 100vw);
  background: var(--surface); z-index: 201;
  display: flex; flex-direction: column;
  box-shadow: -6px 0 32px rgba(0,0,0,.12);
  transform: translateX(100%);
  transition: transform .28s cubic-bezier(.4,0,.2,1);
}
.drawer-open { transform: translateX(0); }

.drawer-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-start; justify-content: space-between;
}
.drawer-title { font-size: 1.05rem; font-weight: 700; }
.drawer-sub   { font-size: .78rem; color: var(--text-muted); margin-top: 2px; }

.cart-empty { flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; color: var(--text-muted); padding: 32px; text-align: center; }
.empty-icon { font-size: 3rem; }

.drawer-body { flex: 1; overflow-y: auto; padding: 12px 16px; }

.cart-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
.cart-item {
  display: grid; grid-template-columns: 56px 1fr auto auto;
  align-items: center; gap: 12px;
  padding: 12px 10px; border-radius: var(--radius);
  transition: background var(--transition);
}
.cart-item:hover { background: var(--bg); }

.item-img { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); }
.item-info { min-width: 0; }
.item-name  { font-size: .83rem; font-weight: 600; line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-price { font-size: .78rem; color: var(--text-muted); font-family: var(--mono); margin-top: 2px; }

.item-controls { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.qty-ctrl { display: flex; align-items: center; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
.qty-btn  { width: 24px; height: 24px; border: none; background: var(--bg); color: var(--text);
  cursor: pointer; font-size: .9rem; font-weight: 700; transition: background var(--transition); }
.qty-btn:hover:not(:disabled) { background: var(--accent-lt); color: var(--accent-dk); }
.qty-btn:disabled { opacity: .35; cursor: not-allowed; }
.qty-num  { width: 28px; text-align: center; font-size: .8rem; font-weight: 600;
  font-family: var(--mono); }
.remove-btn { background: none; border: none; cursor: pointer; font-size: .85rem;
  opacity: .5; transition: opacity var(--transition); padding: 2px 4px; }
.remove-btn:hover { opacity: 1; }

.item-subtotal { font-size: .88rem; font-weight: 700; font-family: var(--mono);
  color: var(--accent-dk); min-width: 58px; text-align: right; }

.drawer-footer {
  padding: 16px 20px 20px; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 12px;
}
.total-row { display: flex; justify-content: space-between; align-items: center;
  font-size: .9rem; font-weight: 600; }
.total-price { font-size: 1.25rem; font-family: var(--mono); color: var(--accent-dk); }
.checkout-btn { width: 100%; justify-content: center; padding: 12px 20px; font-size: .95rem; }
</style>
