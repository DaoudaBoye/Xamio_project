<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationXamio extends Model
{
    use HasFactory;

    protected $table      = 'notifications_xamio';
    protected $primaryKey = 'notif_id';

    protected $fillable = [
        'notif_titre',
        'notif_corps',
        'notif_type',
        'notif_canal',
        'notif_lue',
        'user_id',
        'org_id',
    ];

    protected $casts = [
        'notif_lue' => 'boolean',
    ];

    // ── Relations ──────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    // ── Helpers ────────────────────────────────

    public function marquerCommeLue(): void
    {
        $this->update(['notif_lue' => true]);
    }

    public function estNonLue(): bool
    {
        return !$this->notif_lue;
    }
}
