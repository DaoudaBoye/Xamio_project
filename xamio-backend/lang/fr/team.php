<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Section Équipe
    |--------------------------------------------------------------------------
    */

    'title'           => 'Équipe',
    'count'           => ':count membre dans l\'organisation',
    'count_plural'    => ':count membres dans l\'organisation',
    'count_simple'    => ':count membre',
    'count_simple_plural' => ':count membres',
    'no_results'      => 'Aucun membre trouvé.',

    /* Recherche & filtres */
    'search'          => 'Rechercher…',
    'search_dir'      => 'Rechercher un collègue…',
    'filter_all'      => 'Tous les rôles',

    /* En-têtes tableau */
    'col_member'      => 'Membre',
    'col_email'       => 'Email',
    'col_role'        => 'Rôle',
    'col_status'      => 'Statut',
    'col_actions'     => 'Actions',

    /* Boutons d'action */
    'add'             => 'Ajouter un membre',
    'edit'            => 'Modifier',
    'activate'        => 'Activer',
    'deactivate'      => 'Désactiver',
    'remove'          => 'Retirer',

    /* Pagination */
    'prev'            => '← Préc.',
    'next'            => 'Suiv. →',
    'pagination'      => ':from–:to sur :total',

    /* Formulaire création / édition */
    'form' => [
        'create_title'   => 'Ajouter un membre',
        'edit_title'     => 'Modifier le membre',

        'first_name'     => 'PRÉNOM',
        'last_name'      => 'NOM',
        'email'          => 'ADRESSE EMAIL',
        'role'           => 'RÔLE',
        'department'     => 'DÉPARTEMENT',

        'password_block_create' => 'MOT DE PASSE INITIAL',
        'password_block_edit'   => 'NOUVEAU MOT DE PASSE (optionnel)',
        'password'              => 'MOT DE PASSE',
        'confirm_password'      => 'CONFIRMER',
        'password_hint'         => '💡 L\'utilisateur pourra modifier son mot de passe lors de sa première connexion.',

        'submit_create'  => 'Ajouter le membre',
        'submit_edit'    => 'Enregistrer les modifications',

        'placeholders' => [
            'first_name' => 'Mamadou',
            'last_name'  => 'Sow',
            'email'      => 'mamadou.sow@organisation.io',
            'password'   => '••••••••',
        ],
    ],

    /* Boîte de confirmation suppression */
    'delete_modal' => [
        'title'   => 'Retirer ce membre ?',
        'body'    => ':name sera retiré de l\'organisation. Cette action est irréversible.',
        'confirm' => 'Retirer',
    ],

    /* Validation */
    'validation' => [
        'required'         => 'Requis',
        'invalid_email'    => 'Email invalide',
        'password_min'     => '8 caractères minimum',
        'password_confirm' => 'Ne correspond pas',
    ],

    /* Toasts */
    'toasts' => [
        'created'         => ':name ajouté à l\'équipe.',
        'updated'         => 'Membre mis à jour.',
        'deleted'         => 'Membre retiré de l\'organisation.',
        'activated'       => ':name activé.',
        'deactivated'     => ':name désactivé.',
        'load_error'      => 'Erreur lors du chargement de l\'équipe.',
        'delete_error'    => 'Erreur suppression',
        'status_error'    => 'Erreur statut',
    ],

];
