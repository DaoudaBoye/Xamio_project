<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $primaryKey = 'plan_id';

    protected $fillable = [
        'plan_nom',
        'plan_prix_fcfa',
        'plan_max_users',
        'plan_ia_actif',
    ];

    protected $casts = [
        'plan_ia_actif'  => 'boolean',
        'plan_max_users' => 'integer',
        'plan_prix_fcfa' => 'integer',
    ];

    // ── Relations ──────────────────────────────

    public function abonnements()
    {
        return $this->hasMany(Abonnement::class, 'plan_id');
    }
}
