<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Section Notifications
    |--------------------------------------------------------------------------
    */

    'title' => 'Préférences de notifications',

    'channels_label' => 'CANAUX',

    'channels' => [
        'email' => [
            'label' => 'Notifications email',
            'sub'   => 'Invitations, résumés, alertes',
        ],
        'sms' => [
            'label' => 'Notifications SMS',
            'sub'   => 'Rappels urgents via Twilio',
        ],
        'push' => [
            'label' => 'Notifications push (in-app)',
            'sub'   => 'Alertes temps réel dans le navigateur',
        ],
    ],

    'reminders_label' => 'RAPPELS',

    'reminders' => [
        'remind_24h' => [
            'label' => 'Rappel 24h avant',
            'sub'   => 'Événements, réunions, rendez-vous',
        ],
        'remind_1h' => [
            'label' => 'Rappel 1h avant',
            'sub'   => 'Événements, réunions, rendez-vous',
        ],
        'digest' => [
            'label' => 'Digest quotidien',
            'sub'   => 'Résumé de l\'activité chaque matin',
        ],
    ],

];
