<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    use HasFactory;

    protected $primaryKey = 'integ_id';

    protected $fillable = [
        'integ_service',
        'integ_connecte',
        'integ_token_hash',
        'org_id',
    ];

    protected $hidden = [
        'integ_token_hash',
    ];

    protected $casts = [
        'integ_connecte' => 'boolean',
    ];

    // ── Relations ──────────────────────────────

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }
}
