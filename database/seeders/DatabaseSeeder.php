<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin SIMONREDI',
            'email' => 'admin@example.com',
            'password' => Hash::make(env('ADMIN_PASS', 'password123')),
            'email_verified_at' => now(),
        ]);
    }
}
