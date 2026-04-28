<?php

namespace App\Console\Commands;

use App\Models\Reunion;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SyncMeetingStatuses extends Command
{
    protected $signature   = 'reunions:sync-statuts';
    protected $description = 'Met à jour les statuts des réunions selon l\'heure courante';

    public function handle(): void
    {
        $now = Carbon::now();

        // planifiee → en_cours
        Reunion::where('reun_statut', 'planifiee')
            ->whereRaw(
                "TIMESTAMP(reun_date, reun_heure) <= ?",
                [$now->toDateTimeString()]
            )
            ->update(['reun_statut' => 'en_cours']);

        // en_cours → terminee  (fin = début + durée en minutes)
        Reunion::where('reun_statut', 'en_cours')
            ->whereRaw(
                "TIMESTAMP(reun_date, reun_heure) + INTERVAL reun_duree_min MINUTE <= ?",
                [$now->toDateTimeString()]
            )
            ->update(['reun_statut' => 'terminee']);

        $this->info("Statuts synchronisés à {$now}");
    }
}