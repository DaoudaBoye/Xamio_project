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
            'description'    => 'nullable|string',                          // ✅ ajouté
            'tache_echeance' => 'nullable|date',
            'tache_priorite' => 'in:' . implode(',', Tache::PRIORITES),    // low,medium,high
            'tache_colonne'  => 'in:' . implode(',', Tache::COLONNES),     // todo,inprogress,done
            'user_id'        => 'nullable|exists:users,id',
            'dept_id'        => 'nullable|exists:departements,dept_id',    // ✅ ajouté
        ]);

        $orgId = $this->roles->getOrgId($request->user());

        $tache = Tache::create([
            'tache_titre'    => $validated['tache_titre'],
            'description'    => $validated['description'] ?? null,         // ✅ ajouté
            'tache_priorite' => $validated['tache_priorite'] ?? 'medium',  // ✅ 'normale' → 'medium'
            'tache_colonne'  => $validated['tache_colonne']  ?? 'todo',    // ✅ 'a_faire' → 'todo'
            'tache_echeance' => $validated['tache_echeance'] ?? null,
            'user_id'        => $validated['user_id'] ?? null,
            'dept_id'        => $validated['dept_id'] ?? null,             // ✅ ajouté
            'org_id'         => $orgId,
        ]);

        return response()->json(['data' => $tache->load('user')->toArray()], 201);
    }

    public function update(Request $request, Tache $tache)
    {
        $this->authorize('update', $tache);

        $validated = $request->validate([
            'tache_titre'    => 'sometimes|string|max:255',
            'description'    => 'nullable|string',                         // ✅ ajouté
            'tache_echeance' => 'nullable|date',
            'tache_priorite' => 'sometimes|in:' . implode(',', Tache::PRIORITES), // ✅ sometimes
            'tache_colonne'  => 'sometimes|in:' . implode(',', Tache::COLONNES),  // ✅ sometimes
            'user_id'        => 'sometimes|nullable|exists:users,id',
            'dept_id'        => 'sometimes|nullable|exists:departements,dept_id', // ✅ ajouté
        ]);

        $tache->update($validated);

        return response()->json(['data' => $tache->fresh()->toArray()]);   // ✅ fresh() après update
    }

    public function updateColonne(Request $request, Tache $tache)
    {
        $this->authorize('updateColonne', $tache);

        $request->validate([
            'tache_colonne' => 'required|in:' . implode(',', Tache::COLONNES),
        ]);

        $tache->update(['tache_colonne' => $request->tache_colonne]);

        return response()->json(['data' => $tache->fresh()->toArray()]);   // ✅ fresh()
    }
}