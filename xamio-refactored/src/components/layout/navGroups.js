/**
 * Remplace la constante NAV_GROUPS et la logique des groupes
 * dans ton Sidebar.js existant.
 *
 * 1. Ajoute l'import en haut du fichier :
 *    import { usePermissions } from '../../hooks/usePermissions';
 *
 * 2. Dans le composant Sidebar(), ajoute après useAuth() :
 *    const perms = usePermissions();
 *
 * 3. Remplace la constante NAV_GROUPS par NAV_GROUPS_CONFIG ci-dessous
 *    (en dehors du composant, statique)
 *
 * 4. Remplace la ligne :
 *    const groups = NAV_GROUPS.map(...)
 *    par :
 *    const groups = buildNavGroups(perms);
 */

// ── Config statique (en dehors du composant) ──────────────────────────────────

const NAV_GROUPS_CONFIG = [
  {
    label: null,
    items: [
      { path: '/', label: 'Tableau de bord', end: true, permission: null },
    ],
  },
  {
    label: 'Planification',
    permission: 'voitPlanning',   // tout le groupe masqué si false
    items: [
      {
        label: 'Planning',
        permission: 'voitPlanning',
        subItems: [
          { path: '/agenda',       label: 'Calendrier',   permission: null },
          { path: '/meetings',     label: 'Réunions',     permission: null },
          { path: '/appointments', label: 'Rendez-vous', permission: 'voitRDV' },
          { path: '/workshops',    label: 'Ateliers',     permission: 'peutGererAteliers' },
        ],
      },
      { path: '/events', label: 'Événements', permission: 'voitEvenements' },
      { path: '/agenda-directeur', label: 'Agenda Directeur', permission: 'voitAgendaDirecteur' },
    ],
  },
  {
    label: 'Exécution',
    items: [
      { path: '/tasks',     label: 'Tâches',    permission: 'voitTaches' },
      { path: '/documents', label: 'Documents', permission: 'voitDocuments' },
    ],
  },
  {
    label: 'Système',
    items: [
      { path: '/notifications', label: 'Notifications', badge: true, permission: null },
      { path: '/settings',      label: 'Paramètres',    permission: 'voitParametres' },
    ],
  },
];

// ── Fonction de construction du menu filtré ───────────────────────────────────

export function buildNavGroups(perms) {
  return NAV_GROUPS_CONFIG
    .filter(group => {
      // Masquer le groupe entier si sa permission est false
      if (group.permission && !perms[group.permission]) return false;
      return true;
    })
    .map(group => ({
      ...group,
      items: group.items
        .filter(item => {
          // Masquer l'item si sa permission est false
          if (item.permission && !perms[item.permission]) return false;
          return true;
        })
        .map(item => {
          // Filtrer les sous-items aussi
          if (item.subItems) {
            return {
              ...item,
              subItems: item.subItems.filter(sub => {
                if (sub.permission && !perms[sub.permission]) return false;
                return true;
              }),
            };
          }
          return item;
        })
        // Supprimer les groupes Planning vides
        .filter(item => !item.subItems || item.subItems.length > 0),
    }))
    // Supprimer les groupes sans items
    .filter(group => group.items.length > 0);
}