<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Section Apparence
    |--------------------------------------------------------------------------
    */

    'title' => 'Apparence',

    'theme' => [
        'label' => 'Thème de l\'interface',
        'sub'   => 'Sombre ou clair selon vos préférences',
    ],

    'language' => [
        'label'   => 'Langue de l\'interface',
        'sub'     => 'Langue d\'affichage de XAMIO',
        'options' => [
            'fr' => 'Français',
            'en' => 'English',
            'wo' => 'Wolof',
        ],
    ],

    'date_format' => [
        'label'   => 'Format de date',
        'sub'     => 'DD/MM/YYYY ou MM/DD/YYYY',
        'options' => [
            'dmy' => 'JJ/MM/AAAA',
            'mdy' => 'MM/JJ/AAAA',
        ],
    ],

    'sidebar' => [
        'label' => 'Sidebar réduite par défaut',
        'sub'   => 'Démarrer avec le menu latéral compact',
    ],

    'toasts' => [
        'preference_saved' => 'Préférence sauvegardée.',
    ],

];
