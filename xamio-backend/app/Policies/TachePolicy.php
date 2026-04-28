<?php

namespace App\Policies;

use App\Models\Tache;
use App\Models\User;
use App\Services\UserRoleService;

class TachePolicy
{
    public function __construct(private UserRoleService $roles) {}

    public function update(User $user, Tache $tache): bool
    {
        $orgId = $this->roles->getOrgId($user);

        return $this->roles->isPrivileged($user, $orgId)
            || $tache->user_id === $user->id;
    }

    public function updateColonne(User $user, Tache $tache): bool
    {
        $orgId = $this->roles->getOrgId($user);

        return $this->roles->isAdmin($user, $orgId)
            || $tache->user_id === $user->id;
    }
}