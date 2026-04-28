<?php

namespace App\Services;

use App\Models\User;

class UserRoleService
{
    public function getOrgId(User $user): ?int
    {
        return $user->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');
    }

    public function hasRole(User $user, int $orgId, array $roles): bool
    {
        return $user->appartenances()
            ->where('org_id', $orgId)
            ->where('app_statut', 'actif')
            ->whereHas('role', fn($q) => $q->whereIn('role_nom', $roles))
            ->exists();
    }

    public function isAdmin(User $user, int $orgId): bool
    {
        // ✅ Valeurs exactes du seeder
        return $this->hasRole($user, $orgId, ['Super Admin', 'Admin Entreprise']);
    }

    public function isDirecteur(User $user, int $orgId): bool
    {
        return $this->hasRole($user, $orgId, ['Directeur']);
    }

    public function isManager(User $user, int $orgId): bool
    {
        return $this->hasRole($user, $orgId, ['Manager']);
    }

    public function isPrivileged(User $user, int $orgId): bool
    {
        return $this->hasRole($user, $orgId, ['Super Admin', 'Admin Entreprise', 'Directeur', 'Manager', 'Assistant']);
    }
}