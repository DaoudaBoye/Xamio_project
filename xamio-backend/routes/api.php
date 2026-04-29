<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\ReunionController;
use App\Http\Controllers\Api\CompteRenduController;
use App\Http\Controllers\Api\RdvController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\DepartementController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TacheController;
use App\Http\Controllers\Api\MesActionsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════════

Route::get('/health', fn () => response()->json([
    'status'  => 'ok',
    'app'     => 'XAMIO API',
    'version' => '1.0.0',
]));

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES
// ══════════════════════════════════════════════════════════════════════════════

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::prefix('invitations/{token}')->group(function () {
    Route::get('/accept',  [InvitationController::class, 'accept']);
    Route::get('/decline', [InvitationController::class, 'decline']);
    Route::get('/maybe',   [InvitationController::class, 'maybe']);
});

// ══════════════════════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ══════════════════════════════════════════════════════════════════════════════

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
});

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES PROTÉGÉES
// ══════════════════════════════════════════════════════════════════════════════

Route::middleware(['auth:sanctum', 'session.inactivity'])->group(function () {

    // ── Authentification ──────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::get  ('/me',         [AuthController::class, 'me']);
        Route::post ('/logout',     [AuthController::class, 'logout']);
        Route::post ('/logout-all', [AuthController::class, 'logoutAll']);
    });

    // ── Dashboard ─────────────────────────────────────────────────────────────
    Route::get('/dashboard', function (Request $request) {
        $user = $request->user();

        $tachesQuery  = \App\Models\Tache::with('user');
        $actionsQuery = \App\Models\Action::with(['user', 'compteRendu.reunion']);

        app(\App\Models\Scopes\TacheVisibilityScope::class)->apply($tachesQuery, $user);
        app(\App\Models\Scopes\ActionVisibilityScope::class)->apply($actionsQuery, $user);

        $taches = $tachesQuery
            ->select('tache_id', 'tache_titre', 'tache_colonne', 'tache_priorite', 'tache_echeance', 'user_id')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => $t->toArray());

        $actions = $actionsQuery
            ->select('action_id', 'action_texte', 'action_statut', 'action_echeance', 'user_id', 'cr_id')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => $a->toApiArray());

        return response()->json([
            'taches'  => $taches,
            'actions' => $actions,
        ]);
    });

    // ── Réunions ──────────────────────────────────────────────────────────────
    Route::prefix('reunions')->group(function () {
        Route::get    ('/',                  [ReunionController::class, 'index']);
        Route::post   ('/',                  [ReunionController::class, 'store']);
        Route::get    ('/{reunion}',         [ReunionController::class, 'show']);
        Route::patch  ('/{reunion}/statut',  [ReunionController::class, 'updateStatut']);
        Route::patch  ('/{reunion}/reporter',[ReunionController::class, 'reporter']);
        Route::patch  ('/{reunion}/annuler', [ReunionController::class, 'annuler']);

        Route::prefix('/{reunId}/compte-rendu')->group(function () {
            Route::get    ('/',            [CompteRenduController::class, 'show']);
            Route::post   ('/generer',     [CompteRenduController::class, 'generer']);
            Route::post   ('/sauvegarder', [CompteRenduController::class, 'sauvegarder']);
            Route::post   ('/fichier',     [CompteRenduController::class, 'uploadFichier']);
            Route::get    ('/download',    [CompteRenduController::class, 'download']);
            Route::delete ('/',            [CompteRenduController::class, 'destroy']);
        });
    });

    // ── Rendez-vous ───────────────────────────────────────────────────────────
    Route::prefix('rendez-vous')->group(function () {
        Route::get    ('/',              [RdvController::class, 'index']);
        Route::post   ('/',              [RdvController::class, 'store']);
        Route::get    ('/{rdv}',         [RdvController::class, 'show']);
        Route::put    ('/{rdv}',         [RdvController::class, 'update']);
        Route::patch  ('/{rdv}/statut',  [RdvController::class, 'updateStatut']);
        Route::patch  ('/{rdv}/annuler', [RdvController::class, 'annuler']);
        Route::delete ('/{rdv}',         [RdvController::class, 'destroy']);
    });

    // ── Départements ──────────────────────────────────────────────────────────
    Route::apiResource('departements', DepartementController::class);
    Route::prefix('departements/{id}')->group(function () {
        Route::post   ('/membres',          [DepartementController::class, 'addMembre']);
        Route::delete ('/membres/{userId}', [DepartementController::class, 'removeMembre']);
    });

    // ── Utilisateurs ──────────────────────────────────────────────────────────
    Route::prefix('users')->group(function () {
        Route::get    ('/',            [UserController::class, 'index']);
        Route::post   ('/',            [UserController::class, 'store']);
        Route::put    ('/{id}',        [UserController::class, 'update']);
        Route::patch  ('/{id}/statut', [UserController::class, 'updateStatut']);
        Route::delete ('/{id}',        [UserController::class, 'destroy']);
    });

    // ── Membres du tenant ─────────────────────────────────────────────────────
    Route::get('/membres', function (Request $request) {
        $orgId = $request->user()
            ->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');

        $membres = \App\Models\User::whereHas('appartenances', fn ($q) =>
            $q->where('org_id', $orgId)->where('app_statut', 'actif')
        )
        ->select('id', 'util_nom', 'util_prenom', 'email')
        ->get()
        ->map(fn ($u) => [
            'id'    => $u->id,
            'name'  => trim($u->util_prenom . ' ' . $u->util_nom),
            'email' => $u->email,
        ]);

        return response()->json(['data' => $membres]);
    });

    // ── Tâches ────────────────────────────────────────────────────────────────
    Route::prefix('taches')->group(function () {
        Route::get   ('/',                [TacheController::class, 'index']);
        Route::post  ('/',                [TacheController::class, 'store']);
        Route::put   ('/{tache}',         [TacheController::class, 'update']);
        Route::patch ('/{tache}/colonne', [TacheController::class, 'updateColonne']);
    });

    // ── Actions CR ────────────────────────────────────────────────────────────
    Route::get   ('/mes-actions',             [MesActionsController::class, 'index']);
    Route::patch ('/actions/{action}/statut', [MesActionsController::class, 'updateStatut']);

}); // fin des routes protégées