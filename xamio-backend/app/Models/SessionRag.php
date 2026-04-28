<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionRag extends Model
{
    use HasFactory;

    protected $table      = 'session_rags';
    protected $primaryKey = 'srag_id';

    protected $fillable = [
        'srag_question',
        'srag_reponse',
        'srag_sources',
        'srag_tokens_prompt',
        'srag_tokens_reponse',
        'srag_modele',
        'srag_statut',
        'user_id',
        'org_id',
    ];

    protected $casts = [
        'srag_sources'        => 'array', // JSON décodé automatiquement
        'srag_tokens_prompt'  => 'integer',
        'srag_tokens_reponse' => 'integer',
    ];

    // ── Relations ──────────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function estTermine(): bool
    {
        return $this->srag_statut === 'termine';
    }

    public function estEnErreur(): bool
    {
        return $this->srag_statut === 'erreur';
    }

    public function estEnCours(): bool
    {
        return $this->srag_statut === 'en_cours';
    }

    /**
     * Retourne le nombre total de tokens consommés
     * (prompt + réponse)
     */
    public function totalTokens(): int
    {
        return ($this->srag_tokens_prompt ?? 0)
             + ($this->srag_tokens_reponse ?? 0);
    }

    /**
     * Retourne les documents sources uniques utilisés
     * dans la réponse (extraits de srag_sources JSON)
     */
    public function documentsSource(): array
    {
        if (!$this->srag_sources) {
            return [];
        }

        $docs = collect($this->srag_sources)
            ->pluck('doc_nom')
            ->unique()
            ->values()
            ->toArray();

        return $docs;
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopePourOrganisation($query, int $orgId)
    {
        return $query->where('org_id', $orgId);
    }

    public function scopePourUtilisateur($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeTermines($query)
    {
        return $query->where('srag_statut', 'termine');
    }
}
