<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Section Plan & Facturation
    |--------------------------------------------------------------------------
    */

    'title'        => 'Plan & facturation',
    'current_plan' => 'PLAN ACTUEL',
    'renewal'      => 'PROCHAIN RENOUVELLEMENT',
    'current_badge'=> '✓ Plan actuel',

    'plans' => [
        'free' => [
            'name'     => 'Gratuit',
            'price'    => '0',
            'unit'     => 'FCFA/mois',
            'features' => [
                'Réunions basiques',
                'Tâches',
                '1 Go stockage',
            ],
            'cta'      => 'Tester gratuitement',
        ],
        'pro' => [
            'name'     => 'Pro',
            'price'    => '2 500',
            'unit'     => 'FCFA/user/mois',
            'features' => [
                'Tout Gratuit',
                'Ateliers & Docs',
                'SMS & Push',
                'Dashboard avancé',
            ],
            'cta'      => 'Passer à Pro',
        ],
        'enterprise' => [
            'name'     => 'Entreprise',
            'price'    => 'Devis',
            'unit'     => 'Illimité',
            'features' => [
                'Tout Pro',
                'Module IA complet',
                'API publique',
                'SLA garanti',
            ],
            'cta'      => 'Nous contacter',
        ],
    ],

    'toasts' => [
        'redirect' => 'Redirection vers :plan…',
    ],

];
