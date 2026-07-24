<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class FonnteService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.fonnte.api_key');
        $this->baseUrl = 'https://api.fonnte.com';
    }

    public function sendMessage($target, $message)
    {
        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
        ])->post($this->baseUrl . '/send', [
            'target' => $target,
            'message' => $message,
        ]);

        return $response->json();
    }
}