<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table) {
            $table->id('integ_id');
            $table->string('integ_service');
            $table->boolean('integ_connecte')->default(false);
            $table->text('integ_token_hash')->nullable();
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
