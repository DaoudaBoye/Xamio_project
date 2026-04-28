<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Appartenance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * GET /api/users
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        if (!$orgId) {
            return response()->json(['success' => false, 'message' => 'Aucune organisation active.'], 403);
        }

        $users = User::select(
                'users.id',
                'users.util_prenom',
                'users.util_nom',
                'users.email',
                'users.created_at',
                'appartenances.app_statut',
                'appartenances.role_id',
                'roles.role_nom',
            )
            ->join('appartenances', function ($join) use ($orgId) {
                $join->on('appartenances.user_id', '=', 'users.id')
                     ->where('appartenances.org_id', $orgId);
            })
            ->leftJoin('roles', 'roles.role_id', '=', 'appartenances.role_id')
            ->orderBy('roles.role_id')
            ->orderBy('users.util_nom')
            ->get()
            ->map(fn ($u) => [
                'id'         => $u->id,
                'prenom'     => $u->util_prenom,
                'nom'        => $u->util_nom,
                'email'      => $u->email,
                'role'       => $u->role_nom,
                'role_id'    => $u->role_id,
                'status'     => $u->app_statut ?? 'inactif',
                'created_at' => $u->created_at?->toDateString(),
            ]);

        return response()->json(['success' => true, 'data' => $users]);
    }

    /**
     * POST /api/users
     */
    public function store(Request $request): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        if (!$orgId) {
            return response()->json(['success' => false, 'message' => 'Aucune organisation active.'], 403);
        }

        $validated = $request->validate([
            'prenom'   => 'required|string|max:100',
            'nom'      => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => ['required', Password::min(8)],
            'role_id'  => 'required|exists:roles,role_id',
        ]);

        $user = User::create([
            'util_prenom'      => $validated['prenom'],
            'util_nom'         => $validated['nom'],
            'email'            => $validated['email'],
            'password'         => Hash::make($validated['password']),
            'util_twofa_actif' => false,
        ]);

        Appartenance::create([
            'org_id'         => $orgId,
            'user_id'        => $user->id,
            'role_id'        => $validated['role_id'],
            'app_date_ajout' => now()->toDateString(),
            'app_statut'     => 'actif',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur créé avec succès.',
            'user'    => [
                'id'     => $user->id,
                'prenom' => $user->util_prenom,
                'nom'    => $user->util_nom,
                'email'  => $user->email,
                'status' => 'actif',
            ],
        ], 201);
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        if (!$orgId) {
            return response()->json(['success' => false], 403);
        }

        $user = User::whereHas('appartenances', fn ($q) =>
            $q->where('org_id', $orgId)
        )->findOrFail($id);

        $validated = $request->validate([
            'prenom'  => 'sometimes|string|max:100',
            'nom'     => 'sometimes|string|max:100',
            'email'   => 'sometimes|email|unique:users,email,' . $id,
            'role_id' => 'sometimes|exists:roles,role_id',
        ]);

        $user->update([
            'util_prenom' => $validated['prenom'] ?? $user->util_prenom,
            'util_nom'    => $validated['nom']    ?? $user->util_nom,
            'email'       => $validated['email']  ?? $user->email,
        ]);

        if (isset($validated['role_id'])) {
            Appartenance::where('org_id', $orgId)
                ->where('user_id', $id)
                ->update(['role_id' => $validated['role_id']]);
        }

        return response()->json(['success' => true, 'message' => 'Utilisateur mis à jour.']);
    }

    /**
     * PATCH /api/users/{id}/statut
     */
    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        if (!$orgId) {
            return response()->json(['success' => false], 403);
        }

        $validated = $request->validate([
            'app_statut' => 'required|in:actif,inactif,suspendu',
        ]);

        Appartenance::where('org_id', $orgId)
            ->where('user_id', $id)
            ->firstOrFail()
            ->update(['app_statut' => $validated['app_statut']]);

        return response()->json(['success' => true, 'message' => 'Statut mis à jour.']);
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $orgId = $this->getOrgId($request->user());

        if (!$orgId) {
            return response()->json(['success' => false], 403);
        }

        Appartenance::where('org_id', $orgId)
            ->where('user_id', $id)
            ->firstOrFail()
            ->delete();

        return response()->json(['success' => true, 'message' => "Utilisateur retiré de l'organisation."]);
    }

    // ── Pas de getOrgId ici — héritée de app/Http/Controllers/Controller.php ──
    /**
     * Retourne l'org_id de l'utilisateur connecté.
     */
    protected function getOrgId($user): ?int
    {
        if (!$user) return null;

        if (!empty($user->org_id)) return (int) $user->org_id;

        $appartenance = $user->appartenances()
            ->where('app_statut', 'actif')
            ->first();

        if ($appartenance) return (int) $appartenance->org_id;

        if (method_exists($user, 'organisations')) {
            $org = $user->organisations()->first();
            if ($org) return (int) $org->org_id;
        }

        return null;
    }
}