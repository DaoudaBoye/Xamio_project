<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\RdvParticipant;

class RendezVous extends Model
{
    use HasFactory;

    protected $table      = 'rendez_vous';
    protected $primaryKey = 'rdv_id';

    protected $fillable = [
        'rdv_titre',
        'rdv_date',
        'rdv_heure',
        'rdv_duree',
        'rdv_type',
        'rdv_statut',
        'rdv_lieu',
        'rdv_description',
        'rdv_visibilite',
        'rdv_rappels',
        'org_id',
        'user_id',
        'contact_id',
    ];

    protected $casts = [
        'rdv_date'    => 'date',
        'rdv_rappels' => 'array',
        'rdv_duree'   => 'integer',
    ];

    // ── Constantes ─────────────────────────────

    const STATUT_PLANIFIE  = 'planifie';
    const STATUT_CONFIRME  = 'confirme';
    const STATUT_ANNULE    = 'annule';
    const STATUT_TERMINE   = 'termine';

    const VISIBILITE_TOUS      = 'tous';
    const VISIBILITE_DIRECTION = 'direction';

    // ── Relations ──────────────────────────────

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contactExterne(): BelongsTo
    {
        return $this->belongsTo(ContactExterne::class, 'contact_id', 'contact_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(RdvParticipant::class, 'rdv_id', 'rdv_id')
                    ->with(['user', 'contactExterne']);
    }

    public function participantsAcceptes(): HasMany
    {
        return $this->hasMany(RdvParticipant::class, 'rdv_id', 'rdv_id')
                    ->where('part_statut', RdvParticipant::STATUT_ACCEPTE);
    }

    // ── Scopes ─────────────────────────────────

    public function scopeAVenir($query)
    {
        return $query->where('rdv_date', '>=', now()->toDateString())
                     ->where('rdv_statut', '!=', self::STATUT_ANNULE);
    }

    public function scopePasses($query)
    {
        return $query->where('rdv_date', '<', now()->toDateString());
    }

    public function scopeConfirmes($query)
    {
        return $query->where('rdv_statut', self::STATUT_CONFIRME);
    }

    public function scopePourOrganisation($query, int $orgId)
    {
        return $query->where('org_id', $orgId);
    }

    public function scopePourUtilisateur($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ── Helpers ────────────────────────────────

    public function estPasse(): bool
    {
        return $this->rdv_date->isPast();
    }

    public function estConfirme(): bool
    {
        return $this->rdv_statut === self::STATUT_CONFIRME;
    }

    public function estAnnule(): bool
    {
        return $this->rdv_statut === self::STATUT_ANNULE;
    }

    public function estTermine(): bool
    {
        return $this->rdv_statut === self::STATUT_TERMINE;
    }

    public function estVisible(): bool
    {
        return $this->rdv_visibilite === self::VISIBILITE_TOUS;
    }

    public function heureFin(): string
    {
        return \Carbon\Carbon::createFromFormat('H:i:s', $this->rdv_heure)
            ->addMinutes($this->rdv_duree ?? 60)
            ->format('H:i');
    }

    public function doitEnvoyerRappel(int $minutesAvant): bool
    {
        $rappels = $this->rdv_rappels ?? [];
        return in_array($minutesAvant, $rappels, true);
    }
}