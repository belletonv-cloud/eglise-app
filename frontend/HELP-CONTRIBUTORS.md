# Ajouter ou modifier l’aide contextuelle (PageHelp)

Toutes les pages principales utilisent le composant universel `PageHelp.vue` pour afficher l’aide UX/modal. Voici comment participer, enrichir, ou éditer une aide :

## 1. Intégrer l’aide sur une page

Dans la Vue concernée (ex : `PlansList.vue`), placer le composant en haut :

```vue
<PageHelp page="plans" :helpText="$t('help.plans')" />
```

- `page` : identifiant stable de la page (ex : "plans", "members")
- `helpText` : clé i18n contenant l’aide principale
- `:steps` (optionnel) : tableau d’étapes pour un mini-tour guidé (voir plus bas)

## 2. Ajouter ou éditer un texte d’aide (i18n)

Dans `src/locales/fr.ts` et `en.ts` :

```js
help: {
  plans: "Description détaillée française...",
  // ...
},
```

Pour l’anglais, idem :

```js
help: {
  plans: "Detailed page description in English...",
  // ...
},
```

## 3. Ajouter un tour interactif (steps)

Dans le `<script setup>` de la page :

```js
const helpSteps = [
  {
    title: t('help.plans_step1_title'),
    desc: t('help.plans_step1_desc'),
    selector: '.selector-css-optional'
  },
  // ...
]
```

Puis :

```vue
<PageHelp page="plans" :helpText="$t('help.plans')" :steps="helpSteps" />
```

⚠️ Seules les clés avec `title` et `desc` sont requises (par langue !).

## 4. Accessibilité & règles UX
- Le bouton est toujours accessible clavier/tab, fermable avec esc/✕
- La modale ne sort jamais de l’écran, focus-lock

## 5. Suppression du mode démo
- Le mode démo/tour interactif n’existe plus. Aucune clé ou composant “demo” ne doit apparaître dans le code.

## 6. Lister ou contribuer à l’aide
- Voir toutes les pages avec `<PageHelp` dans `src/views` pour leur couverture
- Pour toute contribution, éditer `src/locales/fr.ts` et `en.ts` + la page concernée

---

**Exemple rapide :**

```vue
<!-- PageHelp dans une page -->
<PageHelp page="members" :helpText="$t('help.members')" :steps="helpSteps" />
```

```js
// Ajout steps dans la page
const helpSteps = [
  { title: t('help.members_step1_title'), desc: t('help.members_step1_desc') },
  { title: t('help.members_step2_title'), desc: t('help.members_step2_desc') },
]
```

```js
// i18n/en.ts et fr.ts
help: {
  members: "...",
  members_step1_title: "Filtrer les membres",
  members_step1_desc: "Utilisez le filtre...",
  // ...
}
```
