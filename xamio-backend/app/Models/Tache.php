<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tache extends Model
{
    protected $primaryKey = 'tache_id';

    protected $fillable = [
        'tache_titre',
        'tache_priorite',
        'tache_colonne',
        'tache_echeance',
        'org_id',
        'user_id',
    ];

    // Valeurs réelles de la migration
    const COLONNES  = ['todo', 'inprogress', 'done'];
    const PRIORITES = ['low', 'medium', 'high'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }

    public function toArray(): array
    {
        return [
            'tache_id'       => $this->tache_id,
            'tache_titre'    => $this->tache_titre,
            'tache_echeance' => $this->tache_echeance,
            'tache_priorite' => $this->tache_priorite,
            'tache_colonne'  => $this->tache_colonne,
            'user_id'        => $this->user_id,
            'user'           => $this->user ? [
                'util_prenom' => $this->user->util_prenom,
                'util_nom'    => $this->user->util_nom,
            ] : null,
        ];
    }
}
