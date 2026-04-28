<?php
// app/Jobs/EnvoyerMailActionAssignee.php

namespace App\Jobs;

use App\Mail\ActionAssigneeMail;
use App\Models\Action;
use App\Models\Reunion;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EnvoyerMailActionAssignee implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Nombre de tentatives max en cas d'échec
     */
    public int $tries = 3;

    /**
     * Délai entre les tentatives (en secondes)
     */
    public int $backoff = 60;

    /**
     * Timeout du job (en secondes)
     */
    public int $timeout = 30;

    public function __construct(
        public readonly Action  $action,
        public readonly Reunion $reunion,
        public readonly User    $assignee,
    ) {}

    public function handle(): void
    {
        // Vérifier que l'assigné a toujours un email valide
        if (!$this->assignee->email) {
            Log::warning('EnvoyerMailActionAssignee : email manquant', [
                'user_id'   => $this->assignee->getKey(),
                'action_id' => $this->action->action_id,
            ]);
            return;
        }

        Mail::to($this->assignee->email)
            ->send(new ActionAssigneeMail(
                $this->action,
                $this->reunion,
                $this->assignee,
            ));

        Log::info('Mail action assignée envoyé', [
            'user_id'   => $this->assignee->getKey(),
            'email'     => $this->assignee->email,
            'action_id' => $this->action->action_id,
        ]);
    }

    /**
     * Gérer l'échec définitif après toutes les tentatives
     */
    public function failed(\Throwable $e): void
    {
        Log::error('EnvoyerMailActionAssignee : échec définitif', [
            'user_id'   => $this->assignee->getKey(),
            'action_id' => $this->action->action_id,
            'error'     => $e->getMessage(),
        ]);
    }
}