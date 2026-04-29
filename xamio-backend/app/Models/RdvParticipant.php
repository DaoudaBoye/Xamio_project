<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RdvParticipant extends Model
{
    use HasFactory;

    protected $table      = 'rdv_participants';
    protected $primaryKey = 'rdv_part_id';

    protected $fillable = [
        'part_statut',
        'part_statut_invitation',
        'part_token',
        'user_id',
        'contact_id',
        'rdv_id',
    ];

    // ── Constantes ─────────────────────────────

    const STATUT_INVITE  = 'invite';
    const STATUT_ACCEPTE = 'accepte';
    const STATUT_REFUSE  = 'refuse';

    // ── Relations ──────────────────────────────

    public function rendezVous(): BelongsTo
    {
        return $this->belongsTo(RendezVous::class, 'rdv_id', 'rdv_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contactExterne(): BelongsTo
    {
        return $this->belongsTo(ContactExterne::class, 'contact_id', 'contact_id');
    }

    // ── Scopes ─────────────────────────────────

    public function scopeAcceptes($query)
    {
        return $query->where('part_statut', self::STATUT_ACCEPTE);
    }

    public function scopeRefuses($query)
    {
        return $query->where('part_statut', self::STATUT_REFUSE);
    }

    public function scopeInvites($query)
    {
        return $query->where('part_statut', self::STATUT_INVITE);
    }

    public function scopeUtilisateursInternes($query)
    {
        return $query->whereNotNull('user_id');
    }

    public function scopeContactsExternes($query)
    {
        return $query->whereNotNull('contact_id');
    }

    // ── Helpers ────────────────────────────────

    public function estAccepte(): bool
    {
        return $this->part_statut === self::STATUT_ACCEPTE;
    }

    public function estRefuse(): bool
    {
        return $this->part_statut === self::STATUT_REFUSE;
    }

    public function estInterne(): bool
    {
        return !is_null($this->user_id);
    }

    public function estExterne(): bool
    {
        return !is_null($this->contact_id);
    }

    /**
     * Retourne le nom du participant (interne ou externe).
     */
    public function getNomAttribute(): string
    {
        if ($this->estInterne() && $this->user) {
            return $this->user->name;
        }

        if ($this->estExterne() && $this->contactExterne) {
            return $this->contactExterne->contact_nom;
        }

        return 'Inconnu';
    }

    /**
     * Vérifie si le token de confirmation est valide.
     */
    public function tokenEstValide(string $token): bool
    {
        return !is_null($this->part_token) && $this->part_token === $token;
    }

    /**
     * Accepte le rendez-vous via token.
     */
    public function accepterViaToken(string $token): bool
    {
        if (!$this->tokenEstValide($token)) {
            return false;
        }

        $this->update([
            'part_statut' => self::STATUT_ACCEPTE,
            'part_token'  => null,
        ]);

        return true;
    }

    /**
     * Refuse le rendez-vous via token.
     */
    public function refuserViaToken(string $token): bool
    {
        if (!$this->tokenEstValide($token)) {
            return false;
        }

        $this->update([
            'part_statut' => self::STATUT_REFUSE,
            'part_token'  => null,
        ]);

        return true;
    }
}