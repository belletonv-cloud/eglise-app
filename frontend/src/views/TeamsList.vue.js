import { ref, onMounted } from 'vue';
import PageHelp from '../components/PageHelp.vue';
import { stepsByPage } from '../page-help-steps';
import { useTeams } from '../composables/useTeams';
import { showToast } from '../stores/toast';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { teams, loading, error, loadTeams, createTeam: createTeamComposable } = useTeams();
const showForm = ref(false);
const form = ref({ name: '', description: '', service_type: '' });
async function load() {
    await loadTeams();
}
function validateForm() {
    // Nom obligatoire, min 3, pas de doublon (case-insensitive)
    const name = (form.value.name || '').trim();
    if (!name)
        return { valid: false, message: t('teamsList.validation_name_required') };
    if (name.length < 3)
        return { valid: false, message: t('teamsList.validation_name_short') };
    if (teams.value.some(ti => ti.name.trim().toLowerCase() === name.toLowerCase()))
        return { valid: false, message: t('teamsList.validation_name_duplicate') };
    // Ajout description si obligatoire ici ; actuellement optionnelle
    return { valid: true };
}
async function createTeam() {
    const v = validateForm();
    if (!v.valid) {
        showToast(v.message || t('teamsList.validation_error'), 'error');
        return;
    }
    try {
        await createTeamComposable(form.value);
        showToast(t('teamsList.create_ministry_success'), 'success');
        showForm.value = false;
        form.value = { name: '', description: '', service_type: '' };
        load();
    }
    catch (e) {
        showToast(e.message || t('teamsList.create_ministry_error'), 'error');
    }
}
onMounted(load);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['team-card']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "teams-page" },
});
/** @type {__VLS_StyleScopedClasses['teams-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.$t('menu.ministries'));
(__VLS_ctx.teams.length);
const __VLS_0 = PageHelp;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    page: "teams",
    helpText: (__VLS_ctx.$t('help.teams')),
    steps: (__VLS_ctx.stepsByPage(__VLS_ctx.t).teams),
}));
const __VLS_2 = __VLS_1({
    page: "teams",
    helpText: (__VLS_ctx.$t('help.teams')),
    steps: (__VLS_ctx.stepsByPage(__VLS_ctx.t).teams),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showForm = true;
            // @ts-ignore
            [$t, $t, teams, stepsByPage, t, showForm,];
        } },
    ...{ class: "add-btn" },
});
/** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
(__VLS_ctx.$t('teamsList.create_ministry'));
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading" },
    });
    /** @type {__VLS_StyleScopedClasses['loading']} */ ;
    (__VLS_ctx.$t('loading'));
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.error);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    for (const [t] of __VLS_vFor((__VLS_ctx.teams))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.$router.push(`/teams/${t.id}`);
                    // @ts-ignore
                    [$t, $t, teams, loading, error, error, $router,];
                } },
            key: (t.id),
            ...{ class: "team-card" },
        });
        /** @type {__VLS_StyleScopedClasses['team-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "team-name" },
        });
        /** @type {__VLS_StyleScopedClasses['team-name']} */ ;
        (t.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "team-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['team-meta']} */ ;
        (t.member_count);
        (__VLS_ctx.$t('table.member'));
        if (t.description) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "team-desc" },
            });
            /** @type {__VLS_StyleScopedClasses['team-desc']} */ ;
            (t.description);
        }
        // @ts-ignore
        [$t,];
    }
    if (__VLS_ctx.teams.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty" },
        });
        /** @type {__VLS_StyleScopedClasses['empty']} */ ;
        (__VLS_ctx.$t('members.no_members'));
    }
}
if (__VLS_ctx.showForm) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showForm))
                    return;
                __VLS_ctx.showForm = false;
                // @ts-ignore
                [$t, teams, showForm, showForm,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('teamsList.new_ministry'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.createTeam) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.$t('houseGroups.name'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
    });
    (__VLS_ctx.form.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.$t('houseGroups.description'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.form.description),
        rows: "3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.$t('planTemplates.service_type'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.service_type),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "worship",
    });
    (__VLS_ctx.$t('teamsList.service_types_ministry.worship'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "sound",
    });
    (__VLS_ctx.$t('teamsList.service_types_ministry.sound'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "lights",
    });
    (__VLS_ctx.$t('teamsList.service_types_ministry.lights'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "welcome",
    });
    (__VLS_ctx.$t('teamsList.service_types_ministry.welcome'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "video",
    });
    (__VLS_ctx.$t('teamsList.service_types_ministry.video'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "other",
    });
    (__VLS_ctx.$t('teamsList.service_types_ministry.usher'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
    });
    (__VLS_ctx.$t('houseGroups.create'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showForm))
                    return;
                __VLS_ctx.showForm = false;
                // @ts-ignore
                [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, showForm, createTeam, form, form, form,];
            } },
        type: "button",
    });
    (__VLS_ctx.$t('houseGroups.cancel'));
}
// @ts-ignore
[$t,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
