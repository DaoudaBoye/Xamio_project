<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entreprise extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'adresse',
        'pays',
        'plan',
        'statut',
        'plan_expire_at',
    ];

    protected function casts(): array
    {
        return [
            'plan_expire_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'company_id');
    }

    public function getNombreLimiteUtilisateurs(): int
    {
        return match ($this->plan) {
            'gratuit'    => 5,
            'pro'        => 50,
            'entreprise' => PHP_INT_MAX,
            default      => 5,
        };
    }
}