<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccesDocument extends Model
{
    use HasFactory;

    protected $table      = 'acces_documents';
    protected $primaryKey = 'acc_id';

    protected $fillable = [
        'acc_permission',
        'acc_date_partage',
        'doc_id',
        'user_id',
    ];

    protected $casts = [
        'acc_date_partage' => 'datetime',
    ];

    // ── Relations ──────────────────────────────

    public function document()
    {
        return $this->belongsTo(Document::class, 'doc_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ── Helpers ────────────────────────────────

    public function peutEcrire(): bool
    {
        return in_array($this->acc_permission, ['ecriture', 'admin']);
    }

    public function estAdmin(): bool
    {
        return $this->acc_permission === 'admin';
    }
}
