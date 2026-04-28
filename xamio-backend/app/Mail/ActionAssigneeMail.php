<?php
// app/Mail/ActionAssigneeMail.php

namespace App\Mail;

use App\Models\Action;
use App\Models\Reunion;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ActionAssigneeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        private readonly Action  $action,   // ← private : non injecté automatiquement dans la vue
        private readonly Reunion $reunion,  // ← private : non injecté automatiquement dans la vue
        private readonly User    $assignee, // ← private : non injecté automatiquement dans la vue
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "⚡ Action assignée : {$this->action->action_texte}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.meetings.action-assignee',
            with: [
                'prenom'   => $this->assignee->util_prenom,
                'nom'      => $this->assignee->util_nom,
                'action'   => $this->action->action_texte,
                'echeance' => $this->action->action_echeance?->format('d/m/Y'),
                'reunion'  => $this->reunion->reun_titre,
                'date'     => $this->reunion->reun_date
                                  ? \Carbon\Carbon::parse($this->reunion->reun_date)
                                      ->locale('fr')->isoFormat('dddd D MMMM YYYY')
                                  : null,
            ],
        );
    }
}