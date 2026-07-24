<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('rme_notes', function (Blueprint $table) {
            $table->string('wa_status')->nullable()->after('status');
            $table->text('wa_error')->nullable()->after('wa_status');
        });
    }

    public function down()
    {
        Schema::table('rme_notes', function (Blueprint $table) {
            $table->dropColumn(['wa_status', 'wa_error']);
        });
    }
};
