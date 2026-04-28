<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tache;
use App\Models\Scopes\TacheVisibilityScope;
use App\Services\UserRoleService;
use Illuminate\Http\Request;

class TacheController extends Controller
{
    public function __construct(
        private UserRoleService $roles,
        private TacheVisibilityScope $visibilityScope,
    ) {}

    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Tache::with('user');

        $this->visibilityScope->apply($query, $user);

        $taches = $query
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => $t->toArray());

        return response()->json(['data' => $taches]);
    }

   public function store(Request $request)
    {
        $validated = $request->validate([
            'tache_titre'    => 'required|string|max:255',
            'tache_echeance' => 'nullable|date',
            'tache_priorite' => 'in:' . implode(',', Tache::PRIORITES), // basse,normale,haute,urgente
            'tache_colonne'  => 'in:' . implode(',', Tache::COLONNES),  // a_faire,en_cours,en_revision,termine
            'user_id'        => 'nullable|exists:users,id',
        ]);

        $user  = $request->user();
        $orgId = $this->roles->getOrgId($user);

        $tache = Tache::create([
            'tache_titre'    => $validated['tache_titre'],
            'tache_priorite' => $validated['tache_priorite'] ?? 'normale',
            'tache_colonne'  => $validated['tache_colonne'] ?? 'a_faire',
            'tache_echeance' => $validated['tache_echeance'] ?? null,
            'user_id'        => $validated['user_id'] ?? null,
            'org_id'         => $orgId,
        ]);

        return response()->json(['data' => $tache->load('user')->toArray()], 201);
    }

    public function update(Request $request, Tache $tache)
    {
        $this->authorize('update', $tache);

        $validated = $request->validate([
            'tache_titre'    => 'sometimes|string|max:255',
            'tache_echeance' => 'nullable|date',
            'tache_priorite' => 'in:' . implode(',', Tache::PRIORITES),
            'tache_colonne'  => 'in:' . implode(',', Tache::COLONNES),
            // 'description' supprimé — colonne absente de la migration
        ]);

        $tache->update($validated);

        return response()->json(['data' => $tache->toArray()]);
    }

    public function updateColonne(Request $request, Tache $tache)
    {
        $this->authorize('updateColonne', $tache);

        $request->validate([
            'tache_colonne' => 'required|in:' . implode(',', Tache::COLONNES),
        ]);

        $tache->update(['tache_colonne' => $request->tache_colonne]);

        return response()->json(['data' => $tache->toArray()]);
    }
}