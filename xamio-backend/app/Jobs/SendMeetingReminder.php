<?php

namespace App\Jobs;

use App\Mail\MeetingReminderMail;
use App\Models\Reunion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendMeetingReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int  $tries   = 3;
    public int  $timeout = 60;

    /**
     * Si la réunion est supprimée entre le dispatch et l'exécution,
     * le job s'annule silencieusement au lieu de crasher.
     */
    public bool $deleteWhenMissingModels = true;

    /**
     * @param Reunion $reunion   La réunion concernée
     * @param string  $email     Email du destinataire
     * @param string  $nom       Nom du destinataire
     * @param int     $heures    Nombre d'heures avant la réunion (24 ou 1)
     */
    public function __construct(
        public readonly Reunion $reunion,
        public readonly string  $email,
        public readonly string  $nom,
        public readonly int     $heures,
    ) {}

    public function handle(): void
    {
        // Ne pas envoyer si la réunion a été annulée entre-temps
        if ($this->reunion->reun_statut === 'annulee') {
            Log::info("Rappel ignoré : réunion #{$this->reunion->reun_id} annulée", [
                'email'  => $this->email,
                'heures' => $this->heures,
            ]);
            return;
        }

        Mail::to($this->email)
            ->send(new MeetingReminderMail($this->reunion, $this->nom, $this->heures));
    }

    public function failed(\Throwable $e): void
    {
        Log::error("Échec envoi rappel {$this->heures}h réunion #{$this->reunion->reun_id} à {$this->email}", [
            'error' => $e->getMessage(),
        ]);
    }
}