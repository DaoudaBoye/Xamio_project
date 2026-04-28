import { useAuth } from '../context/AuthContext';

/**
 * usePermissions
 *
 * Rôles BDD (table `roles`) :
 *   1 - Super Admin       → accès total plateforme, cross-entreprises
 *   2 - Admin Entreprise  → gère son entreprise, users, settings
 *   3 - Manager           → crée réunions, tâches, ateliers, gère l'équipe
 *   4 - Assistant         → agenda directeur, RDV, réunions, documents
 *   5 - Employé           → ses propres tâches et réunions où il est invité
 *   6 - Directeur         → consultation stats, validation, agenda dédié
 *
 * Chaque vérification accepte :
 *   - le nom exact BDD  : "Super Admin", "Admin Entreprise", "Directeur"…
 *   - le slug technique : "super_admin", "admin", "manager"…
 *   - l'id numérique    : 1, 2, 3… (si l'API renvoie role_id)
 *   - insensible à la casse grâce à roleLow
 */
export function usePermissions() {
  const { user } = useAuth();

  // Supporte : user.roleRaw (slug), user.role (label affiché), user.role_id (int)
  const role    = (user?.roleRaw || user?.role || '').trim();
  const roleLow = role.toLowerCase(); // normalisé une fois, comparé partout
  const roleId  = Number(user?.role_id ?? user?.roleId ?? 0);

  /* ── Détection des rôles ───────────────────────────────────────────── */

  const isSuper = roleId === 1 || [
    'super_admin', 'superadmin', 'super admin',
  ].includes(roleLow);

  const isAdmin = isSuper || roleId === 2 || [
    'admin', 'admin entreprise', 'administrateur',
  ].includes(roleLow);

  const isManager = roleId === 3 || [
    'manager',
  ].includes(roleLow);

  const isAssistant = roleId === 4 || [
    'assistant', 'assistante',
  ].includes(roleLow);

  const isDirecteur = roleId === 6 || [
    'directeur',
  ].includes(roleLow);

  // Employé = tout utilisateur authentifié (rôle de base)
  const isEmploye = !!user;

  return {
    /* ── Rôles exposés ──────────────────────────────────────────────── */
    isSuper,
    isAdmin,
    isManager,
    isAssistant,
    isDirecteur,
    isEmploye,
    roleActuel: role,
    roleId,

    /* ── Navigation / Menu latéral ──────────────────────────────────── */
    voitPlanning:        true,
    voitEvenements:      isAdmin || isManager || isDirecteur,
    voitTaches:          isEmploye,
    voitDocuments:       isEmploye,
    voitParametres:      isEmploye,
    voitAgendaDirecteur: isAdmin || isDirecteur || isAssistant,

    /* ── Dashboard ──────────────────────────────────────────────────── */
    voitStatsGlobales:   isAdmin || isManager || isDirecteur,
    voitToutesReunions:  isAdmin || isManager || isDirecteur,
    voitToutesTaches:    isAdmin || isManager || isDirecteur,

    /* ── Réunions ───────────────────────────────────────────────────── */
    peutCreerReunion:       isAdmin || isManager || isAssistant,
    peutVoirToutesReunions: isAdmin || isManager || isDirecteur,
    peutRedigerCR:          isAdmin || isManager || isAssistant,

    /* ── Tâches ─────────────────────────────────────────────────────── */
    peutCreerTache:       isAdmin || isManager,
    peutAssignerTache:    isAdmin || isManager,
    peutVoirToutesTaches: isAdmin || isManager || isDirecteur,

    /* ── Documents ──────────────────────────────────────────────────── */
    peutUploaderDocument:  isAdmin || isManager || isAssistant,
    peutSupprimerDocument: isAdmin,

    /* ── Gestion entreprise ─────────────────────────────────────────── */
    peutGererUsers:      isAdmin,
    peutGererEntreprise: isAdmin,
    peutVoirParametres:  isAdmin,
    peutGererParametres: isAdmin,

    /* ── Rendez-vous / Ateliers ─────────────────────────────────────── */
    peutGererRDV:      isAdmin || isManager || isAssistant || isDirecteur,
    voitRDV:           isAdmin || isManager || isAssistant || isDirecteur,
    peutGererAteliers: isAdmin || isManager,
  };
}