<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentEmbedding extends Model
{
    use HasFactory;

    protected $primaryKey = 'emb_id';

    public $timestamps = false; // Seulement created_at

    protected $fillable = [
        'emb_vecteur',
        'emb_modele',
        'chunk_id',
        'org_id',
    ];

    protected $casts = [
        'emb_vecteur' => 'array', // Stocké en JSON — décodé automatiquement
        'created_at'  => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────────────────────────

    public function chunk()
    {
        return $this->belongsTo(DocumentChunk::class, 'chunk_id');
    }

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Calcule la similarité cosinus entre ce vecteur et un autre.
     * Utilisé pour le classement des résultats RAG.
     */
    public function similariteCosinus(array $autreVecteur): float
    {
        $a = $this->emb_vecteur;
        $b = $autreVecteur;

        if (count($a) !== count($b)) {
            return 0.0;
        }

        $dotProduct = 0.0;
        $normA      = 0.0;
        $normB      = 0.0;

        for ($i = 0; $i < count($a); $i++) {
            $dotProduct += $a[$i] * $b[$i];
            $normA      += $a[$i] ** 2;
            $normB      += $b[$i] ** 2;
        }

        if ($normA === 0.0 || $normB === 0.0) {
            return 0.0;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopePourOrganisation($query, int $orgId)
    {
        return $query->where('org_id', $orgId);
    }
}
