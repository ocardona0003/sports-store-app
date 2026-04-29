<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ isEdit ? '✏️ Editar Empleado' : '➕ Nuevo Empleado' }}</h2>
        <button class="btn btn-ghost btn-icon" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div class="field">
            <label class="label">Nombre *</label>
            <input v-model="form.nombre" class="input" :class="{ error: errors.nombre }"
                   placeholder="Ana" maxlength="100" />
            <span v-if="errors.nombre" class="error-msg">{{ errors.nombre }}</span>
          </div>

          <div class="field">
            <label class="label">Apellido *</label>
            <input v-model="form.apellido" class="input" :class="{ error: errors.apellido }"
                   placeholder="García" maxlength="100" />
            <span v-if="errors.apellido" class="error-msg">{{ errors.apellido }}</span>
          </div>

          <div class="field full-col">
            <label class="label">Email *</label>
            <input v-model="form.email" type="email" class="input" :class="{ error: errors.email }"
                   placeholder="ana.garcia@empresa.com" />
            <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
          </div>

          <div class="field">
            <label class="label">Teléfono</label>
            <input v-model="form.telefono" class="input" placeholder="555-0000" maxlength="20" />
          </div>

          <div class="field">
            <label class="label">Salario (USD) *</label>
            <input v-model.number="form.salario" type="number" class="input" :class="{ error: errors.salario }"
                   placeholder="0.00" min="0" step="100" />
            <span v-if="errors.salario" class="error-msg">{{ errors.salario }}</span>
          </div>

          <div class="field">
            <label class="label">Departamento *</label>
            <input v-model="form.departamento" class="input" :class="{ error: errors.departamento }"
                   list="dept-list" placeholder="Ingeniería" />
            <datalist id="dept-list">
              <option v-for="d in departamentos" :key="d" :value="d" />
            </datalist>
            <span v-if="errors.departamento" class="error-msg">{{ errors.departamento }}</span>
          </div>

          <div class="field">
            <label class="label">Cargo *</label>
            <input v-model="form.cargo" class="input" :class="{ error: errors.cargo }"
                   placeholder="Desarrollador Senior" maxlength="100" />
            <span v-if="errors.cargo" class="error-msg">{{ errors.cargo }}</span>
          </div>

          <div class="field full-col">
            <label class="label">Estado</label>
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-top:4px">
              <input type="checkbox" v-model="form.activo" :true-value="1" :false-value="0"
                     style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)" />
              <span style="font-size:.9rem">
                {{ form.activo ? '✅ Empleado activo' : '⭕ Empleado inactivo' }}
              </span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear empleado' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  empleado:     { type: Object, default: null },
  departamentos: { type: Array, default: () => [] },
  saving:       { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'submit']);

const isEdit = computed(() => !!props.empleado?.id);

const emptyForm = () => ({
  nombre: '', apellido: '', email: '', telefono: '',
  departamento: '', cargo: '', salario: '', activo: 1,
});

const form   = ref(emptyForm());
const errors = ref({});

// Rellenar al editar
watch(() => props.empleado, (emp) => {
  form.value = emp ? { ...emp } : emptyForm();
  errors.value = {};
}, { immediate: true });

const validate = () => {
  const e = {};
  if (!form.value.nombre.trim())       e.nombre       = 'El nombre es requerido.';
  if (!form.value.apellido.trim())     e.apellido     = 'El apellido es requerido.';
  if (!form.value.email)               e.email        = 'El email es requerido.';
  else if (!/\S+@\S+\.\S+/.test(form.value.email)) e.email = 'Email inválido.';
  if (!form.value.departamento.trim()) e.departamento = 'El departamento es requerido.';
  if (!form.value.cargo.trim())        e.cargo        = 'El cargo es requerido.';
  if (form.value.salario === '' || form.value.salario < 0) e.salario = 'El salario debe ser ≥ 0.';
  errors.value = e;
  return Object.keys(e).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;
  emit('submit', { ...form.value });
};
</script>
