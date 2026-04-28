<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Appartenance;
use App\Models\Organisation;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // ── POST /api/auth/register ───────────────────────────────────────────────

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'org_nom'     => ['sometimes', 'string', 'max:255'],
            'util_prenom' => ['required', 'string', 'max:100'],
            'util_nom'    => ['required', 'string', 'max:100'],
            'email'       => ['required', 'email', 'unique:users,email'],
            'password'    => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'util_prenom.required' => 'Le prénom est obligatoire.',
            'util_nom.required'    => 'Le nom est obligatoire.',
            'email.required'       => 'L\'adresse email est obligatoire.',
            'email.unique'         => 'Un compte existe déjà avec cette adresse email.',
            'password.required'    => 'Le mot de passe est obligatoire.',
            'password.min'         => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed'   => 'La confirmation du mot de passe ne correspond pas.',
        ]);

        $user = User::create([
            'util_prenom'      => $request->util_prenom,
            'util_nom'         => $request->util_nom,
            'email'            => $request->email,
            'password'         => Hash::make($request->password),
            'util_twofa_actif' => false,
        ]);

        if ($request->filled('org_nom')) {
            $planGratuit = Plan::where('plan_nom', 'Gratuit')->first();
            $roleAdmin   = Role::where('role_nom', 'Admin Entreprise')->first();

            $organisation = Organisation::create([
                'org_nom'   => $request->org_nom,
                'org_slug'  => Str::slug($request->org_nom) . '-' . Str::random(5),
                'org_pays'  => 'Sénégal',
                'org_actif' => true,
            ]);

            $organisation->abonnements()->create([
                'abo_date_debut'   => now()->toDateString(),
                'abo_date_fin'     => now()->addYear()->toDateString(),
                'abo_statut'       => 'actif',
                'abo_montant_fcfa' => 0,
                'plan_id'          => $planGratuit->plan_id,
            ]);

            Appartenance::create([
                'org_id'         => $organisation->org_id,
                'user_id'        => $user->id,
                'role_id'        => $roleAdmin->role_id,
                'app_date_ajout' => now()->toDateString(),
                'app_statut'     => 'actif',
            ]);
        }

        $this->purgeExpiredTokens($user);

        $expiration = now()->addDays(30);
        $token      = $user->createToken('xamio-auth-token', ['*'], $expiration);

        return response()->json([
            'success' => true,
            'message' => 'Compte créé avec succès.',
            'data'    => [
                'user'       => $this->formatUser($user),
                'token'      => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiration->toIso8601String(),
            ],
        ], 201);
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required'    => 'L\'adresse email est obligatoire.',
            'password.required' => 'Le mot de passe est obligatoire.',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect.',
            ], 401);
        }

        $appartenance = Appartenance::where('user_id', $user->id)
            ->where('app_statut', 'actif')
            ->first();

        if (!$appartenance) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est suspendu. Contactez votre administrateur.',
            ], 403);
        }

        $this->purgeExpiredTokens($user);

        // ── Durée du token selon remember_me ──────────────────────────────────
        // Avant : 1 jour sans remember_me → déconnexion si le refresh rate le timer
        // Après : 7 jours → marge suffisante pour le refresh toutes les 20h
        $remember   = $request->boolean('remember_me');
        $expiration = $remember ? now()->addDays(90) : now()->addDays(7);
        $token      = $user->createToken('xamio-auth-token', ['*'], $expiration);

        UserSession::create([
            'sess_token_hash'      => hash('sha256', $token->plainTextToken),
            'sess_ip'              => $request->ip(),
            'sess_date_expiration' => $expiration,
            'sess_last_activity'   => now(),
            'org_id'               => $appartenance->org_id,
            'user_id'              => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie.',
            'data'    => [
                'user'       => $this->formatUser($user),
                'token'      => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiration->toIso8601String(),
            ],
        ]);
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $user  = $request->user();
        $token = $request->bearerToken();

        if ($token) {
            UserSession::where('user_id', $user->id)
                ->where('sess_token_hash', hash('sha256', $token))
                ->delete();
        }

        $user->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.',
        ]);
    }

    // ── POST /api/auth/logout-all ─────────────────────────────────────────────

    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();

        UserSession::where('user_id', $user->id)->delete();
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Toutes les sessions ont été fermées.',
        ]);
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'appartenances.organisation',
            'appartenances.role',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($user),
        ]);
    }

    // ── POST /api/auth/refresh ────────────────────────────────────────────────

    public function refresh(Request $request): JsonResponse
    {
        $user         = $request->user();
        $oldToken     = $request->bearerToken();
        $appartenance = Appartenance::where('user_id', $user->id)
            ->where('app_statut', 'actif')
            ->first();

        // ── Préserver la durée d'expiration originale ─────────────────────────
        // Avant : refresh recréait toujours un token à 24h → plafond dur
        // Après : on repart de l'expiration d'origine, au minimum 1 jour
        $originalExpiry = $user->currentAccessToken()?->expires_at;
        $expiration     = $originalExpiry && $originalExpiry->gt(now())
            ? $originalExpiry                          // conserver l'expiration d'origine
            : now()->addDays(7);                       // fallback 7j si déjà expiré

        // Supprimer uniquement la session courante
        if ($oldToken) {
            UserSession::where('user_id', $user->id)
                ->where('sess_token_hash', hash('sha256', $oldToken))
                ->delete();
        }

        $user->currentAccessToken()->delete();

        $token = $user->createToken('xamio-auth-token', ['*'], $expiration);

        if ($appartenance) {
            UserSession::create([
                'sess_token_hash'      => hash('sha256', $token->plainTextToken),
                'sess_ip'              => $request->ip(),
                'sess_date_expiration' => $expiration,
                'sess_last_activity'   => now(),
                'org_id'               => $appartenance->org_id,
                'user_id'              => $user->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Token renouvelé.',
            'data'    => [
                'token'      => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiration->toIso8601String(),
            ],
        ]);
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private function purgeExpiredTokens(User $user): void
    {
        $user->tokens()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->delete();

        UserSession::where('user_id', $user->id)
            ->where('sess_date_expiration', '<', now())
            ->delete();
    }

    private function formatUser(User $user): array
    {
        if (!$user->relationLoaded('appartenances')) {
            $user->load(['appartenances.organisation', 'appartenances.role']);
        }

        $appartenance = $user->appartenances
            ->where('app_statut', 'actif')
            ->first();

        return [
            'id'          => $user->id,
            'util_prenom' => $user->util_prenom,
            'util_nom'    => $user->util_nom,
            'nom_complet' => "{$user->util_prenom} {$user->util_nom}",
            'email'       => $user->email,
            'twofa_actif' => $user->util_twofa_actif,
            'role'        => $appartenance?->role?->role_nom,
            'app_statut'  => $appartenance?->app_statut,
            'organisation' => $appartenance?->organisation ? [
                'org_id'    => $appartenance->organisation->org_id,
                'org_nom'   => $appartenance->organisation->org_nom,
                'org_pays'  => $appartenance->organisation->org_pays,
                'org_actif' => $appartenance->organisation->org_actif,
            ] : null,
            'created_at' => $user->created_at->toIso8601String(),
        ];
    }
}