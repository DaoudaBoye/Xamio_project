<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Section Intégrations
    |--------------------------------------------------------------------------
    */

    'title'         => 'Intégrations',
    'connect'       => 'Connecter',
    'disconnect'    => 'Déconnecter',
    'connected'     => '✓ Connecté',
    'not_connected' => '— Non connecté',
    'badge_plan'    => 'Entreprise',

    'list' => [
        'google_calendar' => [
            'name' => 'Google Calendar',
            'desc' => 'Synchroniser votre calendrier Google avec XAMIO',
        ],
        'slack' => [
            'name' => 'Slack',
            'desc' => 'Recevoir les notifications dans vos channels Slack',
        ],
        'ms_teams' => [
            'name' => 'Microsoft Teams',
            'desc' => 'Intégration Teams pour les réunions en ligne',
        ],
        'twilio' => [
            'name' => 'Twilio SMS',
            'desc' => 'Envoi de rappels et alertes par SMS',
        ],
        'api' => [
            'name' => 'API Publique',
            'desc' => 'Accès développeur via l\'API REST XAMIO',
        ],
    ],

    'toasts' => [
        'connected'    => ':name connecté !',
        'disconnected' => ':name déconnecté.',
    ],

];
