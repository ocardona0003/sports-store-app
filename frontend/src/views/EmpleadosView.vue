<template>
  <div class="app-wrap">

    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <span class="brand-icon">👥</span>
          <div>
            <h1 class="brand-title">Gestión de Empleados</h1>
            <p class="brand-sub">CRUD con Node.js · Vue 3 · MySQL</p>
          </div>
        </div>
        <button class="btn btn-primary" @click="openCreate">
          <span>＋</span> Nuevo empleado
        </button>
      </div>
    </header>

    <div class="toolbar">
      <div class="toolbar-inner">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input v-model="search" class="input search-input"
                 placeholder="Buscar por nombre, email, cargo…"
                 @input="debouncedFetch" />
          <button v-if="search" class="clear-btn" @click="search=''; fetchData()">✕</button>
        </div>
        <div class="filter-row">
          <select v-model="filterDept" class="select filter-select" @change="fetchData">
            <option value="">Todos los departamentos</option>
            <option v-for="d in departamentos" :key="d" :value="d">{{ d }}</option>
          </select>
          <div class="meta-info">
            <span class="total-badge">{{ pagination.total }} empleado{{ pagination.total !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>
    </div>

    <main class="main-content">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Cargando empleados…</p>
      </div>
      <div v-else-if="fetchError" class="state-box error-state">
        <span style="font-size:2rem">⚠️</span>
        <p>{{ fetchError }}</p>
        <button class="btn btn-ghost btn-sm" @click="fetchData">Reintentar</button>
      </div>
      <div v-else-if="!empleados.length" class="state-box">
        <span style="font-size:2.5rem">📭</span>
        <p>No se encontraron empleados.</p>
        <button class="btn btn-primary btn-sm" @click="openCreate">Crear el primero</button>
      </div>

      <div v-else class="table-card">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Empleado</th><th>Email</th><th>Departamento</th>
                <th>Cargo</th><th class="num-col">Salario</th>
                <th class="center-col">Estado</th><th class="center-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in empleados" :key="emp.id" class="table-row">
                <td>
                  <div class="emp-cell">
                    <div class="avatar" :style="{ background: avatarColor(emp.nombre) }">{{ initials(emp.nombre, emp.apellido) }}</div>
                    <div>
                      <div class="emp-name">{{ emp.nombre }} {{ emp.apellido }}</div>
                      <div class="emp-id">ID #{{ emp.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="mono-text">{{ emp.email }}</td>
                <td><span class="dept-tag">{{ emp.departamento }}</span></td>
                <td>{{ emp.cargo }}</td>
                <td class="num-col mono-text">{{ formatSalario(emp.salario) }}</td>
                <td class="center-col">
                  <span :class="emp.activo ? 'badge badge-green' : 'badge badge-gray'">
                    {{ emp.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="center-col">
                  <div class="actions-cell">
                    <button class="btn btn-ghost btn-icon" @click="openEdit(emp)">✏️</button>
                    <button class="btn btn-danger btn-icon" @click="askDelete(emp)">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" v-if="pagination.totalPages > 1">
          <button class="btn btn-ghost btn-sm" :disabled="page === 1" @click="changePage(page - 1)">← Anterior</button>
          <div class="page-numbers">
            <button v-for="p in pageRange" :key="p" class="page-btn" :class="{ active: p === page }" @click="changePage(p)">{{ p }}</button>
          </div>
          <button class="btn btn-ghost btn-sm" :disabled="page === pagination.totalPages" @click="changePage(page + 1)">Siguiente →</button>
        </div>
      </div>
    </main>

    <EmpleadoForm
      v-if="showForm"
      :empleado="selected"
      :departamentos="departamentos"
      :saving="saving"
      @close="showForm = false"
      @submit="handleSubmit"
    />

    <ConfirmDialog
      v-if="showConfirm"
      :nombre="`${toDelete?.nombre} ${toDelete?.apellido}`"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showConfirm = false"
    />

    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" :class="`toast ${t.type}`">
        <span>{{ t.type === 'success' ? '✅' : '❌' }}</span>{{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { empleadosService } from '../services/empleados.js';
import EmpleadoForm   from '../components/EmpleadoForm.vue';
import ConfirmDialog  from '../components/ConfirmDialog.vue';

const empleados    = ref([]);
const departamentos = ref([]);
const loading      = ref(false);
const fetchError   = ref('');
const search       = ref('');
const filterDept   = ref('');
const page         = ref(1);
const pagination   = ref({ total: 0, totalPages: 1 });
const showForm     = ref(false);
const selected     = ref(null);
const saving       = ref(false);
const showConfirm  = ref(false);
const toDelete     = ref(null);
const deleting     = ref(false);
const toasts       = ref([]);

const fetchData = async () => {
  loading.value = true; fetchError.value = '';
  try {
    const res = await empleadosService.getAll({ search: search.value, departamento: filterDept.value, page: page.value, limit: 8 });
    empleados.value = res.data; pagination.value = res.pagination;
  } catch (e) { fetchError.value = e.message || 'Error de conexión.'; }
  finally { loading.value = false; }
};

const fetchDepts = async () => {
  try { const res = await empleadosService.getDepartamentos(); departamentos.value = res.data; } catch {}
};

let debTimer = null;
const debouncedFetch = () => { clearTimeout(debTimer); debTimer = setTimeout(() => { page.value = 1; fetchData(); }, 350); };

const changePage = (p) => { page.value = p; fetchData(); };
const pageRange = computed(() => {
  const total = pagination.value.totalPages, cur = page.value, range = [];
  for (let i = Math.max(1, cur-2); i <= Math.min(total, cur+2); i++) range.push(i);
  return range;
});

const openCreate = () => { selected.value = null; showForm.value = true; };
const openEdit   = (emp) => { selected.value = { ...emp }; showForm.value = true; };

const handleSubmit = async (formData) => {
  saving.value = true;
  try {
    if (formData.id) { await empleadosService.update(formData.id, formData); toast('Empleado actualizado.', 'success'); }
    else             { await empleadosService.create(formData); toast('Empleado creado.', 'success'); }
    showForm.value = false;
    await Promise.all([fetchData(), fetchDepts()]);
  } catch (e) { toast(e.message || 'Error al guardar.', 'error'); }
  finally { saving.value = false; }
};

const askDelete = (emp) => { toDelete.value = emp; showConfirm.value = true; };
const handleDelete = async () => {
  deleting.value = true;
  try {
    await empleadosService.remove(toDelete.value.id);
    toast(`${toDelete.value.nombre} eliminado.`, 'success');
    showConfirm.value = false;
    if (empleados.value.length === 1 && page.value > 1) page.value--;
    await Promise.all([fetchData(), fetchDepts()]);
  } catch (e) { toast(e.message || 'Error al eliminar.', 'error'); }
  finally { deleting.value = false; }
};

const toast = (msg, type = 'success') => {
  const id = Date.now(); toasts.value.push({ id, msg, type });
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 3500);
};

const initials = (n, a) => `${n?.[0]||''}${a?.[0]||''}`.toUpperCase();
const COLORS = ['#2d6a4f','#1d4e89','#7b2d8b','#b5451b','#1a535c','#4a4e69'];
const avatarColor = (name) => COLORS[name?.charCodeAt(0) % COLORS.length] || COLORS[0];
const formatSalario = (v) => new Intl.NumberFormat('es-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);

onMounted(() => Promise.all([fetchData(), fetchDepts()]));
</script>

<style scoped>
.app-wrap { min-height: calc(100vh - 46px); display: flex; flex-direction: column; }
.app-header { background: var(--text); color: #fff; padding: 0 24px; }
.header-inner { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
.brand { display: flex; align-items: center; gap: 14px; }
.brand-icon { font-size: 2rem; }
.brand-title { font-size: 1.15rem; font-weight: 600; line-height: 1.2; }
.brand-sub   { font-size: .75rem; opacity: .55; font-family: var(--mono); }
.toolbar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 24px; }
.toolbar-inner { max-width: 1180px; margin: 0 auto; padding: 14px 0; display: flex; flex-direction: column; gap: 12px; }
.search-wrap { position: relative; max-width: 440px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: .9rem; pointer-events: none; }
.search-input { padding-left: 36px !important; padding-right: 32px !important; }
.clear-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: .85rem; }
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-select { max-width: 240px; }
.total-badge { font-size: .8rem; color: var(--text-muted); font-family: var(--mono); }
.main-content { flex: 1; padding: 24px; max-width: 1180px; width: 100%; margin: 0 auto; }
.state-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 64px 24px; text-align: center; color: var(--text-muted); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }
.table-scroll { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-size: .875rem; min-width: 680px; }
.table th { background: var(--bg); padding: 11px 16px; text-align: left; font-size: .72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid var(--border); }
.table td { padding: 13px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.table-row:last-child td { border-bottom: none; }
.table-row { transition: background var(--transition); }
.table-row:hover { background: var(--bg); }
.emp-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: .78rem; flex-shrink: 0; }
.emp-name { font-weight: 500; }
.emp-id   { font-size: .72rem; color: var(--text-muted); font-family: var(--mono); }
.mono-text { font-family: var(--mono); font-size: .83rem; }
.num-col  { text-align: right; }
.center-col { text-align: center; }
.dept-tag { background: var(--bg); border: 1px solid var(--border); border-radius: 5px; padding: 2px 9px; font-size: .78rem; }
.actions-cell { display: flex; gap: 6px; justify-content: center; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; border-top: 1px solid var(--border); }
.page-numbers { display: flex; gap: 4px; }
.page-btn { width: 32px; height: 32px; border: 1.5px solid var(--border); border-radius: 6px; background: transparent; cursor: pointer; font-family: var(--font); font-size: .83rem; transition: all var(--transition); }
.page-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.page-btn:hover:not(.active) { background: var(--bg); }
</style>
