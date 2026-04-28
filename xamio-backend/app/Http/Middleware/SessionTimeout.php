<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SessionTimeout
{
    protected int $timeout = 7200; // 2h en secondes

    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $lastActivity = Session::get('last_activity_time');

            if ($lastActivity && (time() - $lastActivity > $this->timeout)) {
                Auth::logout();
                Session::flush();

                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Session expirée. Veuillez vous reconnecter.'
                    ], 401);
                }

                return redirect()->route('login')
                    ->with('error', 'Session expirée. Veuillez vous reconnecter.');
            }

            Session::put('last_activity_time', time());
        }

        return $next($request);
    }
}