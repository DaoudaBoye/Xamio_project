<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClaudeService
{
    private string $apiKey;
    private string $model;
    private string $apiUrl = 'https://api.anthropic.com/v1/messages';

    public function __construct()
    {
        $this->apiKey = config('services.anthropic.key', '');
        $this->model  = config('services.anthropic.model', 'claude-sonnet-4-6');
    }

    /**
     * Génère un compte rendu structuré depuis des notes
     * Retourne toujours { summary, decisions[], tasks[] }
     */
    public function genererCompteRendu(
        string $notes,
        string $titre,
        string $date
    ): array {
        // ── Mode simulation (pas de clé API) ─────────────────
        if (empty($this->apiKey) || str_starts_with($this->apiKey, 'sk-ant-XXXXX')) {
            return $this->simulation($notes, $titre, $date);
        }

        // ── Vrai appel Claude API ─────────────────────────────
        try {
            $prompt = $this->buildPrompt($notes, $titre, $date);

            $response = Http::withHeaders([
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(30)->post($this->apiUrl, [
                'model'      => $this->model,
                'max_tokens' => 1500,
                'messages'   => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

            if (!$response->successful()) {
                Log::error('Claude API error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return $this->simulation($notes, $titre, $date);
            }

            $content = $response->json('content.0.text', '');
            $parsed  = json_decode($content, true);

            if (!$parsed || !isset($parsed['summary'])) {
                Log::warning('Claude: réponse JSON invalide', ['content' => $content]);
                return $this->simulation($notes, $titre, $date);
            }

            return $parsed;

        } catch (\Exception $e) {
            Log::error('Claude exception', ['message' => $e->getMessage()]);
            return $this->simulation($notes, $titre, $date);
        }
    }

    // ── Prompt ────────────────────────────────────────────────
    private function buildPrompt(string $notes, string $titre, string $date): string
    {
        return <<<PROMPT
Tu es un assistant de compte rendu professionnel pour une entreprise africaine.
Sois concis, factuel, et utilise un français professionnel standard.

Réunion : "{$titre}"
Date : {$date}

Notes :
\"\"\"
{$notes}
\"\"\"

Génère un compte rendu structuré.
Réponds UNIQUEMENT avec ce JSON valide (sans backticks, sans texte avant ou après) :
{
  "summary": "résumé factuel en 2-3 phrases claires",
  "decisions": ["décision 1", "décision 2"],
  "tasks": [
    {
      "title": "description de la tâche",
      "assignee": "Prénom Nom ou null",
      "due": "date courte ex: 30 avr. ou null"
    }
  ]
}
PROMPT;
    }

    // ── Simulation réaliste (sans clé API) ────────────────────
    private function simulation(string $notes, string $titre, string $date): array
    {
        // Extrait les premières phrases pour simuler une vraie analyse
        $sentences = array_filter(
            preg_split('/[.!?\n]+/', $notes),
            fn($s) => strlen(trim($s)) > 10
        );
        $sentences   = array_values($sentences);
        $firstPhrase = !empty($sentences[0]) ? trim($sentences[0]) : 'Points discutés en séance';
        $secondPhrase = !empty($sentences[1]) ? trim($sentences[1]) : null;

        return [
            'summary' => "Réunion \"{$titre}\" du {$date}. " .
                "{$firstPhrase}. " .
                "Les participants ont validé les décisions et défini les actions à mener.",

            'decisions' => array_filter([
                $firstPhrase,
                $secondPhrase,
                'Prochaine réunion à planifier dans les deux semaines',
            ]),

            'tasks' => [
                [
                    'title'    => 'Rédiger et diffuser le compte rendu final',
                    'assignee' => 'Secrétaire de séance',
                    'due'      => 'Dans 48h',
                ],
                [
                    'title'    => 'Préparer les documents pour la prochaine réunion',
                    'assignee' => null,
                    'due'      => null,
                ],
            ],
        ];
    }
}