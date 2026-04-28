<?php

namespace App\Jobs;

use App\Mail\MeetingInvitationMail;
use App\Models\Reunion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendMeetingInvitation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(
        public readonly Reunion $reunion,
        public readonly string  $email,
        public readonly string  $nom,
        public readonly string  $token,   // token unique du participant
    ) {}

    public function handle(): void
    {
        Mail::to($this->email)
            ->send(new MeetingInvitationMail(
                $this->reunion,
                $this->nom,
                $this->token,
            ));
    }

    public function failed(\Throwable $e): void
    {
        Log::error("Échec envoi invitation réunion #{$this->reunion->reun_id} à {$this->email}", [
            'error' => $e->getMessage(),
        ]);
    }
}