<template>
  <div class="login-overlay">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">🏆</span>
        <h1 class="login-title">Sports Store</h1>
        <p class="login-sub">Inicia sesión para continuar</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label class="label">Email</label>
          <input v-model="form.email" type="email" class="input" :class="{error: !!err}"
                 placeholder="admin@sportsstore.com" autocomplete="username" />
        </div>

        <div class="field">
          <label class="label">Contraseña</label>
          <div class="pass-wrap">
            <input v-model="form.password" :type="showPass ? 'text' : 'password'"
                   class="input" :class="{error: !!err}"
                   placeholder="••••••••" autocomplete="current-password" />
            <button type="button" class="pass-toggle" @click="showPass = !showPass">
              {{ showPass ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <p v-if="err" class="login-error">{{ err }}</p>

        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? 'Iniciando sesión…' : 'Iniciar sesión' }}
        </button>

        <div class="login-hint">
          <p><strong>Admin:</strong> admin@sportsstore.com / password</p>
          <p><strong>Empleado:</strong> empleado@sportsstore.com / password</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authStore } from '../stores/auth.js';

const emit = defineEmits(['success']);

const form     = ref({ email: '', password: '' });
const err      = ref('');
const loading  = ref(false);
const showPass = ref(false);

const handleLogin = async () => {
  err.value     = '';
  loading.value = true;
  try {
    const user = await authStore.login(form.value.email, form.value.password);
    emit('success', user);
  } catch (e) {
    err.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-overlay {
  position: fixed; inset: 0;
  background: rgba(28,27,24,.6); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 999; padding: 20px;
}

.login-card {
  background: var(--surface); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md); width: 100%; max-width: 380px;
  overflow: hidden;
  animation: slideUp .25s cubic-bezier(.34,1.3,.64,1);
}
@keyframes slideUp {
  from { opacity:0; transform: translateY(20px) scale(.97); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}

.login-header {
  background: linear-gradient(135deg, #1c1b18, #2d6a4f);
  padding: 32px 24px 28px; text-align: center; color: #fff;
}
.login-logo  { font-size: 2.4rem; }
.login-title { font-size: 1.3rem; font-weight: 700; margin: 8px 0 4px; }
.login-sub   { font-size: .82rem; opacity: .7; }

.login-form  { padding: 24px; display: flex; flex-direction: column; gap: 14px; }

.pass-wrap   { position: relative; }
.pass-wrap .input { padding-right: 40px; }
.pass-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 1rem;
}

.login-error {
  font-size: .82rem; color: var(--danger); background: var(--danger-lt);
  padding: 8px 12px; border-radius: var(--radius); border: 1px solid #f5c2c7;
}

.login-btn { width: 100%; justify-content: center; padding: 11px; font-size: .95rem; margin-top: 4px; }

.login-hint {
  font-size: .72rem; color: var(--text-muted); background: var(--bg);
  border-radius: var(--radius); padding: 10px 12px; line-height: 1.8;
  border: 1px solid var(--border);
}
</style>
