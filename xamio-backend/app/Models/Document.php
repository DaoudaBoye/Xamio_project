<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $primaryKey = 'doc_id';

    protected $fillable = [
        'org_id',
        'user_id',
        'doc_nom',
        'doc_type_mime',
        'doc_taille_octets',
        'doc_chemin',
        'doc_categorie',
        'doc_partage',
        'doc_visibilite',
        // RAG — gérés par des jobs dédiés, pas l'upload direct
        'doc_indexe',
        'doc_nb_chunks',
        'doc_indexe_at',
    ];

    protected $casts = [
        'doc_partage'       => 'boolean',
        'doc_indexe'        => 'boolean',
        'doc_nb_chunks'     => 'integer',
        'doc_indexe_at'     => 'datetime',
        'doc_taille_octets' => 'integer',
    ];

    // ── Relations ─────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }

    // ── Helpers ───────────────────────────────────────────────────

    /** Extension courte déduite du MIME. */
    public function extension(): string
    {
        return match ($this->doc_type_mime) {
            'application/pdf'                                                                  => 'pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'         => 'docx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'               => 'xlsx',
            'image/png'                                                                        => 'png',
            default                                                                            => 'bin',
        };
    }

    /** Taille lisible (KB / MB). */
    public function tailleHumaine(): string
    {
        $b = $this->doc_taille_octets;
        return $b < 1_048_576
            ? round($b / 1024) . ' KB'
            : number_format($b / 1_048_576, 1) . ' MB';
    }
}