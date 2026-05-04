<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use App\Models\MembreDepartement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartementController extends Controller
{
    /**
     * GET /api/departements
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        if (!$orgId) {
            return response()->json(['success' => false, 'message' => 'Organisation introuvable.'], 403);
        }

        $departements = Departement::where('org_id', $orgId)
            ->where('dept_actif', true)
            ->with([
                'manager:id,util_prenom,util_nom,email',
                'membres' => fn($q) => $q->select('users.id', 'users.util_prenom', 'users.util_nom', 'users.email'),
            ])
            ->withCount('membres')
            ->orderBy('dept_nom')
            ->get()
            ->map(fn($d) => [
                'dept_id'          => $d->dept_id,
                'dept_nom'         => $d->dept_nom,
                'dept_description' => $d->dept_description,
                'dept_actif'       => $d->dept_actif,
                'user_id'          => $d->user_id,   // ← pour pré-remplir le select manager
                'manager'          => $d->manager ? [
                    'id'    => $d->manager->id,
                    'nom'   => trim($d->manager->util_prenom . ' ' . $d->manager->util_nom),
                    'email' => $d->manager->email,
                ] : null,
                'membres_count' => $d->membres_count,
                'membres'       => $d->membres->map(fn($u) => [
                    'user_id'     => $u->id,
                    'util_prenom' => $u->util_prenom,
                    'util_nom'    => $u->util_nom,
                    'email'       => $u->email,
                ]),
            ]);

        return response()->json([
            'success'      => true,
            'departements' => $departements,
        ]);
    }

    /**
     * POST /api/departements
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dept_nom'         => 'required|string|max:100',
            'dept_description' => 'nullable|string|max:255',
            'user_id'          => 'nullable|exists:users,id',
        ]);

        $orgId = $this->getOrgId($request->user());

        if (!$orgId) {
            return response()->json(['success' => false, 'message' => 'Organisation introuvable.'], 403);
        }

        $exists = Departement::where('org_id', $orgId)
            ->where('dept_nom', $validated['dept_nom'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Un département avec ce nom existe déjà.',
            ], 422);
        }

        $departement = Departement::create([
            'dept_nom'         => $validated['dept_nom'],
            'dept_description' => $validated['dept_description'] ?? null,
            'dept_actif'       => true,
            'user_id'          => $validated['user_id'] ?? null,
            'org_id'           => $orgId,
        ]);

        return response()->json([
            'success'     => true,
            'message'     => 'Département créé avec succès.',
            'departement' => $departement->load('manager:id,util_prenom,util_nom'),
        ], 201);
    }

    /**
     * GET /api/departements/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        $departement = Departement::where('dept_id', $id)
            ->where('org_id', $orgId)
            ->with([
                'manager:id,util_prenom,util_nom,email',
                'membres' => fn($q) => $q->select('users.id', 'users.util_prenom', 'users.util_nom', 'users.email'),
            ])
            ->firstOrFail();

        return response()->json([
            'success'     => true,
            'departement' => [
                'dept_id'          => $departement->dept_id,
                'dept_nom'         => $departement->dept_nom,
                'dept_description' => $departement->dept_description,
                'dept_actif'       => $departement->dept_actif,
                'user_id'          => $departement->user_id,
                'manager'          => $departement->manager ? [
                    'id'    => $departement->manager->id,
                    'nom'   => trim($departement->manager->util_prenom . ' ' . $departement->manager->util_nom),
                    'email' => $departement->manager->email,
                ] : null,
                'membres' => $departement->membres->map(fn($u) => [
                    'user_id'     => $u->id,
                    'util_prenom' => $u->util_prenom,
                    'util_nom'    => $u->util_nom,
                    'email'       => $u->email,
                ]),
            ],
        ]);
    }

    /**
     * PUT /api/departements/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'dept_nom'         => 'sometimes|string|max:100',
            'dept_description' => 'nullable|string|max:255',
            'user_id'          => 'nullable|exists:users,id',
            'dept_actif'       => 'sometimes|boolean',
        ]);

        $orgId = $this->getOrgId($request->user());

        $departement = Departement::where('dept_id', $id)
            ->where('org_id', $orgId)
            ->firstOrFail();

        $departement->update($validated);

        $departement->load('manager:id,util_prenom,util_nom');

        return response()->json([
            'success'     => true,
            'message'     => 'Département mis à jour.',
            'departement' => [
                'dept_id'          => $departement->dept_id,
                'dept_nom'         => $departement->dept_nom,
                'dept_description' => $departement->dept_description,
                'dept_actif'       => $departement->dept_actif,
                'user_id'          => $departement->user_id,
                'manager'          => $departement->manager ? [
                    'id'    => $departement->manager->id,
                    'nom'   => trim($departement->manager->util_prenom . ' ' . $departement->manager->util_nom),
                    'email' => $departement->manager->email,
                ] : null,
            ],
        ]);
    }

    /**
     * DELETE /api/departements/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        $departement = Departement::where('dept_id', $id)
            ->where('org_id', $orgId)
            ->firstOrFail();

        $departement->update(['dept_actif' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Département désactivé.',
        ]);
    }

    /**
     * POST /api/departements/{id}/membres
     */
    public function addMembre(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $orgId = $this->getOrgId($request->user());

        $departement = Departement::where('dept_id', $id)
            ->where('org_id', $orgId)
            ->firstOrFail();

        $exists = MembreDepartement::where('dept_id', $id)
            ->where('user_id', $validated['user_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Cet utilisateur est déjà membre de ce département.',
            ], 422);
        }

        MembreDepartement::create([
            'user_id'             => $validated['user_id'],
            'dept_id'             => $id,
            'membdept_date_ajout' => now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Membre ajouté au département.',
        ], 201);
    }

    /**
     * DELETE /api/departements/{id}/membres/{userId}
     */
    public function removeMembre(Request $request, int $id, int $userId): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        Departement::where('dept_id', $id)
            ->where('org_id', $orgId)
            ->firstOrFail();

        MembreDepartement::where('dept_id', $id)
            ->where('user_id', $userId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Membre retiré du département.',
        ]);
    }

    /* ── Helper privé ── */
    private function getOrgId($user): ?int
    {
        if (!empty($user->org_id)) return (int) $user->org_id;

        $appartenance = $user->appartenances()
            ->where('app_statut', 'actif')
            ->first();

        return $appartenance ? (int) $appartenance->org_id : null;
    }
}