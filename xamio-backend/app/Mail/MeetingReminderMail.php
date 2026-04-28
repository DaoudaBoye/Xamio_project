<?php

namespace App\Mail;

use App\Models\Reunion;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MeetingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Reunion $reunion,
        public readonly string  $nomDestinataire,
        public readonly int     $heures, // 24 ou 1
    ) {}

    public function envelope(): Envelope
    {
        $label = $this->heures === 1 ? 'dans 1 heure' : "dans {$this->heures}h";

        return new Envelope(
            subject: "Rappel ({$label}) : {$this->reunion->reun_titre}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.meetings.reminder',
            with: [
                'reunion'         => $this->reunion,
                'nomDestinataire' => $this->nomDestinataire,
                'heures'          => $this->heures,
                'label'           => $this->heures === 1 ? 'dans 1 heure' : "dans {$this->heures}h",
            ],
        );
    }
}
