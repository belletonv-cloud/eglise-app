import { reactive } from 'vue';
const state = reactive({ items: [] });
let nextId = 1;
export function useToast() {
    function show(message, type = 'success', timeout = 4000) {
        const id = nextId++;
        state.items.push({ id, message, type });
        setTimeout(() => dismiss(id), timeout);
    }
    function dismiss(id) {
        const idx = state.items.findIndex(t => t.id === id);
        if (idx >= 0)
            state.items.splice(idx, 1);
    }
    return { state, show, dismiss };
}
export default useToast;
export const showToast = (message, type = 'success') => useToast().show(message, type);
