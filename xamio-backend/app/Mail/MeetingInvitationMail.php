<?php

namespace App\Mail;

use App\Models\ParticipantReunion;
use App\Models\Reunion;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MeetingInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Reunion            $reunion,
        public readonly string             $nomDestinataire,
        public readonly string             $token,        // token unique du participant
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Invitation : {$this->reunion->reun_titre}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.meetings.invitation',
            with: [
                'reunion'         => $this->reunion,
                'nomDestinataire' => $this->nomDestinataire,
                'token'           => $this->token,
                'pointsOrdreJour' => $this->reunion->pointOrdreJours ?? collect(),
            ],
        );
    }
}