<?php

namespace App\Policies;

use App\Models\Action;
use App\Models\User;
use App\Services\UserRoleService;

class ActionPolicy
{
    public function __construct(private UserRoleService $roles) {}

    public function updateStatut(User $user, Action $action): bool
    {
        $orgId = $this->roles->getOrgId($user);

        return $this->roles->isPrivileged($user, $orgId)
            || $action->user_id === $user->id;
    }
}