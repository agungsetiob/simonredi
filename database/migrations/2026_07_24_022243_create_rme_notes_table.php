<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('rme_notes', function (Blueprint $table) {
            $table->id();
            $table->string('no_kunjungan');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('catatan');
            $table->string('status')->default('dikirim');
            $table->timestamp('dikirim_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('rme_notes');
    }
};