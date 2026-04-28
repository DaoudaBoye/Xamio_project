<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use App\Models\Scopes\ActionVisibilityScope;
use App\Services\UserRoleService;
use Illuminate\Http\Request;

class MesActionsController extends Controller
{
    public function __construct(
        private UserRoleService $roles,
        private ActionVisibilityScope $visibilityScope,
    ) {}

    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Action::with(['user', 'compteRendu.reunion']);

        $this->visibilityScope->apply($query, $user);

        $actions = $query
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => $a->toApiArray());

        return response()->json(['data' => $actions]);
    }

    public function updateStatut(Request $request, Action $action)
    {
        $this->authorize('updateStatut', $action);

        $request->validate([
            'action_statut' => 'required|in:a_faire,en_cours,termine,annule',
        ]);

        $user         = $request->user();
        $orgId        = $this->roles->getOrgId($user);
        $isPrivileged = $this->roles->isPrivileged($user, $orgId);

        // annule réservé aux privilégiés
        if (!$isPrivileged && $request->action_statut === 'annule') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        // Retour en arrière interdit aux non-privilégiés
        if (!$isPrivileged && !$action->canTransitionTo($request->action_statut)) {
            return response()->json(['message' => 'Vous ne pouvez pas revenir en arrière.'], 403);
        }

        $action->update(['action_statut' => $request->action_statut]);

        return response()->json(['data' => [
            'action_id'     => $action->action_id,
            'action_statut' => $action->action_statut,
        ]]);
    }
}