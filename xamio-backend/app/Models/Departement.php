<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departement extends Model
{
    protected $primaryKey = 'dept_id';

    protected $fillable = [
        'dept_nom',
        'dept_description',
        'dept_actif',
        'org_id',
        'user_id',
    ];

    protected $casts = [
        'dept_actif' => 'boolean',
    ];

    /* ── Relations ─────────────────────────────────────────── */

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function membres(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'membre_departements', 'dept_id', 'user_id')
                    ->withPivot('membdept_date_ajout')
                    ->withTimestamps();
    }

    // ← BelongsToMany au lieu de HasMany (table pivot reunion_departement)
    public function reunions(): BelongsToMany
    {
        return $this->belongsToMany(
            Reunion::class,
            'reunion_departement',
            'dept_id',
            'reun_id',
            'dept_id',
            'reun_id'
        );
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'dept_id', 'dept_id');
    }

    public function ateliers(): HasMany
    {
        return $this->hasMany(Atelier::class, 'dept_id', 'dept_id');
    }

    /* ── Helpers ────────────────────────────────────────────── */

    public function nbMembres(): int
    {
        return $this->membres()->count();
    }

    public function estActif(): bool
    {
        return $this->dept_actif === true;
    }
}