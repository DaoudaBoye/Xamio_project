<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipantReunion extends Model
{
    protected $primaryKey = 'part_id';

    protected $fillable = [
        'part_statut',
        'part_statut_invitation',
        'part_token',              // ← ajouté
        'contact_id',
        'user_id',
        'reun_id',
    ];

    /* ── Relations ─────────────────────────────────────────── */

    public function reunion(): BelongsTo
    {
        return $this->belongsTo(Reunion::class, 'reun_id', 'reun_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function contactExterne(): BelongsTo
    {
        return $this->belongsTo(ContactExterne::class, 'contact_id', 'contact_id');
    }
}
