<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $primaryKey = 'doc_id';

    protected $fillable = [
        'doc_nom',
        'doc_type_mime',
        'doc_taille_octets',
        'doc_chemin',
        'doc_categorie',
        'doc_partage',
        'doc_visibilite',
        'doc_indexe',
        'doc_nb_chunks',
        'doc_indexe_at',
        'org_id',
        'user_id',
    ];

    protected $casts = [
        'doc_partage'       => 'boolean',
        'doc_taille_octets' => 'integer',
        'doc_indexe'        => 'boolean',
        'doc_nb_chunks'     => 'integer',
        'doc_indexe_at'     => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────────────────────────

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    public function deposant()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function acces()
    {
        return $this->hasMany(AccesDocument::class, 'doc_id');
    }

    public function usersAvecAcces()
    {
        return $this->belongsToMany(
            User::class,
            'acces_documents',
            'doc_id',
            'user_id'
        )->withPivot(['acc_permission', 'acc_date_partage'])
         ->withTimestamps();
    }

    // ── Relations RAG ──────────────────────────────────────────────────────────

    public function chunks()
    {
        return $this->hasMany(DocumentChunk::class, 'doc_id')
                    ->orderBy('chunk_ordre');
    }

    public function chunksIndexes()
    {
        return $this->hasMany(DocumentChunk::class, 'doc_id')
                    ->where('chunk_statut', 'indexe');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function tailleEnMo(): float
    {
        return round($this->doc_taille_octets / 1048576, 2);
    }

    public function estIndexe(): bool
    {
        return $this->doc_indexe === true;
    }

    public function estPretPourRag(): bool
    {
        return $this->doc_indexe && $this->doc_nb_chunks > 0;
    }

    public function peutEtreIndexe(): bool
    {
        return in_array($this->doc_type_mime, [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
        ]);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeIndexes($query)
    {
        return $query->where('doc_indexe', true);
    }

    public function scopePretsPourRag($query)
    {
        return $query->where('doc_indexe', true)
                     ->where('doc_nb_chunks', '>', 0);
    }

    public function scopeVisiblesPour($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('doc_visibilite', 'organisation')
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('doc_visibilite', 'equipe')
                     ->whereHas('acces', fn($q3) => $q3->where('user_id', $user->id));
              })
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('doc_visibilite', 'prive')
                     ->where('user_id', $user->id);
              });
        });
    }
}
