<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Decision extends Model
{
    protected $primaryKey = 'dec_id';
    protected $fillable   = ['cr_id', 'dec_intitule', 'dec_ordre'];

    public function compteRendu() { return $this->belongsTo(CompteRendu::class, 'cr_id', 'cr_id'); }
}