<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Section Sécurité
    |--------------------------------------------------------------------------
    */

    'title' => 'Sécurité du compte',

    'two_fa' => [
        'label' => 'Double authentification (2FA)',
        'sub'   => 'TOTP via application d\'authentification',
    ],

    'sessions' => [
        'label'  => 'Déconnexion des autres sessions',
        'sub'    => 'Invalider tous les tokens actifs',
        'button' => 'Déconnecter',
    ],

    'change_password' => [
        'label'           => 'CHANGER LE MOT DE PASSE',
        'current'         => 'MOT DE PASSE ACTUEL',
        'new'             => 'NOUVEAU MOT DE PASSE',
        'confirm'         => 'CONFIRMER',
        'submit'          => 'Mettre à jour',
        'placeholder'     => '••••••••',
    ],

    'toasts' => [
        'twofa_enabled'   => '2FA activé.',
        'twofa_disabled'  => '2FA désactivé.',
        'sessions_closed' => 'Toutes les sessions ont été fermées.',
    ],

];
