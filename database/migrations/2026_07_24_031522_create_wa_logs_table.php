<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('wa_logs', function (Blueprint $table) {
            $table->id();
            $table->string('no_kunjungan')->nullable();
            $table->string('target')->nullable(); // nomor tujuan
            $table->text('message')->nullable();  // isi pesan
            $table->string('status'); // success, failed
            $table->text('response')->nullable(); // response mentah dari Fonnte
            $table->text('error')->nullable(); // jika gagal
            $table->string('type')->default('rme_note'); // jenis: rme_note, dll
            $table->unsignedBigInteger('note_id')->nullable(); // relasi ke rme_notes
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('wa_logs');
    }
};