<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParticipantReunion;
use Illuminate\Http\Response;

class InvitationController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Constantes
    // ─────────────────────────────────────────────────────────────────────────

    private const RESPONSES = [
        'accept' => [
            'statut_invitation' => 'accepte',
            'statut'            => 'confirme',
            'titre'             => '✅ Présence confirmée',
            'message'           => 'Merci ! Votre présence a bien été enregistrée.',
            'color'             => '#16a34a',
        ],
        'decline' => [
            'statut_invitation' => 'refuse',
            'statut'            => 'refuse',
            'titre'             => '❌ Absence enregistrée',
            'message'           => 'Votre absence a bien été prise en compte. Merci de nous avoir informés.',
            'color'             => '#dc2626',
        ],
        'maybe' => [
            'statut_invitation' => 'en_attente',
            'statut'            => 'invite',
            'titre'             => '⏳ Réponse enregistrée',
            'message'           => 'Merci ! Nous avons bien noté que vous n\'êtes pas encore sûr(e) de votre présence.',
            'color'             => '#d97706',
        ],
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/invitations/{token}/accept
    // GET /api/invitations/{token}/decline
    // GET /api/invitations/{token}/maybe
    // ─────────────────────────────────────────────────────────────────────────

    public function accept(string $token): Response
    {
        return $this->handleResponse($token, 'accept');
    }

    public function decline(string $token): Response
    {
        return $this->handleResponse($token, 'decline');
    }

    public function maybe(string $token): Response
    {
        return $this->handleResponse($token, 'maybe');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Trouver le participant, mettre à jour son statut et retourner la page HTML.
     */
    private function handleResponse(string $token, string $type): Response
    {
        $config      = self::RESPONSES[$type];
        $participant = ParticipantReunion::where('part_token', $token)->first();

        if (!$participant) {
            return $this->htmlPage(
                'Lien invalide',
                'Ce lien de réponse est invalide ou a expiré.',
                '#6b7280'
            );
        }

        $participant->update([
            'part_statut_invitation' => $config['statut_invitation'],
            'part_statut'            => $config['statut'],
        ]);

        return $this->htmlPage($config['titre'], $config['message'], $config['color']);
    }

    /**
     * Générer une page HTML de confirmation — pas besoin de React pour ça.
     */
    private function htmlPage(string $titre, string $message, string $color): Response
    {
        return response(<<<HTML
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>XAMIO — {$titre}</title>
            <style>
                *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                }
                .card {
                    background: #fff;
                    border-radius: 16px;
                    padding: 48px 40px;
                    text-align: center;
                    max-width: 440px;
                    width: 100%;
                    box-shadow: 0 4px 24px rgba(0,0,0,.08);
                }
                h1 {
                    font-size: 22px;
                    font-weight: 700;
                    color: {$color};
                    margin-bottom: 12px;
                }
                p {
                    font-size: 15px;
                    color: #64748b;
                    line-height: 1.6;
                    margin-bottom: 28px;
                }
                .logo {
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: .1em;
                    color: #cbd5e1;
                    text-transform: uppercase;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #f1f5f9;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>{$titre}</h1>
                <p>{$message}</p>
                <div class="logo">XAMIO · Technosus</div>
            </div>
        </body>
        </html>
        HTML, 200)->header('Content-Type', 'text/html');
    }
}