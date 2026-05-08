<template>
  <div v-if="state.visible" class="confirm-overlay" @click.self="cancel">
    <div class="confirm-dialog">
      <p class="confirm-message">{{ state.message }}</p>
      <div class="confirm-actions">
        <button class="btn-cancel" @click="cancel">Annuler</button>
        <button class="btn-confirm" @click="confirm">Confirmer</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { confirmState, confirmResolve } from '../stores/confirm'

const state = confirmState()

function confirm() {
  confirmResolve(true)
}

function cancel() {
  confirmResolve(false)
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.confirm-message {
  margin: 0 0 1.25rem;
  font-size: 1rem;
  color: #1f2937;
  line-height: 1.5;
}
.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
.btn-cancel, .btn-confirm {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 500;
}
.btn-cancel {
  background: #e5e7eb;
  color: #374151;
}
.btn-cancel:hover { background: #d1d5db; }
.btn-confirm {
  background: #ef4444;
  color: #fff;
}
.btn-confirm:hover { background: #dc2626; }
</style>
