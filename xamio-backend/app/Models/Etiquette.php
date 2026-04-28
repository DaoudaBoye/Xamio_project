<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etiquette extends Model
{
    use HasFactory;

    protected $primaryKey = 'etiq_id';

    protected $fillable = [
        'etiq_libelle',
        'etiq_couleur',
    ];

    // ── Relations ──────────────────────────────

    public function taches()
    {
        return $this->belongsToMany(
            Tache::class,
            'tache_etiquettes',
            'etiq_id',
            'tache_id'
        )->withTimestamps();
    }
}
