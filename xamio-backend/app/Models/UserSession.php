<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    protected $primaryKey = 'sess_id';

    protected $fillable = [
        'sess_token_hash',
        'sess_ip',
        'sess_date_expiration',
        'sess_last_activity', // ← ajouter
        'org_id',
        'user_id',
    ];

    protected $casts = [
        'sess_date_expiration' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }
}