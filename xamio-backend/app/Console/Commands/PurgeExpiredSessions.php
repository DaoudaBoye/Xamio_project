<?php

namespace App\Console\Commands;

use App\Models\UserSession;
use Illuminate\Console\Command;

class PurgeExpiredSessions extends Command
{
    protected $signature   = 'sessions:purge';
    protected $description = 'Supprime les sessions expirées ou inactives';

    public function handle(): void
    {
        $timeout = config('auth.session_timeout', 7200);

        $deleted = UserSession::where('sess_date_expiration', '<', now())
            ->orWhere('sess_last_activity', '<', now()->subSeconds($timeout))
            ->delete();

        $this->info("$deleted session(s) supprimée(s).");
    }
}