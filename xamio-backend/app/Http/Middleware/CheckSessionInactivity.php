<?php

namespace App\Http\Middleware;

use App\Models\UserSession;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;

class CheckSessionInactivity
{
    private int $timeout;

    public function __construct()
    {
        $this->timeout = (int) config('auth.session_timeout', 14400);
    }

    public function handle(Request $request, Closure $next)
    {
        $user  = $request->user();
        $token = $request->bearerToken();

        if (!$user || !$token) {
            return $next($request);
        }

        $hash    = hash('sha256', $token);
        $session = UserSession::where('user_id', $user->id)
                              ->where('sess_token_hash', $hash)
                              ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session introuvable.',
                'code'    => 'SESSION_NOT_FOUND',
            ], 401);
        }

        // ── 1. Token Sanctum expiré ? ─────────────────────────────────────────
        $sanctumToken = $user->currentAccessToken();
        if ($sanctumToken?->expires_at && now()->gt($sanctumToken->expires_at)) {
            $session->delete();
            $sanctumToken->delete();

            return response()->json([
                'success' => false,
                'message' => 'Token expiré. Veuillez vous reconnecter.',
                'code'    => 'TOKEN_EXPIRED',
            ], 401);
        }

        // ── 2. Inactivité ? ───────────────────────────────────────────────────
        if ($session->sess_last_activity) {
            // diffInSeconds(date, false) → valeur SIGNÉE :
            //   positive  = $session->sess_last_activity est dans le passé  ✅
            //   négative  = horloge serveur en avance (cas pathologique)
            $inactiveFor = now()->diffInSeconds(
                Carbon::parse($session->sess_last_activity),
                false
            );

            if ($inactiveFor > $this->timeout) {
                $session->delete();
                $user->currentAccessToken()->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'Session expirée pour cause d\'inactivité. Veuillez vous reconnecter.',
                    'code'    => 'SESSION_TIMEOUT',
                ], 401);
            }
        }

        // ── 3. Rafraîchir last_activity ───────────────────────────────────────
        $session->update(['sess_last_activity' => now()]);

        return $next($request);
    }
}