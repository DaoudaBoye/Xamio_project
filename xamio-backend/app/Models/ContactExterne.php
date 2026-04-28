<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactExterne extends Model
{
    protected $primaryKey = 'contact_id';

    protected $fillable = [
        'contact_nom',
        'contact_email',
        'contact_tel',
        'contact_societe',
        'org_id',
    ];

    /* ── Relations ─────────────────────────────────────────── */

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }

    public function participantReunions(): HasMany
    {
        return $this->hasMany(ParticipantReunion::class, 'contact_id', 'contact_id');
    }
}
