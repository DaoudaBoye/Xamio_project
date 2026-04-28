<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ateliers', function (Blueprint $table) {
            $table->foreignId('dept_id')
                  ->nullable()
                  ->after('org_id')
                  ->constrained('departements', 'dept_id')
                  ->onDelete('set null')
                  ->comment('Département concerné (null = toute l\'organisation)');
        });
    }

    public function down(): void
    {
        Schema::table('ateliers', function (Blueprint $table) {
            $table->dropForeign(['dept_id']);
            $table->dropColumn('dept_id');
        });
    }
};
