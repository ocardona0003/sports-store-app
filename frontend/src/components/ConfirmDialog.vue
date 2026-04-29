<template>
  <div class="overlay" @click.self="$emit('cancel')">
    <div class="confirm-box">
      <div class="icon">🗑️</div>
      <h3>¿Eliminar empleado?</h3>
      <p>Esta acción no se puede deshacer.<br>
         <strong>{{ nombre }}</strong> será eliminado permanentemente.</p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" @click="$emit('cancel')">Cancelar</button>
        <button class="btn btn-danger" :disabled="loading" @click="$emit('confirm')">
          {{ loading ? 'Eliminando…' : 'Sí, eliminar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ nombre: String, loading: { type: Boolean, default: false } });
defineEmits(['confirm', 'cancel']);
</script>
