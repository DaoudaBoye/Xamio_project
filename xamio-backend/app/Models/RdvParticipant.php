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

    const STATUT_INVITE  = 'invite';
    const STATUT_ACCEPTE = 'accepte';
    const STATUT_REFUSE  = 'refuse';

    protected $fillable = [
        'rdv_id',
        'user_id',
        'contact_id',
        'part_statut',
        'part_statut_invitation',
        'part_token',
    ];

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
}
