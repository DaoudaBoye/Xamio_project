<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'util_nom',
        'util_prenom',
        'util_twofa_actif',
        'util_twofa_secret',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'util_twofa_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'util_twofa_actif'  => 'boolean',
        ];
    }

    // ── Relations ──────────────────────────────

    public function appartenances()
    {
        return $this->hasMany(Appartenance::class, 'user_id');
    }

    public function organisations()
    {
        return $this->belongsToMany(
            Organisation::class,
            'appartenances',
            'user_id',
            'org_id'
        )->withPivot(['role_id', 'app_statut', 'app_date_ajout'])
         ->withTimestamps();
    }

    public function userSessions()
    {
        return $this->hasMany(UserSession::class, 'user_id');
    }

    public function reunions()
    {
        return $this->hasMany(Reunion::class, 'user_id');
    }

    public function actions()
    {
        return $this->hasMany(Action::class, 'user_id');
    }

    public function taches()
    {
        return $this->hasMany(Tache::class, 'user_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'user_id');
    }

    public function accesDocuments()
    {
        return $this->hasMany(AccesDocument::class, 'user_id');
    }

    public function notificationsXamio()
    {
        return $this->hasMany(NotificationXamio::class, 'user_id');
    }

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class, 'user_id');
    }

    // public function questionChatIas()
    // {
    //     return $this->hasMany(QuestionChatIa::class, 'user_id');
    // }
}
