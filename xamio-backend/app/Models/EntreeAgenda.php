<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntreeAgenda extends Model
{
    use HasFactory;

    protected $table      = 'entree_agendas';
    protected $primaryKey = 'agenda_id';

    protected $fillable = [
        'agenda_titre',
        'agenda_date',
        'agenda_type',
        'agenda_visibilite',
        'org_id',
    ];

    protected $casts = [
        'agenda_date' => 'date',
    ];

    // ── Relations ──────────────────────────────

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    // ── Helpers ────────────────────────────────

    public function estPublic(): bool
    {
        return $this->agenda_visibilite === 'organisation';
    }

    public function estPrive(): bool
    {
        return $this->agenda_visibilite === 'prive';
    }
}
