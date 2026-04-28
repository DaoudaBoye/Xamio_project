<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Action extends Model
{
    protected $primaryKey = 'action_id';
    protected $fillable   = [
        'cr_id', 'action_texte', 'action_echeance', 'action_statut', 'user_id',
    ];
    protected $casts = ['action_echeance' => 'date'];

    public function compteRendu() { return $this->belongsTo(CompteRendu::class, 'cr_id', 'cr_id'); }
    public function user()        { return $this->belongsTo(User::class, 'user_id'); }
}