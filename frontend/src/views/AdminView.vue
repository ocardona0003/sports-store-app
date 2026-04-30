<template>
  <div class="admin-wrap">

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="sidebar-logo">⚙️</span>
        <div>
          <p class="sidebar-title">Admin Panel</p>
          <p class="sidebar-sub">Sports Store</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <p class="nav-section-label">Catálogo</p>
        <button :class="['nav-item', { active: section === 'productos' }]"
                @click="section = 'productos'">
          <span>📦</span> Productos
          <span class="nav-badge">{{ productStats.total }}</span>
        </button>
        <button :class="['nav-item', { active: section === 'categorias' }]"
                @click="section = 'categorias'">
          <span>🗂️</span> Categorías
          <span class="nav-badge">{{ categorias.length }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="stat-card">
          <p class="stat-label">Activos</p>
          <p class="stat-val">{{ productStats.activos }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Sin stock</p>
          <p class="stat-val warn">{{ productStats.sinStock }}</p>
        </div>
      </div>
    </aside>

    <!-- ── Main content ────────────────────────────────────────────────────── -->
    <div class="admin-main">

      <!-- ══ PRODUCTOS ══════════════════════════════════════════════════════ -->
      <section v-if="section === 'productos'">
        <div class="admin-section-header">
          <div>
            <h1 class="admin-section-title">📦 Productos</h1>
            <p class="admin-section-sub">Gestión completa del catálogo deportivo</p>
          </div>
          <button class="btn btn-primary" @click="openCreateProducto">
            ＋ Nuevo producto
          </button>
        </div>

        <!-- Toolbar -->
        <div class="admin-toolbar">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input v-model="pSearch" class="input search-input"
                   placeholder="Buscar productos…" @input="debounceP" />
            <button v-if="pSearch" class="clear-btn" @click="pSearch=''; fetchProductos()">✕</button>
          </div>
          <select v-model="pCat" class="select filter-select" @change="fetchProductos">
            <option value="">Todas las categorías</option>
            <option v-for="c in categorias" :key="c.id" :value="c.nombre">{{ c.nombre }}</option>
          </select>
          <label class="toggle-label">
            <input type="checkbox" v-model="pShowAll" @change="fetchProductos" />
            Ver inactivos
          </label>
        </div>

        <!-- Grid de productos admin -->
        <div v-if="pLoading" class="admin-grid">
          <div v-for="i in 6" :key="i" class="skeleton-admin-card">
            <div class="skel skel-img"></div>
            <div style="padding:12px;display:flex;flex-direction:column;gap:6px">
              <div class="skel" style="height:12px;width:70%"></div>
              <div class="skel" style="height:10px;width:45%"></div>
            </div>
          </div>
        </div>

        <div v-else-if="!productos.length" class="admin-empty">
          <span>📭</span>
          <p>No hay productos{{ pSearch ? ` para "${pSearch}"` : '' }}.</p>
        </div>

        <div v-else class="admin-grid">
          <article
            v-for="p in productos" :key="p.id"
            :class="['admin-product-card', { inactive: !p.activo }]"
          >
            <div class="apc-img-wrap">
              <img :src="p.imagen_url || 'https://placehold.co/400x260?text=Sin+imagen'"
                   :alt="p.nombre" class="apc-img"
                   @error="e => e.target.src='https://placehold.co/400x260?text=Sin+imagen'" />
              <span :class="['apc-status', p.activo ? 'status-active' : 'status-inactive']">
                {{ p.activo ? 'Activo' : 'Inactivo' }}
              </span>
              <span v-if="p.stock === 0" class="apc-nostock">Sin stock</span>
              <span v-else-if="p.stock <= 5" class="apc-lowstock">¡Últimas {{ p.stock }}!</span>
            </div>

            <div class="apc-body">
              <div class="apc-cat">{{ p.categoria }}</div>
              <h3 class="apc-name">{{ p.nombre }}</h3>
              <div class="apc-meta">
                <span class="apc-price">${{ Number(p.precio).toFixed(2) }}</span>
                <span class="apc-stock">
                  <span :style="{color: p.stock === 0 ? 'var(--danger)' : p.stock <= 5 ? 'var(--warn)' : 'var(--accent)'}">
                    {{ p.stock }} uds
                  </span>
                </span>
              </div>
            </div>

            <div class="apc-actions">
              <button class="btn btn-ghost btn-sm" @click="openEditProducto(p)">✏️ Editar</button>
              <button class="btn btn-danger btn-sm" @click="confirmDeleteProducto(p)">🗑 Eliminar</button>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div v-if="pPagination.totalPages > 1" class="admin-pagination">
          <button class="btn btn-ghost btn-sm" :disabled="pPage===1" @click="pPage--;fetchProductos()">← Ant.</button>
          <span class="page-info">Pág. {{ pPage }} / {{ pPagination.totalPages }}</span>
          <button class="btn btn-ghost btn-sm" :disabled="pPage===pPagination.totalPages" @click="pPage++;fetchProductos()">Sig. →</button>
        </div>
      </section>

      <!-- ══ CATEGORÍAS ══════════════════════════════════════════════════════ -->
      <section v-if="section === 'categorias'">
        <div class="admin-section-header">
          <div>
            <h1 class="admin-section-title">🗂️ Categorías</h1>
            <p class="admin-section-sub">Organiza los productos por categoría</p>
          </div>
          <button class="btn btn-primary" @click="openCreateCat">＋ Nueva categoría</button>
        </div>

        <div class="cat-table-card">
          <table class="cat-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th class="center-col">Estado</th>
                <th class="center-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="catLoading">
                <td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">Cargando…</td>
              </tr>
              <tr v-else-if="!categorias.length">
                <td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">Sin categorías</td>
              </tr>
              <tr v-for="cat in categorias" :key="cat.id" class="cat-row">
                <td class="mono-text" style="color:var(--text-muted)">#{{ cat.id }}</td>
                <td><strong>{{ cat.nombre }}</strong></td>
                <td style="color:var(--text-muted);font-size:.85rem">{{ cat.descripcion || '—' }}</td>
                <td class="center-col">
                  <span :class="cat.activo ? 'badge badge-green' : 'badge badge-gray'">
                    {{ cat.activo ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="center-col">
                  <div style="display:flex;gap:6px;justify-content:center">
                    <button class="btn btn-ghost btn-icon" @click="openEditCat(cat)">✏️</button>
                    <button class="btn btn-danger btn-icon" @click="confirmDeleteCat(cat)">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- ── Modals ──────────────────────────────────────────────────────────── -->
    <ProductoForm
      v-if="showProductoForm"
      :producto="selectedProducto"
      :categorias="categorias"
      :saving="saving"
      @close="showProductoForm = false"
      @submit="handleProductoSubmit"
    />

    <CategoriaForm
      v-if="showCatForm"
      :categoria="selectedCat"
      :saving="saving"
      @close="showCatForm = false"
      @submit="handleCatSubmit"
    />

    <!-- Confirm delete -->
    <div v-if="confirmItem" class="overlay" @click.self="confirmItem=null">
      <div class="confirm-box">
        <div class="icon">🗑️</div>
        <h3>¿Eliminar {{ confirmItem._type }}?</h3>
        <p><strong>{{ confirmItem.nombre }}</strong> será desactivado.</p>
        <div class="confirm-actions">
          <button class="btn btn-ghost" @click="confirmItem=null">Cancelar</button>
          <button class="btn btn-danger" :disabled="deleting" @click="handleDelete">
            {{ deleting ? 'Eliminando…' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" :class="`toast ${t.type}`">
        <span>{{ t.type === 'success' ? '✅' : '❌' }}</span> {{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { categoriasApi, adminProductosApi } from '../services/admin.js';
import ProductoForm  from '../components/admin/ProductoForm.vue';
import CategoriaForm from '../components/admin/CategoriaForm.vue';

// ── Section nav ────────────────────────────────────────────────────────────
const section = ref('productos');

// ── Categorías state ────────────────────────────────────────────────────────
const categorias  = ref([]);
const catLoading  = ref(false);
const showCatForm = ref(false);
const selectedCat = ref(null);

const fetchCategorias = async () => {
  catLoading.value = true;
  try {
    const res = await categoriasApi.getAll({ includeInactive: 'true' });
    categorias.value = res.data;
  } catch (e) { toast(e.message, 'error'); }
  finally { catLoading.value = false; }
};

const openCreateCat = () => { selectedCat.value = null; showCatForm.value = true; };
const openEditCat   = (cat) => { selectedCat.value = { ...cat }; showCatForm.value = true; };

const handleCatSubmit = async (data) => {
  saving.value = true;
  try {
    if (data.id) { await categoriasApi.update(data.id, data); toast('Categoría actualizada.', 'success'); }
    else         { await categoriasApi.create(data);          toast('Categoría creada.',      'success'); }
    showCatForm.value = false;
    await fetchCategorias();
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
};

// ── Productos state ─────────────────────────────────────────────────────────
const productos    = ref([]);
const pLoading     = ref(false);
const pSearch      = ref('');
const pCat         = ref('');
const pShowAll     = ref(false);
const pPage        = ref(1);
const pPagination  = ref({ total: 0, totalPages: 1 });
const showProductoForm  = ref(false);
const selectedProducto  = ref(null);

const productStats = computed(() => ({
  total:    pPagination.value.total,
  activos:  productos.value.filter(p => p.activo).length,
  sinStock: productos.value.filter(p => p.stock === 0).length,
}));

const fetchProductos = async () => {
  pLoading.value = true;
  try {
    const res = await adminProductosApi.getAll({
      search:    pSearch.value,
      categoria: pCat.value,
      page:      pPage.value,
      limit:     12,
      admin:     'true',
      ...(pShowAll.value ? {} : {}),
    });
    productos.value   = res.data;
    pPagination.value = res.pagination;
  } catch (e) { toast(e.message, 'error'); }
  finally { pLoading.value = false; }
};

let pDebTimer = null;
const debounceP = () => {
  clearTimeout(pDebTimer);
  pDebTimer = setTimeout(() => { pPage.value = 1; fetchProductos(); }, 350);
};

const openCreateProducto = () => { selectedProducto.value = null; showProductoForm.value = true; };
const openEditProducto   = (p) => { selectedProducto.value = { ...p }; showProductoForm.value = true; };

const handleProductoSubmit = async ({ fields, imageFile, clearImage }) => {
  saving.value = true;
  try {
    if (fields.id) {
      // Si el usuario quitó la imagen, borrarla en el backend primero
      if (clearImage && fields.imagen_url) {
        await adminProductosApi.removeImage(fields.id);
        fields.imagen_url = '';
      }
      await adminProductosApi.update(fields.id, fields, imageFile);
      toast('Producto actualizado.', 'success');
    } else {
      await adminProductosApi.create(fields, imageFile);
      toast('Producto creado.', 'success');
    }
    showProductoForm.value = false;
    await fetchProductos();
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
};

// ── Delete (shared) ─────────────────────────────────────────────────────────
const saving      = ref(false);
const confirmItem = ref(null);
const deleting    = ref(false);

const confirmDeleteProducto = (p)   => { confirmItem.value = { ...p, _type: 'producto' }; };
const confirmDeleteCat      = (cat) => { confirmItem.value = { ...cat, _type: 'categoría' }; };

const handleDelete = async () => {
  deleting.value = true;
  try {
    if (confirmItem.value._type === 'producto') {
      await adminProductosApi.remove(confirmItem.value.id);
      toast('Producto eliminado.', 'success');
      await fetchProductos();
    } else {
      await categoriasApi.remove(confirmItem.value.id);
      toast('Categoría eliminada.', 'success');
      await fetchCategorias();
    }
    confirmItem.value = null;
  } catch (e) { toast(e.message, 'error'); }
  finally { deleting.value = false; }
};

// ── Toasts ──────────────────────────────────────────────────────────────────
const toasts = ref([]);
const toast = (msg, type = 'success') => {
  const id = Date.now();
  toasts.value.push({ id, msg, type });
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 3500);
};

onMounted(() => Promise.all([fetchCategorias(), fetchProductos()]));
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.admin-wrap {
  display: flex; min-height: calc(100vh - 46px);
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: 220px; flex-shrink: 0;
  background: #1c1b18; color: #fff;
  display: flex; flex-direction: column;
  border-right: 1px solid #2a2927;
}
.sidebar-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 16px 16px; border-bottom: 1px solid #2a2927;
}
.sidebar-logo  { font-size: 1.4rem; }
.sidebar-title { font-size: .88rem; font-weight: 700; }
.sidebar-sub   { font-size: .68rem; opacity: .45; margin-top: 1px; }

.sidebar-nav { padding: 16px 8px; flex: 1; }
.nav-section-label {
  font-size: .62rem; font-weight: 700; color: rgba(255,255,255,.3);
  text-transform: uppercase; letter-spacing: .1em;
  padding: 0 8px; margin-bottom: 6px;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 9px 10px; border-radius: 7px;
  background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,.6); font-family: var(--font); font-size: .85rem;
  transition: all var(--transition); margin-bottom: 2px;
}
.nav-item:hover  { background: rgba(255,255,255,.08); color: #fff; }
.nav-item.active { background: var(--accent); color: #fff; }
.nav-badge {
  margin-left: auto; background: rgba(255,255,255,.15); color: #fff;
  font-size: .65rem; font-weight: 700; padding: 1px 7px; border-radius: 99px;
}
.nav-item.active .nav-badge { background: rgba(255,255,255,.25); }

.sidebar-footer {
  padding: 12px 10px 16px; border-top: 1px solid #2a2927;
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.stat-card {
  background: rgba(255,255,255,.06); border-radius: 6px;
  padding: 8px 10px; text-align: center;
}
.stat-label { font-size: .62rem; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .06em; }
.stat-val   { font-size: 1.3rem; font-weight: 700; color: #fff; font-family: var(--mono); }
.stat-val.warn { color: var(--warn); }

/* ── Main ────────────────────────────────────────────────────────────────── */
.admin-main { flex: 1; overflow-y: auto; padding: 28px; background: var(--bg); }

.admin-section-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px; gap: 16px;
}
.admin-section-title { font-size: 1.25rem; font-weight: 700; }
.admin-section-sub   { font-size: .8rem; color: var(--text-muted); margin-top: 3px; }

.admin-toolbar {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 12px 16px; margin-bottom: 20px;
}
.search-wrap  { position: relative; flex: 1; min-width: 180px; }
.search-icon  { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: .85rem; pointer-events: none; }
.search-input { padding-left: 32px !important; padding-right: 28px !important; }
.clear-btn    { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); }
.filter-select { max-width: 200px; }
.toggle-label { display: flex; align-items: center; gap: 7px; font-size: .82rem; cursor: pointer; color: var(--text-muted); white-space: nowrap; }
.toggle-label input { accent-color: var(--accent); }

/* ── Product admin grid ──────────────────────────────────────────────────── */
.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.admin-product-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
  display: flex; flex-direction: column;
  transition: box-shadow var(--transition), transform var(--transition);
}
.admin-product-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.admin-product-card.inactive { opacity: .55; }

.apc-img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; background: var(--bg); }
.apc-img      { width: 100%; height: 100%; object-fit: cover; transition: transform .35s; }
.admin-product-card:hover .apc-img { transform: scale(1.04); }

.apc-status {
  position: absolute; bottom: 8px; left: 8px;
  font-size: .65rem; font-weight: 700; padding: 2px 8px; border-radius: 99px;
}
.status-active   { background: var(--accent-lt); color: var(--accent-dk); }
.status-inactive { background: rgba(0,0,0,.45); color: #fff; }
.apc-nostock  { position: absolute; top: 8px; right: 8px; background: var(--danger); color: #fff; font-size: .65rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.apc-lowstock { position: absolute; top: 8px; right: 8px; background: var(--warn);   color: #fff; font-size: .65rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; }

.apc-body    { padding: 12px; flex: 1; }
.apc-cat     { font-size: .68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
.apc-name    { font-size: .875rem; font-weight: 600; line-height: 1.3; margin-bottom: 8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.apc-meta    { display: flex; justify-content: space-between; align-items: center; }
.apc-price   { font-family: var(--mono); font-weight: 700; font-size: .95rem; color: var(--accent-dk); }
.apc-stock   { font-size: .75rem; }

.apc-actions {
  display: flex; gap: 6px; padding: 10px 12px;
  border-top: 1px solid var(--border);
}
.apc-actions .btn { flex: 1; justify-content: center; font-size: .75rem; padding: 5px 8px; }

/* Skeletons */
.skeleton-admin-card { background: var(--surface); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); }
.skel { background: linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px; }
.skel-img { aspect-ratio: 4/3; border-radius: 0; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* Admin empty */
.admin-empty { display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 24px; color: var(--text-muted); text-align: center; }
.admin-empty span { font-size: 2.5rem; }

/* Admin pagination */
.admin-pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px;
}
.page-info { font-size: .83rem; color: var(--text-muted); font-family: var(--mono); }

/* Categories table */
.cat-table-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow);
}
.cat-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.cat-table th {
  background: var(--bg); padding: 11px 16px;
  text-align: left; font-size: .72rem; font-weight: 600;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em;
  border-bottom: 1px solid var(--border);
}
.cat-table td   { padding: 13px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.cat-row:last-child td { border-bottom: none; }
.cat-row { transition: background var(--transition); }
.cat-row:hover { background: var(--bg); }
.center-col { text-align: center; }
.mono-text  { font-family: var(--mono); font-size: .83rem; }
</style>
