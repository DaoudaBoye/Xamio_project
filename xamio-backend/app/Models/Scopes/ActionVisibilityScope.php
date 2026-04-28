<?php

namespace App\Models\Scopes;

use App\Models\User;
use App\Services\UserRoleService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ActionVisibilityScope
{
    public function __construct(private UserRoleService $roles) {}

    public function apply(Builder $query, User $user): void
    {
        $orgId = $this->roles->getOrgId($user);

        $query->whereHas(
            'compteRendu.reunion',
            fn($q) => $q->where('org_id', $orgId)
        );

        if ($this->roles->isAdmin($user, $orgId) || $this->roles->isDirecteur($user, $orgId)) {
            // Voit toutes les actions de l'org
            return;
        }

        if ($this->roles->isManager($user, $orgId)) {
            // Récupérer les membres du département du manager
            $deptId = DB::table('membre_departements')
                ->where('user_id', $user->id)
                ->value('dept_id');

            if ($deptId) {
                $membreIds = DB::table('membre_departements')
                    ->where('dept_id', $deptId)
                    ->pluck('user_id')
                    ->toArray();

                // Voit les actions assignées aux membres de son département
                $query->whereIn('user_id', $membreIds);
            } else {
                // Pas de département → uniquement ses propres actions
                $query->where('user_id', $user->id);
            }

            return;
        }

        // Employé / Assistant : uniquement ses propres actions
        $query->where('user_id', $user->id);
    }
}