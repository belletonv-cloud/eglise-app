import { reactive } from 'vue';
const state = reactive({
    message: '',
    visible: false,
});
let resolveFn = null;
export function confirmDialog(message) {
    return new Promise((resolve) => {
        state.message = message;
        state.visible = true;
        resolveFn = resolve;
    });
}
export function confirmResolve(value) {
    state.visible = false;
    if (resolveFn) {
        resolveFn(value);
        resolveFn = null;
    }
}
export function confirmState() {
    return state;
}
