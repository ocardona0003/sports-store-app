<template>
  <article class="product-card" :class="{ 'out-of-stock': producto.stock === 0 }">
    <div class="card-img-wrap">
      <img :src="producto.imagen_url" :alt="producto.nombre" class="card-img" loading="lazy"
           @error="e => e.target.src='https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80'" />
      <span class="cat-badge">{{ producto.categoria }}</span>
      <span v-if="producto.stock === 0" class="out-badge">Sin stock</span>
      <span v-else-if="producto.stock <= 5" class="low-badge">¡Últimas {{ producto.stock }}!</span>
    </div>

    <div class="card-body">
      <h3 class="card-name">{{ producto.nombre }}</h3>
      <p class="card-desc">{{ producto.descripcion }}</p>

      <div class="card-footer">
        <span class="card-price">${{ Number(producto.precio).toFixed(2) }}</span>

        <div class="card-actions">
          <button
            v-if="cartQty === 0"
            class="btn btn-primary btn-sm add-btn"
            :disabled="producto.stock === 0 || adding"
            @click="$emit('add', producto)"
          >
            {{ adding ? '…' : '+ Agregar' }}
          </button>

          <div v-else class="qty-ctrl">
            <button class="qty-btn" @click="$emit('decrease', producto)">−</button>
            <span class="qty-num">{{ cartQty }}</span>
            <button class="qty-btn" :disabled="cartQty >= producto.stock" @click="$emit('increase', producto)">＋</button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  producto: { type: Object, required: true },
  cartQty:  { type: Number, default: 0 },
  adding:   { type: Boolean, default: false },
});
defineEmits(['add', 'increase', 'decrease']);
</script>

<style scoped>
.product-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
  display: flex; flex-direction: column;
  transition: box-shadow var(--transition), transform var(--transition);
}
.product-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.out-of-stock { opacity: .6; }

.card-img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; background: var(--bg); }
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
.product-card:hover .card-img { transform: scale(1.04); }

.cat-badge {
  position: absolute; top: 10px; left: 10px;
  background: rgba(28,27,24,.75); color: #fff;
  font-size: .7rem; font-weight: 600; letter-spacing: .05em;
  padding: 3px 9px; border-radius: 99px; backdrop-filter: blur(4px);
}
.out-badge {
  position: absolute; top: 10px; right: 10px;
  background: var(--danger); color: #fff;
  font-size: .7rem; font-weight: 700; padding: 3px 9px; border-radius: 99px;
}
.low-badge {
  position: absolute; top: 10px; right: 10px;
  background: var(--warn); color: #fff;
  font-size: .7rem; font-weight: 700; padding: 3px 9px; border-radius: 99px;
}

.card-body { padding: 16px; display: flex; flex-direction: column; flex: 1; gap: 6px; }
.card-name { font-size: .95rem; font-weight: 600; line-height: 1.3; }
.card-desc { font-size: .8rem; color: var(--text-muted); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
.card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.card-price { font-size: 1.1rem; font-weight: 700; font-family: var(--mono); color: var(--accent-dk); }

/* qty controls */
.qty-ctrl { display: flex; align-items: center; gap: 0; border: 1.5px solid var(--accent); border-radius: 6px; overflow: hidden; }
.qty-btn { width: 30px; height: 30px; border: none; background: var(--accent-lt); color: var(--accent-dk);
  font-size: 1rem; cursor: pointer; transition: background var(--transition); font-weight: 700; }
.qty-btn:hover:not(:disabled) { background: var(--accent); color: #fff; }
.qty-btn:disabled { opacity: .4; cursor: not-allowed; }
.qty-num { min-width: 28px; text-align: center; font-size: .875rem; font-weight: 600;
  font-family: var(--mono); background: var(--surface); }

.add-btn { border-radius: 6px !important; }
</style>
