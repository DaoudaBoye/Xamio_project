<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appartenance extends Model
{
    use HasFactory;

    protected $primaryKey = 'app_id';

    protected $fillable = [
        'app_date_ajout',
        'app_statut',
        'org_id',
        'user_id',
        'role_id',
    ];

    protected $casts = [
        'app_date_ajout' => 'date',
    ];

    // ── Relations ──────────────────────────────

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // ── Helpers ────────────────────────────────

    public function estActif(): bool
    {
        return $this->app_statut === 'actif';
    }
}
