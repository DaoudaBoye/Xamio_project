<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acces_documents', function (Blueprint $table) {
            $table->id('acc_id');
            $table->enum('acc_permission', ['lecture', 'ecriture', 'admin'])
                  ->default('lecture');
            $table->timestamp('acc_date_partage')->useCurrent();
            $table->foreignId('doc_id')
                  ->constrained('documents', 'doc_id')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->unique(['doc_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acces_documents');
    }
};
