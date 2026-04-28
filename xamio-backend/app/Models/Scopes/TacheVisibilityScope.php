<?php

namespace App\Models\Scopes;

use App\Models\User;
use App\Services\UserRoleService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class TacheVisibilityScope
{
    public function __construct(private UserRoleService $roles) {}

    public function apply(Builder $query, User $user): void
    {
        $orgId = $this->roles->getOrgId($user);
        $query->where('org_id', $orgId);

        if ($this->roles->isAdmin($user, $orgId) || $this->roles->isDirecteur($user, $orgId)) {
            // Voit toutes les tâches de l'org
            return;
        }

        if ($this->roles->isManager($user, $orgId)) {
            $deptId = DB::table('membre_departements')
                ->where('user_id', $user->id)
                ->value('dept_id');

            if ($deptId) {
                $membreIds = DB::table('membre_departements')
                    ->where('dept_id', $deptId)
                    ->pluck('user_id')
                    ->toArray();

                $query->whereIn('user_id', $membreIds);
            } else {
                $query->where('user_id', $user->id);
            }
            return;
        }

        // Employé / Assistant : uniquement ses propres tâches
        $query->where('user_id', $user->id);
    }
}