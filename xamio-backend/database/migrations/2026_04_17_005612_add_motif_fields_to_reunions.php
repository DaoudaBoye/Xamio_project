<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
    {
        Schema::table('reunions', function (Blueprint $table) {
            $table->text('reun_annul_motif')->nullable()->after('reun_statut');
            $table->text('reun_report_motif')->nullable()->after('reun_annul_motif');
        });
    }

    public function down(): void
    {
        Schema::table('reunions', function (Blueprint $table) {
            $table->dropColumn(['reun_annul_motif', 'reun_report_motif']);
        });
    }
};
