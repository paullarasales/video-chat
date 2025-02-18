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
        Schema::table('video_calls', function (Blueprint $table) {
            $table->string('host_peer_id')->nullable()->after('room_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('video_calls', function (Blueprint $table) {
            $table->dropColumn('host_peer_id');
        });
    }
};
