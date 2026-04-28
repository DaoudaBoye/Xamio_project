<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentChunk extends Model
{
    use HasFactory;

    protected $primaryKey = 'chunk_id';

    protected $fillable = [
        'chunk_contenu',
        'chunk_ordre',
        'chunk_tokens',
        'chunk_statut',
        'doc_id',
        'org_id',
    ];

    protected $casts = [
        'chunk_ordre'  => 'integer',
        'chunk_tokens' => 'integer',
    ];

    // ── Relations ──────────────────────────────────────────────────────────────

    public function document()
    {
        return $this->belongsTo(Document::class, 'doc_id');
    }

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    public function embedding()
    {
        return $this->hasOne(DocumentEmbedding::class, 'chunk_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function estIndexe(): bool
    {
        return $this->chunk_statut === 'indexe';
    }

    public function estEnErreur(): bool
    {
        return $this->chunk_statut === 'erreur';
    }

    public function estEnAttente(): bool
    {
        return $this->chunk_statut === 'en_attente';
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeIndexes($query)
    {
        return $query->where('chunk_statut', 'indexe');
    }

    public function scopePourOrganisation($query, int $orgId)
    {
        return $query->where('org_id', $orgId);
    }
}
