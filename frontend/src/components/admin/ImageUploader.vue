<template>
  <div class="img-uploader">

    <!-- Preview cuando ya hay imagen guardada -->
    <div v-if="previewSrc" class="preview-wrap">
      <img :src="previewSrc" alt="Preview" class="preview-img"
           @error="e => e.target.src='https://placehold.co/400x300?text=Sin+imagen'" />
      <div class="preview-overlay">
        <button type="button" class="preview-action-btn" @click="triggerFile" title="Cambiar imagen">
          🔄 Cambiar
        </button>
        <button type="button" class="preview-action-btn danger" @click="clear" title="Quitar imagen">
          🗑 Quitar
        </button>
      </div>
    </div>

    <!-- Drop zone (sin imagen) -->
    <div
      v-else
      class="drop-zone"
      :class="{ 'drag-over': isDragging, 'has-error': !!error }"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerFile"
    >
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
             class="hidden-input" @change="onFileChange" />

      <div class="drop-content">
        <span class="drop-icon">{{ isDragging ? '📂' : '🖼️' }}</span>
        <p class="drop-text">
          <strong>Arrastra la imagen aquí</strong><br>
          <span>o haz clic para seleccionar</span>
        </p>
        <p class="drop-hint">JPG · PNG · WebP · GIF · máx. 10 MB</p>
      </div>
    </div>

    <!-- Input file oculto (para el caso de que ya hay preview y se quiere cambiar) -->
    <input v-if="previewSrc" ref="fileInput" type="file"
           accept="image/jpeg,image/png,image/webp,image/gif"
           class="hidden-input" @change="onFileChange" />

    <!-- Toggle URL externa -->
    <div class="url-row">
      <button type="button" class="btn btn-ghost btn-sm url-toggle"
              @click="showUrl = !showUrl">
        {{ showUrl ? '✕ Cancelar' : '🔗 Usar URL de imagen' }}
      </button>
    </div>

    <div v-if="showUrl" class="url-input-wrap">
      <input v-model="urlInput" class="input" placeholder="https://ejemplo.com/imagen.jpg"
             @keyup.enter="applyUrl" />
      <button type="button" class="btn btn-primary btn-sm" @click="applyUrl">Aplicar</button>
    </div>

    <p v-if="error" class="error-msg" style="margin-top:4px">{{ error }}</p>

    <!-- Info del archivo seleccionado -->
    <p v-if="selectedFileName && !error" class="file-info">
      ✅ {{ selectedFileName }} (se subirá al guardar)
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  // URL de imagen actual (guardada en BD)
  currentUrl:   { type: String, default: '' },
  // Archivo File seleccionado (v-model del file)
  modelValue:   { type: [File, null], default: null },
});

const emit = defineEmits(['update:modelValue', 'clear-image']);

const isDragging       = ref(false);
const showUrl          = ref(false);
const urlInput         = ref('');
const error            = ref('');
const fileInput        = ref(null);
const localPreview     = ref('');   // ObjectURL del archivo local
const selectedFileName = ref('');
const useExternalUrl   = ref('');   // cuando el usuario pega una URL

// La imagen a mostrar como preview
const previewSrc = computed(() => {
  if (localPreview.value)  return localPreview.value;
  if (useExternalUrl.value) return useExternalUrl.value;
  if (props.currentUrl)    return buildImageUrl(props.currentUrl);
  return '';
});

const buildImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // Path relativo → apuntar al backend
  return `http://localhost:3000${url}`;
};

const triggerFile = () => fileInput.value?.click();

const validateFile = (file) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    error.value = 'Tipo no permitido. Use JPG, PNG, WebP o GIF.';
    return false;
  }
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'La imagen supera el límite de 10 MB.';
    return false;
  }
  return true;
};

const setFile = (file) => {
  error.value = '';
  if (!validateFile(file)) return;

  // Revocar ObjectURL anterior si existía
  if (localPreview.value) URL.revokeObjectURL(localPreview.value);

  localPreview.value     = URL.createObjectURL(file);
  selectedFileName.value = file.name;
  useExternalUrl.value   = '';
  emit('update:modelValue', file);
};

const onFileChange = (e) => {
  const file = e.target.files?.[0];
  if (file) setFile(file);
};

const onDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files?.[0];
  if (file) setFile(file);
};

const applyUrl = () => {
  const url = urlInput.value.trim();
  if (!url) return;
  // URL externa: no se sube archivo, se guarda la URL directamente
  useExternalUrl.value   = url;
  localPreview.value     = '';
  selectedFileName.value = '';
  urlInput.value         = '';
  showUrl.value          = false;
  error.value            = '';
  // Emitir string especial para indicar que es URL externa
  emit('update:modelValue', { _externalUrl: url });
};

const clear = () => {
  if (localPreview.value) URL.revokeObjectURL(localPreview.value);
  localPreview.value     = '';
  useExternalUrl.value   = '';
  selectedFileName.value = '';
  error.value            = '';
  if (fileInput.value) fileInput.value.value = '';
  emit('update:modelValue', null);
  emit('clear-image');   // notifica al padre que debe borrar imagen en BD
};
</script>

<style scoped>
.img-uploader { display: flex; flex-direction: column; gap: 8px; }

/* Preview */
.preview-wrap {
  position: relative; border-radius: var(--radius); overflow: hidden;
  border: 1.5px solid var(--border); height: 200px;
}
.preview-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.preview-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; gap: 10px;
  opacity: 0; transition: opacity var(--transition);
}
.preview-wrap:hover .preview-overlay { opacity: 1; }
.preview-action-btn {
  background: rgba(255,255,255,.15); backdrop-filter: blur(4px);
  border: 1.5px solid rgba(255,255,255,.3); color: #fff;
  border-radius: 6px; padding: 6px 14px; cursor: pointer;
  font-size: .8rem; font-weight: 600; transition: background var(--transition);
}
.preview-action-btn:hover { background: rgba(255,255,255,.3); }
.preview-action-btn.danger:hover { background: var(--danger); border-color: var(--danger); }

/* Drop zone */
.drop-zone {
  border: 2px dashed var(--border-md); border-radius: var(--radius);
  padding: 32px 16px; text-align: center; cursor: pointer;
  transition: all var(--transition); background: var(--bg); min-height: 140px;
  display: flex; align-items: center; justify-content: center;
}
.drop-zone:hover, .drop-zone.drag-over {
  border-color: var(--accent); background: var(--accent-lt);
}
.drop-zone.has-error { border-color: var(--danger); background: var(--danger-lt); }
.hidden-input  { display: none; }
.drop-content  { display: flex; flex-direction: column; align-items: center; gap: 7px; pointer-events: none; }
.drop-icon     { font-size: 2.2rem; }
.drop-text     { font-size: .85rem; color: var(--text); line-height: 1.6; }
.drop-text strong { color: var(--accent-dk); }
.drop-hint     { font-size: .72rem; color: var(--text-muted); }

/* URL */
.url-row       { display: flex; }
.url-toggle    { font-size: .75rem; padding: 4px 10px; }
.url-input-wrap { display: flex; gap: 8px; }
.url-input-wrap .input { flex: 1; font-size: .85rem; }

/* File info */
.file-info { font-size: .75rem; color: var(--accent-dk); font-weight: 500; }
</style>
