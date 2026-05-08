<template>
  <div class="login">
    <h2>Connexion - Église App</h2>
    <div class="login-form">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Mot de passe" />
      <button @click="handleEmailLogin">Se connecter avec Email</button>
      <button @click="handleGoogleLogin" class="google-btn">Se connecter avec Google</button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { loginWithEmail, loginWithGoogle } from '../stores/auth';

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
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 10px;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.google-btn {
  background: #4285f4;
}
.error {
  color: red;
}
</style>
