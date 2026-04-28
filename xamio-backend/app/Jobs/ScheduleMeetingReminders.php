<?php

namespace App\Jobs;

use App\Models\Reunion;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ScheduleMeetingReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Reunion $reunion,
    ) {}

    public function handle(): void
    {
        // Calcule le datetime exact de la réunion
        $heure   = $this->reunion->reun_heure ?? '09:00:00';
        $reunionAt = Carbon::parse($this->reunion->reun_date->format('Y-m-d') . ' ' . $heure);
        // Collecte tous les destinataires (internes + externes)
        $destinataires = $this->getDestinataires();

        foreach ($destinataires as ['email' => $email, 'nom' => $nom]) {

            // Rappel 24h avant
            $at24h = $reunionAt->copy()->subHours(24);
            if ($at24h->isFuture()) {
                SendMeetingReminder::dispatch($this->reunion, $email, $nom, 24)
                    ->delay($at24h);
            }

            // Rappel 1h avant
            $at1h = $reunionAt->copy()->subHour();
            if ($at1h->isFuture()) {
                SendMeetingReminder::dispatch($this->reunion, $email, $nom, 1)
                    ->delay($at1h);
            }
        }
    }

    /**
     * Retourne la liste des destinataires :
     * - Utilisateurs internes (via participant_reunions → users)
     * - Contacts externes (via participant_reunions → contact_externes)
     */
    private function getDestinataires(): array
    {
        $destinataires = [];

        // Charger les participants avec leurs relations
        $participants = $this->reunion->participantReunions()
            ->with(['user', 'contactExterne'])
            ->get();

        foreach ($participants as $participant) {
            if ($participant->user) {
                $destinataires[] = [
                    'email' => $participant->user->email,
                    'nom'   => $participant->user->util_prenom . ' ' . $participant->user->util_nom,
                ];
            } elseif ($participant->contactExterne) {
                $destinataires[] = [
                    'email' => $participant->contactExterne->contact_email,
                    'nom'   => $participant->contactExterne->contact_nom,
                ];
            }
        }

        return $destinataires;
    }
}
