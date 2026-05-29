import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
export function useCheckins() {
    // État
    const plans = ref([]);
    const members = ref([]);
    const attendances = ref([]);
    const currentPlan = ref(null);
    const searchResults = ref([]);
    const isLoading = ref(false);
    const isSubmitting = ref(false);
    const error = ref(null);
    const { t } = useI18n();
    // Chargement des plans
    async function loadPlans() {
        isLoading.value = true;
        error.value = null;
        try {
            plans.value = await api.getPlans();
        }
        catch (e) {
            error.value = t('checkin.api_error');
        }
        finally {
            isLoading.value = false;
        }
    }
    // Chargement des membres
    async function loadMembers() {
        isLoading.value = true;
        error.value = null;
        try {
            members.value = await api.getMembers();
        }
        catch (e) {
            error.value = t('checkin.api_error');
        }
        finally {
            isLoading.value = false;
        }
    }
    // Chargement des présences pour un plan donné
    async function loadAttendances(planId) {
        isLoading.value = true;
        error.value = null;
        try {
            attendances.value = await api.getPlanAttendances(planId);
        }
        catch (e) {
            error.value = t('checkin.api_error');
        }
        finally {
            isLoading.value = false;
        }
    }
    // Validation locale
    function validateCheckIn(plan, member) {
        if (!plan || !member)
            return 'checkin.validation_missing';
        const alreadyPresent = attendances.value.some(a => a.member_id === member.id);
        if (alreadyPresent)
            return 'checkin.duplicate';
        // Fenêtre service : on laisse large côté client, sinon date/time stricte
        const now = new Date();
        const planDate = new Date(plan.date + (plan.time ? 'T' + plan.time : 'T00:00'));
        if (Math.abs(+now - +planDate) > 1000 * 60 * 60 * 8)
            return 'checkin.window_error';
        return null;
    }
    // Check-in
    async function checkIn(payload) {
        isSubmitting.value = true;
        error.value = null;
        try {
            await api.createAttendance(payload);
        }
        catch (e) {
            error.value = t('checkin.api_error');
            throw e;
        }
        finally {
            isSubmitting.value = false;
        }
    }
    // Check-out/suppression
    async function checkOut(attendanceId) {
        isSubmitting.value = true;
        error.value = null;
        try {
            await api.deleteAttendance(attendanceId);
        }
        catch (e) {
            error.value = t('checkin.api_error');
            throw e;
        }
        finally {
            isSubmitting.value = false;
        }
    }
    // Création rapide membre invité
    async function createMember(payload) {
        isSubmitting.value = true;
        error.value = null;
        try {
            const m = await api.createMember(payload);
            members.value.push(m);
            return m;
        }
        catch (e) {
            error.value = t('checkin.api_error');
            throw e;
        }
        finally {
            isSubmitting.value = false;
        }
    }
    // Recherche locale
    function searchMembers(query) {
        if (query.length < 2) {
            searchResults.value = [];
            return;
        }
        const q = query.toLowerCase();
        searchResults.value = members.value.filter(m => m.first_name?.toLowerCase().includes(q) ||
            m.last_name?.toLowerCase().includes(q)).slice(0, 10);
    }
    return {
        plans, members, attendances,
        currentPlan, searchResults,
        isLoading, isSubmitting, error,
        loadPlans, loadMembers, loadAttendances,
        checkIn, checkOut, createMember,
        validateCheckIn, searchMembers
    };
}
