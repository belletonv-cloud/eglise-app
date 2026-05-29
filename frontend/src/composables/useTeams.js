import { ref } from 'vue';
import { api } from '../utils/api';
// État réactif partagé
const teams = ref([]);
const loading = ref(false);
const error = ref(null);
// Charge tous les ministères
async function loadTeams() {
    try {
        loading.value = true;
        error.value = null;
        teams.value = await api.getTeams();
    }
    catch (e) {
        error.value = e.message || 'Erreur de chargement';
    }
    finally {
        loading.value = false;
    }
}
// Ajout
async function createTeam(data) {
    loading.value = true;
    error.value = null;
    try {
        const team = await api.createTeam(data);
        teams.value.push(team);
        return team;
    }
    catch (e) {
        error.value = e.message || 'Erreur de création';
        throw e;
    }
    finally {
        loading.value = false;
    }
}
// Édition
async function updateTeam(id, data) {
    loading.value = true;
    error.value = null;
    try {
        const team = await api.updateTeam(id, data);
        const idx = teams.value.findIndex(t => t.id === id);
        if (idx !== -1)
            teams.value[idx] = { ...teams.value[idx], ...team };
        return team;
    }
    catch (e) {
        error.value = e.message || 'Erreur de modification';
        throw e;
    }
    finally {
        loading.value = false;
    }
}
// Suppression
async function deleteTeam(id) {
    loading.value = true;
    error.value = null;
    try {
        await api.deleteTeam(id);
        teams.value = teams.value.filter(t => t.id !== id);
    }
    catch (e) {
        error.value = e.message || 'Erreur de suppression';
        throw e;
    }
    finally {
        loading.value = false;
    }
}
// Ajout d'un membre à un ministère
async function addTeamMember(teamId, memberId, position) {
    loading.value = true;
    error.value = null;
    try {
        await api.addTeamMember(teamId, memberId, position);
        // Optionnelment, recharger les équipes ou maj locale
    }
    catch (e) {
        error.value = e.message || 'Erreur d\'ajout du membre';
        throw e;
    }
    finally {
        loading.value = false;
    }
}
// Retrait d'un membre d'un ministère
async function removeTeamMember(teamId, memberId) {
    loading.value = true;
    error.value = null;
    try {
        await api.removeTeamMember(teamId, memberId);
        // Optionnellement, recharger les équipes ou maj locale
    }
    catch (e) {
        error.value = e.message || 'Erreur de retrait du membre';
        throw e;
    }
    finally {
        loading.value = false;
    }
}
export function useTeams() {
    return {
        teams,
        loading,
        error,
        loadTeams,
        createTeam,
        updateTeam,
        deleteTeam,
        addTeamMember,
        removeTeamMember
    };
}
