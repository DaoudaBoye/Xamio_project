<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use Illuminate\Http\Request;

class MesActionsController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $orgId = $user->appartenances()->where('app_statut', 'actif')->value('org_id');

        $isAdmin = $user->appartenances()
            ->where('org_id', $orgId)
            ->where('app_statut', 'actif')
            ->whereHas('role', fn ($q) => $q->whereIn('role_nom', ['admin', 'super_admin']))
            ->exists();

        $isDirecteur = $user->appartenances()
            ->where('org_id', $orgId)
            ->where('app_statut', 'actif')
            ->whereHas('role', fn ($q) => $q->whereIn('role_nom', ['directeur']))
            ->exists();

        $isManager = $user->appartenances()
            ->where('org_id', $orgId)
            ->where('app_statut', 'actif')
            ->whereHas('role', fn ($q) => $q->whereIn('role_nom', ['manager']))
            ->exists();

        $query = Action::with(['user', 'compteRendu.reunion'])
            ->whereHas('compteRendu.reunion', fn ($q) => $q->where('org_id', $orgId));

        if ($isAdmin || $isDirecteur) {
            // Voit toutes les actions de l'org
        } elseif ($isManager) {
            // Voit les actions des réunions qu'il a créées
            $query->whereHas('compteRendu.reunion', fn ($q) => $q
                ->where('org_id', $orgId)
                ->where('user_id', $user->id) // ← réunions créées par lui
            );
        } else {
            // Employé / Assistant : uniquement ses propres actions
            $query->where('user_id', $user->id);
        }

        $actions = $query->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => [
                'action_id'       => $a->action_id,
                'action_texte'    => $a->action_texte,
                'action_echeance' => $a->action_echeance?->format('Y-m-d'),
                'action_statut'   => $a->action_statut,
                'user_id'         => $a->user_id,
                'assignee'        => $a->user
                    ? trim($a->user->util_prenom . ' ' . $a->user->util_nom)
                    : null,
                'reunion'         => $a->compteRendu?->reunion?->reun_titre ?? null,
            ]);

        return response()->json(['data' => $actions]);
    }

    public function updateStatut(Request $request, Action $action)
    {
        $request->validate([
            'action_statut' => 'required|in:todo,en_cours,fait',
        ]);

        $user  = $request->user();
        $orgId = $user->appartenances()->where('app_statut', 'actif')->value('org_id');

        $isPrivileged = $user->appartenances()
            ->where('org_id', $orgId)
            ->where('app_statut', 'actif')
            ->whereHas('role', fn ($q) => $q->whereIn('role_nom', ['admin', 'super_admin', 'manager', 'directeur']))
            ->exists();

        if (!$isPrivileged && $action->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        // Bloquer le retour en arrière pour les non-admins
        $order = ['todo' => 0, 'en_cours' => 1, 'fait' => 2];
        if (!$isPrivileged && $order[$request->action_statut] < $order[$action->action_statut]) {
            return response()->json(['message' => 'Vous ne pouvez pas revenir en arrière.'], 403);
        }

        $action->update(['action_statut' => $request->action_statut]);

        return response()->json(['data' => [
            'action_id'     => $action->action_id,
            'action_statut' => $action->action_statut,
        ]]);
    }
}