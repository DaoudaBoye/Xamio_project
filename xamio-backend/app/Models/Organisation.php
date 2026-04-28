<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organisation extends Model
{
    use HasFactory;

    protected $primaryKey = 'org_id';

    protected $fillable = [
        'org_nom',
        'org_slug',
        'org_pays',
        'org_actif',
    ];

    protected $casts = [
        'org_actif' => 'boolean',
    ];

    // ── Relations ──────────────────────────────

    public function abonnements()
    {
        return $this->hasMany(Abonnement::class, 'org_id');
    }

    public function abonnementActif()
    {
        return $this->hasOne(Abonnement::class, 'org_id')
                    ->where('abo_statut', 'actif')
                    ->latestOfMany('abo_date_debut');
    }

    public function appartenances()
    {
        return $this->hasMany(Appartenance::class, 'org_id');
    }

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'appartenances',
            'org_id',
            'user_id'
        )->withPivot(['role_id', 'app_statut', 'app_date_ajout'])
         ->withTimestamps();
    }

    public function integrations()
    {
        return $this->hasMany(Integration::class, 'org_id');
    }

    public function userSessions()
    {
        return $this->hasMany(UserSession::class, 'org_id');
    }

    public function reunions()
    {
        return $this->hasMany(Reunion::class, 'org_id');
    }

    public function taches()
    {
        return $this->hasMany(Tache::class, 'org_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'org_id');
    }

    public function ateliers()
    {
        return $this->hasMany(Atelier::class, 'org_id');
    }

    public function evenements()
    {
        return $this->hasMany(Evenement::class, 'org_id');
    }

    public function entreeAgendas()
    {
        return $this->hasMany(EntreeAgenda::class, 'org_id');
    }

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class, 'org_id');
    }

    public function notifications()
    {
        return $this->hasMany(NotificationXamio::class, 'org_id');
    }

    public function analyseIas()
    {
        return $this->hasMany(AnalyseIa::class, 'org_id');
    }
}
