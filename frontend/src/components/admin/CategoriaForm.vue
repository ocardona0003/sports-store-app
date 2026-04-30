<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <h2>{{ isEdit ? '✏️ Editar Categoría' : '➕ Nueva Categoría' }}</h2>
        <button class="btn btn-ghost btn-icon" @click="$emit('close')">✕</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div style="padding:22px 24px;display:flex;flex-direction:column;gap:14px">
          <div class="field">
            <label class="label">Nombre *</label>
            <input v-model="form.nombre" class="input" :class="{error:e.nombre}"
                   placeholder="Ej: Natación" maxlength="80" />
            <span v-if="e.nombre" class="error-msg">{{ e.nombre }}</span>
          </div>
          <div class="field">
            <label class="label">Descripción</label>
            <textarea v-model="form.descripcion" class="input" rows="2"
                      placeholder="Descripción breve de la categoría…" style="resize:vertical"></textarea>
          </div>
          <div class="field" v-if="isEdit">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
              <input type="checkbox" v-model="form.activo" :true-value="1" :false-value="0"
                     style="width:16px;height:16px;accent-color:var(--accent)" />
              <span style="font-size:.9rem">{{ form.activo ? '✅ Activa' : '⭕ Inactiva' }}</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  categoria: { type: Object, default: null },
  saving:    { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'submit']);

const isEdit = computed(() => !!props.categoria?.id);
const form = ref({ nombre: '', descripcion: '', activo: 1 });
const e    = ref({});

watch(() => props.categoria, (cat) => {
  form.value = cat ? { ...cat } : { nombre: '', descripcion: '', activo: 1 };
  e.value = {};
}, { immediate: true });

const handleSubmit = () => {
  e.value = {};
  if (!form.value.nombre.trim()) { e.value.nombre = 'El nombre es requerido.'; return; }
  emit('submit', { ...form.value });
};
</script>
