<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class TacheController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $orgId = $user->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');

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

        $query = Tache::with('user')->where('org_id', $orgId);

        if ($isAdmin || $isDirecteur) {
            // Voit toutes les tâches de l'org
        } elseif ($isManager) {
            // Récupérer le dept_id du manager
            $deptId = DB::table('membre_departements')
                ->where('user_id', $user->id)
                ->value('dept_id');

            if ($deptId) {
                // Voit les tâches de son département
                $query->where('dept_id', $deptId);
            } else {
                // Pas de département assigné → uniquement ses propres tâches
                $query->where('user_id', $user->id);
            }
        } else {
            // Employé / Assistant : uniquement ses propres tâches
            $query->where('user_id', $user->id);
        }

        $taches = $query->orderByDesc('created_at')->get()->map(fn ($t) => [
            'tache_id'       => $t->tache_id,
            'tache_titre'    => $t->tache_titre,
            'tache_echeance' => $t->tache_echeance,
            'tache_priorite' => $t->tache_priorite,
            'tache_colonnes' => $t->tache_colonne,
            'description'    => $t->description,
            'user_id'        => $t->user_id,
            'dept_id'        => $t->dept_id,
            'user'           => $t->user ? [
                'util_prenom' => $t->user->util_prenom,
                'util_nom'    => $t->user->util_nom,
            ] : null,
            'tags'           => $t->tags ?? [],
        ]);

        return response()->json(['data' => $taches]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tache_titre'    => 'required|string|max:255',
            'tache_echeance' => 'nullable|date',
            'tache_priorite' => 'in:high,medium,low',
            'tache_colonnes' => 'in:todo,inprogress,done',
            'user_id'        => 'nullable|exists:users,id',
            'description'    => 'nullable|string',
        ]);

        $user  = $request->user();
        $orgId = $user->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');

        // Récupérer le dept_id du créateur
        $deptId = DB::table('membre_departements')
            ->where('user_id', $user->id)
            ->value('dept_id');

        $tache = Tache::create([
            'tache_titre'    => $validated['tache_titre'],
            'tache_priorite' => $validated['tache_priorite'] ?? 'medium',
            'tache_colonne'  => $validated['tache_colonnes'] ?? 'todo',
            'tache_echeance' => $validated['tache_echeance'] ?? null,
            'description'    => $validated['description'] ?? null,
            'user_id'        => $validated['user_id'] ?? null,
            'dept_id'        => $deptId, // ← département du créateur
            'org_id'         => $orgId,
        ]);

        return response()->json(['data' => $tache->load('user')], 201);
    }

    public function update(Request $request, Tache $tache)
    {
        $this->authorize('update', $tache);

        $validated = $request->validate([
            'tache_titre'    => 'sometimes|string|max:255',
            'tache_echeance' => 'nullable|date',
            'tache_priorite' => 'in:high,medium,low',
            'tache_colonnes' => 'in:todo,inprogress,done',
            'description'    => 'nullable|string',
        ]);

        if (isset($validated['tache_colonnes'])) {
            $validated['tache_colonne'] = $validated['tache_colonnes'];
            unset($validated['tache_colonnes']);
        }

        $tache->update($validated);

        return response()->json(['data' => $tache]);
    }

    public function updateColonne(Request $request, Tache $tache)
    {
        $request->validate([
            'tache_colonnes' => 'required|in:todo,inprogress,done',
        ]);

        $user  = $request->user();
        $orgId = $user->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');

        $isAdmin = $user->appartenances()
            ->where('org_id', $orgId)
            ->where('app_statut', 'actif')
            ->whereHas('role', fn ($q) => $q->whereIn('role_nom', ['admin', 'super_admin']))
            ->exists();

        if (!$isAdmin && $tache->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $tache->update(['tache_colonne' => $request->tache_colonnes]);

        return response()->json(['data' => $tache]);
    }
}