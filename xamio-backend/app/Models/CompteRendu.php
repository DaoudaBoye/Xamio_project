<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompteRendu extends Model
{
    protected $primaryKey = 'cr_id';
    protected $fillable   = [
        'reun_id', 'cr_resume', 'cr_note', 'cr_fichier', 'cr_date_creation',
    ];
    protected $casts = ['cr_date_creation' => 'date'];

    public function reunion()   { return $this->belongsTo(Reunion::class,  'reun_id', 'reun_id'); }
    public function decisions() { return $this->hasMany(Decision::class,   'cr_id',   'cr_id'); }
    public function actions()   { return $this->hasMany(Action::class,     'cr_id',   'cr_id'); }
    public function analyseIa() { return $this->hasOne(AnalyseIa::class,   'cr_id',   'cr_id'); }

    public function estGenereParIa(): bool { return $this->analyseIa !== null; }
    public function estUploade(): bool     { return !empty($this->cr_fichier); }
}