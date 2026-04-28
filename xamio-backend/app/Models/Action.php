<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Action extends Model
{
    protected $primaryKey = 'action_id';

    protected $fillable = [
        'cr_id',
        'action_texte',
        'action_echeance',
        'action_statut',
        'user_id',
    ];

    protected $casts = [
        'action_echeance' => 'date',
    ];

    // Valeurs réelles de la migration
    const STATUT_ORDER = ['a_faire' => 0, 'en_cours' => 1, 'termine' => 2, 'annule' => 3];

    public function compteRendu()
    {
        return $this->belongsTo(CompteRendu::class, 'cr_id', 'cr_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

   public function canTransitionTo(string $newStatut): bool
    {
        if (!isset(self::STATUT_ORDER[$this->action_statut])) {
            return true;
        }
        if (!isset(self::STATUT_ORDER[$newStatut])) {
            return false;
        }
        return self::STATUT_ORDER[$newStatut] >= self::STATUT_ORDER[$this->action_statut];
    }

    public function toApiArray(): array
    {
        return [
            'action_id'       => $this->action_id,
            'action_texte'    => $this->action_texte,
            'action_echeance' => $this->action_echeance?->format('Y-m-d'),
            'action_statut'   => $this->action_statut,
            'user_id'         => $this->user_id,
            'assignee'        => $this->user
                ? trim($this->user->util_prenom . ' ' . $this->user->util_nom)
                : null,
            'reunion'         => $this->compteRendu?->reunion?->reun_titre ?? null,
        ];
    }
}