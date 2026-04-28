<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications_xamio', function (Blueprint $table) {
            $table->id('notif_id');
            $table->string('notif_titre');
            $table->text('notif_corps');
            $table->enum('notif_type', [
                'reunion', 'tache', 'document',
                'action', 'atelier', 'rdv', 'systeme'
            ])->default('systeme');
            $table->enum('notif_canal', ['email', 'sms', 'push', 'in_app'])
                  ->default('in_app');
            $table->boolean('notif_lue')->default(false);
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications_xamio');
    }
};
