<?php

namespace App\Policies;

use App\Models\Tache;
use App\Models\User;
use App\Services\UserRoleService;

class TachePolicy
{
    public function __construct(private UserRoleService $roles) {}

    /**
     * Modifier le contenu (titre, description, priorité, échéance…)
     * → Admin OU Manager appartenant au même département que la tâche
     */
    public function update(User $user, Tache $tache): bool
    {
        $orgId = $this->roles->getOrgId($user);
        if (!$orgId) return false;

        if ($this->roles->isAdmin($user, $orgId)) return true;

        if ($this->roles->isManager($user, $orgId)) {
            return $tache->dept_id !== null
                && $user->departements()
                         ->where('dept_id', $tache->dept_id)
                         ->exists();
        }

        return false;
    }

    /**
     * Déplacer entre colonnes
     * → Admin, Manager du même département, OU employé assigné à la tâche
     */
    public function updateColonne(User $user, Tache $tache): bool
    {
        $orgId = $this->roles->getOrgId($user);
        if (!$orgId) return false;

        if ($this->roles->isAdmin($user, $orgId)) return true;

        if ($this->roles->isManager($user, $orgId)) {
            return $tache->dept_id !== null
                && $user->departements()
                         ->where('dept_id', $tache->dept_id)
                         ->exists();
        }

        // Employé assigné : peut déplacer uniquement, pas modifier
        return $tache->user_id !== null
            && $tache->user_id === $user->id;
    }
}