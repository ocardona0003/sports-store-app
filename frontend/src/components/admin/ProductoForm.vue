<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal admin-product-modal">
      <div class="modal-header">
        <h2>{{ isEdit ? '✏️ Editar Producto' : '➕ Nuevo Producto' }}</h2>
        <button class="btn btn-ghost btn-icon" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
        <div class="apf-body">

          <!-- Columna imagen -->
          <div class="apf-image-col">
            <label class="label">Imagen del producto</label>
            <ImageUploader
              :currentUrl="form.imagen_url"
              :modelValue="imageFile"
              @update:modelValue="onImageChange"
              @clear-image="clearImageFlag = true"
            />
          </div>

          <!-- Columna campos -->
          <div class="apf-fields-col">
            <div class="field">
              <label class="label">Nombre *</label>
              <input v-model="form.nombre" class="input" :class="{error:e.nombre}"
                     placeholder="Nike Air Zoom…" maxlength="150" />
              <span v-if="e.nombre" class="error-msg">{{ e.nombre }}</span>
            </div>

            <div class="field">
              <label class="label">Categoría *</label>
              <select v-model="form.categoria" class="select" :class="{error:e.categoria}">
                <option value="">— Selecciona una categoría —</option>
                <option v-for="cat in categorias" :key="cat.id" :value="cat.nombre">
                  {{ cat.nombre }}
                </option>
              </select>
              <span v-if="e.categoria" class="error-msg">{{ e.categoria }}</span>
            </div>

            <div class="field">
              <label class="label">Descripción</label>
              <textarea v-model="form.descripcion" class="input" rows="3"
                        placeholder="Descripción del producto…" style="resize:vertical"></textarea>
            </div>

            <div class="two-cols">
              <div class="field">
                <label class="label">Precio (USD) *</label>
                <input v-model.number="form.precio" type="number" class="input"
                       :class="{error:e.precio}" placeholder="0.00" min="0" step="0.01" />
                <span v-if="e.precio" class="error-msg">{{ e.precio }}</span>
              </div>
              <div class="field">
                <label class="label">Stock *</label>
                <input v-model.number="form.stock" type="number" class="input"
                       :class="{error:e.stock}" placeholder="0" min="0" step="1" />
                <span v-if="e.stock" class="error-msg">{{ e.stock }}</span>
              </div>
            </div>

            <div class="field">
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-top:2px">
                <input type="checkbox" v-model="form.activo" :true-value="1" :false-value="0"
                       style="width:16px;height:16px;accent-color:var(--accent)" />
                <span style="font-size:.9rem">
                  {{ form.activo ? '✅ Producto activo' : '⭕ Producto inactivo' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ImageUploader from './ImageUploader.vue';

const props = defineProps({
  producto:   { type: Object, default: null },
  categorias: { type: Array,  default: () => [] },
  saving:     { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'submit']);

const isEdit = computed(() => !!props.producto?.id);

const emptyForm = () => ({
  nombre: '', categoria: '', descripcion: '',
  precio: '', stock: '', imagen_url: '', activo: 1,
});

const form           = ref(emptyForm());
const e              = ref({});
const imageFile      = ref(null);   // File | null | { _externalUrl }
const clearImageFlag = ref(false);  // cuando el usuario quita la imagen

watch(() => props.producto, (p) => {
  form.value       = p ? { ...p } : emptyForm();
  imageFile.value  = null;
  clearImageFlag.value = false;
  e.value          = {};
}, { immediate: true });

const onImageChange = (val) => {
  imageFile.value      = val;
  clearImageFlag.value = false;
};

const handleSubmit = () => {
  e.value = {};
  if (!form.value.nombre.trim())      e.value.nombre    = 'El nombre es requerido.';
  if (!form.value.categoria)          e.value.categoria = 'Selecciona una categoría.';
  if (form.value.precio === '' || form.value.precio < 0) e.value.precio = 'El precio debe ser ≥ 0.';
  if (form.value.stock  === '' || form.value.stock  < 0) e.value.stock  = 'El stock debe ser ≥ 0.';
  if (Object.keys(e.value).length) return;

  emit('submit', {
    fields:         { ...form.value },
    imageFile:      imageFile.value,
    clearImage:     clearImageFlag.value,
  });
};
</script>

<style scoped>
.admin-product-modal { max-width: 820px; }
.apf-body {
  padding: 22px 24px;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
}
.apf-image-col  { display: flex; flex-direction: column; gap: 6px; }
.apf-fields-col { display: flex; flex-direction: column; gap: 14px; }
.two-cols       { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 640px) {
  .apf-body { grid-template-columns: 1fr; }
}
</style>
