<template>
  <div class="tienda">

    <!-- ── Store header ───────────────────────────────────────────────────────── -->
    <header class="store-header">
      <div class="store-header-inner">
        <div class="store-brand">
          <span class="store-logo">🏆</span>
          <div>
            <h1 class="store-title">Sports Store</h1>
            <p class="store-sub">Equipamiento deportivo de primera</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost hist-btn" @click="showHistory = true">
            📜 Mis compras
          </button>
          <button class="cart-fab" @click="cartOpen = true">
            🛒
            <span v-if="cartCount > 0" class="cart-bubble">{{ cartCount }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ── Filters bar ────────────────────────────────────────────────────────── -->
    <div class="filters-bar">
      <div class="filters-inner">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input v-model="search" class="input search-input"
                 placeholder="Buscar productos…"
                 @input="onSearch" />
          <button v-if="search" class="clear-btn" @click="search=''; fetchProducts()">✕</button>
        </div>

        <div class="cats-row">
          <button
            v-for="cat in ['Todos', ...categorias]"
            :key="cat"
            :class="['cat-pill', { active: activeCat === (cat === 'Todos' ? '' : cat) }]"
            @click="setCat(cat === 'Todos' ? '' : cat)"
          >
            {{ cat }}
          </button>
        </div>

        <p class="result-count">{{ pagination.total }} producto{{ pagination.total !== 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- ── Product grid ───────────────────────────────────────────────────────── -->
    <main class="store-main">

      <!-- Loading skeleton -->
      <div v-if="loading" class="products-grid">
        <div v-for="i in 8" :key="i" class="skeleton-card">
          <div class="skel skel-img"></div>
          <div style="padding:14px;display:flex;flex-direction:column;gap:8px">
            <div class="skel" style="height:14px;width:70%"></div>
            <div class="skel" style="height:11px;width:90%"></div>
            <div class="skel" style="height:11px;width:55%"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="fetchError" class="state-box">
        <span style="font-size:2rem">⚠️</span>
        <p>{{ fetchError }}</p>
        <button class="btn btn-ghost btn-sm" @click="fetchProducts">Reintentar</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!products.length" class="state-box">
        <span style="font-size:2.5rem">📭</span>
        <p>No se encontraron productos{{ search ? ` para "${search}"` : '' }}.</p>
        <button v-if="activeCat || search" class="btn btn-ghost btn-sm"
                @click="search=''; activeCat=''; fetchProducts()">Ver todos</button>
      </div>

      <!-- Grid -->
      <div v-else class="products-grid">
        <ProductCard
          v-for="p in products"
          :key="p.id"
          :producto="p"
          :cartQty="cartQtyFor(p.id)"
          :adding="addingId === p.id"
          @add="addToCart"
          @increase="increaseItem"
          @decrease="decreaseItem"
        />
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" :disabled="page===1" @click="changePage(page-1)">← Anterior</button>
        <div class="page-numbers">
          <button v-for="p in pageRange" :key="p"
                  :class="['page-btn',{active:p===page}]"
                  @click="changePage(p)">{{ p }}</button>
        </div>
        <button class="btn btn-ghost btn-sm" :disabled="page===pagination.totalPages" @click="changePage(page+1)">Siguiente →</button>
      </div>

    </main>

    <!-- ── Cart Drawer ─────────────────────────────────────────────────────────── -->
    <CartDrawer
      :open="cartOpen"
      :items="cartItems"
      :total="cartTotal"
      :updating="cartUpdating"
      @close="cartOpen = false"
      @increase="increaseItem"
      @decrease="decreaseItem"
      @remove="removeCartItem"
      @checkout="openCheckout"
    />

    <!-- ── Checkout Modal ──────────────────────────────────────────────────────── -->
    <CheckoutModal
      v-if="showCheckout"
      :items="cartItems"
      :total="cartTotal"
      :processing="checkingOut"
      @close="showCheckout = false"
      @confirm="doCheckout"
    />

    <!-- ── Success Modal ───────────────────────────────────────────────────────── -->
    <OrderSuccessModal
      v-if="lastOrder"
      :orden="lastOrder"
      @close="lastOrder = null"
      @view-history="lastOrder = null; showHistory = true"
    />

    <!-- ── History Modal ───────────────────────────────────────────────────────── -->
    <OrderHistory
      v-if="showHistory"
      @close="showHistory = false"
    />

    <!-- ── Toasts ──────────────────────────────────────────────────────────────── -->
    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" :class="`toast ${t.type}`">
        <span>{{ t.type === 'success' ? '✅' : '❌' }}</span>
        {{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { productosApi, carritoApi, ordenesApi } from '../services/tienda.js';
import ProductCard      from '../components/ProductCard.vue';
import CartDrawer       from '../components/CartDrawer.vue';
import CheckoutModal    from '../components/CheckoutModal.vue';
import OrderSuccessModal from '../components/OrderSuccessModal.vue';
import OrderHistory     from '../components/OrderHistory.vue';

// ── Session ID (simula usuario anónimo) ─────────────────────────────────────
const SESSION_KEY = 'sports_session_id';
const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};
const sessionId = getSessionId();

// ── Products state ───────────────────────────────────────────────────────────
const products   = ref([]);
const categorias = ref([]);
const loading    = ref(false);
const fetchError = ref('');
const search     = ref('');
const activeCat  = ref('');
const page       = ref(1);
const pagination = ref({ total: 0, totalPages: 1 });
const addingId   = ref(null);

const fetchProducts = async () => {
  loading.value    = true;
  fetchError.value = '';
  try {
    const res = await productosApi.getAll({
      search: search.value, categoria: activeCat.value,
      page: page.value, limit: 8,
    });
    products.value   = res.data;
    categorias.value = res.categorias || [];
    pagination.value = res.pagination;
  } catch (e) {
    fetchError.value = e.message;
  } finally {
    loading.value = false;
  }
};

let debTimer = null;
const onSearch = () => {
  clearTimeout(debTimer);
  debTimer = setTimeout(() => { page.value = 1; fetchProducts(); }, 350);
};

const setCat = (cat) => { activeCat.value = cat; page.value = 1; fetchProducts(); };
const changePage = (p) => { page.value = p; fetchProducts(); };

const pageRange = computed(() => {
  const tot = pagination.value.totalPages, cur = page.value;
  const arr = [];
  for (let i = Math.max(1, cur-2); i <= Math.min(tot, cur+2); i++) arr.push(i);
  return arr;
});

// ── Cart state ───────────────────────────────────────────────────────────────
const cartItems   = ref([]);
const cartTotal   = ref(0);
const cartOpen    = ref(false);
const cartUpdating = ref(false);

const cartCount = computed(() => cartItems.value.reduce((s, i) => s + i.cantidad, 0));
const cartQtyFor = (productId) => cartItems.value.find(i => i.producto_id === productId)?.cantidad || 0;

const fetchCart = async () => {
  try {
    const res = await carritoApi.get(sessionId);
    cartItems.value = res.data;
    cartTotal.value = res.total;
  } catch {}
};

const addToCart = async (prod) => {
  addingId.value = prod.id;
  try {
    const res = await carritoApi.add(sessionId, { producto_id: prod.id, cantidad: 1 });
    cartItems.value = res.data;
    cartTotal.value = res.total;
    toast(res.message || 'Agregado al carrito.', 'success');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    addingId.value = null;
  }
};

const increaseItem = async (item) => {
  const cartItem = cartItems.value.find(i => i.producto_id === (item.producto_id || item.id));
  if (!cartItem) return addToCart(item);
  cartUpdating.value = true;
  try {
    const res = await carritoApi.update(sessionId, cartItem.id, { cantidad: cartItem.cantidad + 1 });
    cartItems.value = res.data; cartTotal.value = res.total;
  } catch (e) { toast(e.message, 'error'); }
  finally { cartUpdating.value = false; }
};

const decreaseItem = async (item) => {
  const cartItem = cartItems.value.find(i => i.producto_id === (item.producto_id || item.id));
  if (!cartItem) return;
  if (cartItem.cantidad <= 1) return removeCartItem(cartItem);
  cartUpdating.value = true;
  try {
    const res = await carritoApi.update(sessionId, cartItem.id, { cantidad: cartItem.cantidad - 1 });
    cartItems.value = res.data; cartTotal.value = res.total;
  } catch (e) { toast(e.message, 'error'); }
  finally { cartUpdating.value = false; }
};

const removeCartItem = async (item) => {
  cartUpdating.value = true;
  try {
    const res = await carritoApi.remove(sessionId, item.id);
    cartItems.value = res.data; cartTotal.value = res.total;
    toast('Producto eliminado del carrito.', 'success');
  } catch (e) { toast(e.message, 'error'); }
  finally { cartUpdating.value = false; }
};

// ── Checkout ─────────────────────────────────────────────────────────────────
const showCheckout = ref(false);
const checkingOut  = ref(false);
const lastOrder    = ref(null);

const openCheckout = () => { cartOpen.value = false; showCheckout.value = true; };

const doCheckout = async ({ nombre, email, notas }) => {
  checkingOut.value = true;
  try {
    const res = await ordenesApi.checkout({
      session_id: sessionId,
      cliente_nombre: nombre,
      cliente_email: email,
      notas,
    });
    showCheckout.value = false;
    cartItems.value    = [];
    cartTotal.value    = 0;
    lastOrder.value    = res.data;
    // Recargar stock actualizado
    fetchProducts();
    toast('¡Pedido realizado! Revisa tu email.', 'success');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    checkingOut.value = false;
  }
};

// ── History ──────────────────────────────────────────────────────────────────
const showHistory = ref(false);

// ── Toasts ───────────────────────────────────────────────────────────────────
const toasts = ref([]);
const toast = (msg, type = 'success') => {
  const id = Date.now();
  toasts.value.push({ id, msg, type });
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 3500);
};

onMounted(() => { fetchProducts(); fetchCart(); });
</script>

<style scoped>
.tienda { min-height: 100vh; display: flex; flex-direction: column; }

/* Header */
.store-header { background: var(--text); color: #fff; padding: 0 24px; position: sticky; top: 0; z-index: 10; }
.store-header-inner { max-width: 1200px; margin: 0 auto; display: flex;
  align-items: center; justify-content: space-between; padding: 16px 0; }
.store-brand { display: flex; align-items: center; gap: 12px; }
.store-logo  { font-size: 1.8rem; }
.store-title { font-size: 1.1rem; font-weight: 700; line-height: 1.1; }
.store-sub   { font-size: .72rem; opacity: .5; margin-top: 2px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.hist-btn { color: rgba(255,255,255,.7) !important; border-color: rgba(255,255,255,.2) !important; font-size: .8rem; }
.hist-btn:hover { color: #fff !important; background: rgba(255,255,255,.1) !important; }

/* Cart FAB */
.cart-fab {
  position: relative; width: 44px; height: 44px; border-radius: 50%;
  background: var(--accent); color: #fff; border: none; cursor: pointer;
  font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
  transition: all var(--transition); box-shadow: 0 2px 8px rgba(45,106,79,.4);
}
.cart-fab:hover { background: var(--accent-dk); transform: scale(1.05); }
.cart-bubble {
  position: absolute; top: -4px; right: -4px;
  background: var(--danger); color: #fff; border-radius: 99px;
  min-width: 18px; height: 18px; font-size: .65rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
  border: 2px solid var(--text);
}

/* Filters bar */
.filters-bar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 24px; }
.filters-inner { max-width: 1200px; margin: 0 auto; padding: 14px 0; display: flex; flex-direction: column; gap: 12px; }
.search-wrap { position: relative; max-width: 400px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; font-size: .85rem; }
.search-input { padding-left: 36px !important; padding-right: 32px !important; }
.clear-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: .85rem; }

.cats-row { display: flex; flex-wrap: wrap; gap: 7px; }
.cat-pill {
  padding: 5px 14px; border-radius: 99px; font-size: .78rem; font-weight: 600;
  border: 1.5px solid var(--border); background: transparent; cursor: pointer;
  transition: all var(--transition); color: var(--text-muted);
}
.cat-pill:hover  { border-color: var(--accent); color: var(--accent); }
.cat-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.result-count { font-size: .75rem; color: var(--text-muted); font-family: var(--mono); }

/* Main */
.store-main { flex: 1; padding: 28px 24px; max-width: 1200px; width: 100%; margin: 0 auto; }

/* Grid */
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }

/* Skeleton */
.skeleton-card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; }
.skel { background: linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px; }
.skel-img { aspect-ratio: 4/3; border-radius: 0; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* State boxes */
.state-box { display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 64px 24px; text-align: center; color: var(--text-muted); }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 32px; }
.page-numbers { display: flex; gap: 4px; }
.page-btn { width: 32px; height: 32px; border: 1.5px solid var(--border); border-radius: 6px;
  background: transparent; cursor: pointer; font-family: var(--font); font-size: .83rem;
  transition: all var(--transition); }
.page-btn.active  { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.page-btn:hover:not(.active) { background: var(--bg); }
</style>
