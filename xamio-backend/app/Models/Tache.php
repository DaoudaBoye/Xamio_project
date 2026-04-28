<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tache extends Model
{
    protected $primaryKey = 'tache_id';

    protected $fillable = [
        'tache_titre',
        'tache_priorite',
        'tache_colonne',
        'tache_echeance',
        'description',
        'org_id',
        'user_id',
        'dept_id', // ← ajout
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function departement()
    {
        return $this->belongsTo(Departement::class, 'dept_id', 'dept_id'); // ← ajout
    }

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }
}