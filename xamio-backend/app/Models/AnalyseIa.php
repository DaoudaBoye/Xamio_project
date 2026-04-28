<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyseIa extends Model
{
    protected $primaryKey = 'ia_id';
    protected $fillable   = [
        'cr_id', 'org_id', 'ia_modele', 'ia_resume', 'ia_points_cles', 'ia_statut',
    ];
    protected $casts = ['ia_points_cles' => 'array'];

    public function compteRendu() { return $this->belongsTo(CompteRendu::class, 'cr_id', 'cr_id'); }
}