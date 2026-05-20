<template>
  <div class="login">
    <h2 class="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">{{ $t('login.title') }}</h2>
    <div class="login-form">
      <input v-model="email" type="email" :placeholder="$t('login.email')" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
      <input v-model="password" type="password" :placeholder="$t('login.password')" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
      <button @click="handleEmailLogin" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{ $t('login.email_button') }}</button>
      <button @click="handleGoogleLogin" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">{{ $t('login.google_button') }}</button>

      <p v-if="error" class="error text-red-500 text-sm text-center">{{ error }}</p>

      <div class="demo-link">
        <button @click="enterDemo" class="text-sm text-gray-400 hover:text-purple-500 underline cursor-pointer">🕊️ Essayer la démo</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginWithEmail, loginWithGoogle } from '../stores/auth';
import { enableInteractiveView } from '../stores/demo';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');

const handleEmailLogin = async () => {
  try {
    await loginWithEmail(email.value, password.value);
  } catch (err: any) {
    error.value = err.message;
  }
};

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle();
  } catch (err: any) {
    error.value = err.message;
  }
};

const enterDemo = () => {
  enableInteractiveView();
  router.push('/interactive');
};

</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 50px auto;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
}
.dark .login {
  background: #1f2937;
  border-color: #374151;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.divider {
  position: relative;
}
.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e5e7eb;
}
.divider::before { left: 0; }
.divider::after { right: 0; }
.dark .divider::before, .dark .divider::after {
  background: #374151;
}
.demo-link {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}
.dark .demo-link {
  border-color: #374151;
}
</style>
