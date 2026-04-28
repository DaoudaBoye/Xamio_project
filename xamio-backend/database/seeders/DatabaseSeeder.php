<?php

namespace Database\Seeders;

use App\Models\Abonnement;
use App\Models\Appartenance;
use App\Models\Departement;
use App\Models\MembreDepartement;
use App\Models\Organisation;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Plans ──────────────────────────────────────────────────────────
        $planGratuit = Plan::firstOrCreate(
            ['plan_nom' => 'Gratuit'],
            [
                'plan_prix_fcfa' => 0,
                'plan_max_users' => 5,
                'plan_ia_actif'  => false,
            ]
        );

        $planPro = Plan::firstOrCreate(
            ['plan_nom' => 'Pro'],
            [
                'plan_prix_fcfa' => 2500,
                'plan_max_users' => null,
                'plan_ia_actif'  => false,
            ]
        );

        Plan::firstOrCreate(
            ['plan_nom' => 'Entreprise'],
            [
                'plan_prix_fcfa' => 0,
                'plan_max_users' => null,
                'plan_ia_actif'  => true,
            ]
        );

        // ── 2. Rôles ──────────────────────────────────────────────────────────
        $roleSuperAdmin = Role::firstOrCreate(['role_nom' => 'Super Admin']);
        $roleAdmin      = Role::firstOrCreate(['role_nom' => 'Admin Entreprise']);
        $roleManager    = Role::firstOrCreate(['role_nom' => 'Manager']);
        $roleAssistant  = Role::firstOrCreate(['role_nom' => 'Assistant']);
        $roleEmploye    = Role::firstOrCreate(['role_nom' => 'Employé']);
        $roleDirecteur  = Role::firstOrCreate(['role_nom' => 'Directeur']);

        // ════════════════════════════════════════════════════════════════════
        //  ORGANISATION 1 — XAMIO Demo  (Plan Gratuit)
        // ════════════════════════════════════════════════════════════════════

        $org1 = Organisation::firstOrCreate(
            ['org_slug' => 'xamio-demo'],
            [
                'org_nom'   => 'XAMIO Demo',
                'org_pays'  => 'Sénégal',
                'org_actif' => true,
            ]
        );

        Abonnement::firstOrCreate(
            ['org_id' => $org1->org_id],
            [
                'abo_date_debut'   => now()->toDateString(),
                'abo_date_fin'     => now()->addYear()->toDateString(),
                'abo_statut'       => 'actif',
                'abo_montant_fcfa' => 0,
                'plan_id'          => $planGratuit->plan_id,
            ]
        );

        // ── Utilisateurs — Org 1 ──────────────────────────────────────────────
        $usersOrg1Data = [

            // Admin & Direction
            ['util_prenom' => 'Mamadou',  'util_nom' => 'Sow',     'email' => 'admin@xamio.io',            'role' => $roleAdmin],
            ['util_prenom' => 'Amadou',   'util_nom' => 'Diallo',  'email' => 'directeur@xamio.io',        'role' => $roleDirecteur],

            // Assistantes
            ['util_prenom' => 'Aissatou', 'util_nom' => 'Ba',      'email' => 'assistante@xamio.io',       'role' => $roleAssistant],
            ['util_prenom' => 'Mariama',  'util_nom' => 'Ndiaye',  'email' => 'assistante2@xamio.io',      'role' => $roleAssistant],

            // Managers
            ['util_prenom' => 'Fatou',    'util_nom' => 'Diallo',  'email' => 'manager@xamio.io',          'role' => $roleManager],
            ['util_prenom' => 'Ousmane',  'util_nom' => 'Diop',    'email' => 'manager.finance@xamio.io',  'role' => $roleManager],
            ['util_prenom' => 'Cheikh',   'util_nom' => 'Mbaye',   'email' => 'manager.tech@xamio.io',     'role' => $roleManager],
            ['util_prenom' => 'Rokhaya',  'util_nom' => 'Sarr',    'email' => 'manager.rh@xamio.io',       'role' => $roleManager],

            // Employés
            ['util_prenom' => 'Ibrahima', 'util_nom' => 'Fall',    'email' => 'employe@xamio.io',          'role' => $roleEmploye],
            ['util_prenom' => 'Khady',    'util_nom' => 'Faye',    'email' => 'employe2@xamio.io',         'role' => $roleEmploye],
            ['util_prenom' => 'Modou',    'util_nom' => 'Niang',   'email' => 'employe3@xamio.io',         'role' => $roleEmploye],
            ['util_prenom' => 'Aminata',  'util_nom' => 'Cissé',   'email' => 'employe4@xamio.io',         'role' => $roleEmploye],
            ['util_prenom' => 'Lamine',   'util_nom' => 'Konaté',  'email' => 'employe5@xamio.io',         'role' => $roleEmploye],
            ['util_prenom' => 'Ndéye',    'util_nom' => 'Gueye',   'email' => 'employe6@xamio.io',         'role' => $roleEmploye],
            ['util_prenom' => 'Aliou',    'util_nom' => 'Bah',     'email' => 'employe7@xamio.io',         'role' => $roleEmploye],
            ['util_prenom' => 'Sokhna',   'util_nom' => 'Dieng',   'email' => 'employe8@xamio.io',         'role' => $roleEmploye],
        ];

        $usersOrg1 = $this->seedUsers($usersOrg1Data, $org1);

        // ── Départements — Org 1 ─────────────────────────────────────────────
        $this->seedDepartements([
            [
                'dept_nom'         => 'Direction',
                'dept_description' => 'Direction générale de l\'organisation',
                'user_id'          => $usersOrg1['directeur@xamio.io']->id,
                'membres'          => [
                    $usersOrg1['directeur@xamio.io']->id,
                    $usersOrg1['admin@xamio.io']->id,
                    $usersOrg1['assistante@xamio.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Finance',
                'dept_description' => 'Gestion financière et comptabilité',
                'user_id'          => $usersOrg1['manager.finance@xamio.io']->id,
                'membres'          => [
                    $usersOrg1['manager.finance@xamio.io']->id,
                    $usersOrg1['employe@xamio.io']->id,
                    $usersOrg1['employe2@xamio.io']->id,
                    $usersOrg1['assistante2@xamio.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Technologie',
                'dept_description' => 'Développement et infrastructure IT',
                'user_id'          => $usersOrg1['manager.tech@xamio.io']->id,
                'membres'          => [
                    $usersOrg1['manager.tech@xamio.io']->id,
                    $usersOrg1['employe3@xamio.io']->id,
                    $usersOrg1['employe4@xamio.io']->id,
                    $usersOrg1['employe5@xamio.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Opérations',
                'dept_description' => 'Gestion des opérations et logistique',
                'user_id'          => $usersOrg1['manager@xamio.io']->id,
                'membres'          => [
                    $usersOrg1['manager@xamio.io']->id,
                    $usersOrg1['employe6@xamio.io']->id,
                    $usersOrg1['employe7@xamio.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Ressources Humaines',
                'dept_description' => 'Gestion des ressources humaines',
                'user_id'          => $usersOrg1['manager.rh@xamio.io']->id,
                'membres'          => [
                    $usersOrg1['manager.rh@xamio.io']->id,
                    $usersOrg1['assistante@xamio.io']->id,
                    $usersOrg1['employe8@xamio.io']->id,
                ],
            ],
        ], $org1);


        // ════════════════════════════════════════════════════════════════════
        //  ORGANISATION 2 — Teranga Solutions  (Plan Pro)
        // ════════════════════════════════════════════════════════════════════

        $org2 = Organisation::firstOrCreate(
            ['org_slug' => 'teranga-solutions'],
            [
                'org_nom'   => 'Teranga Solutions',
                'org_pays'  => 'Sénégal',
                'org_actif' => true,
            ]
        );

        Abonnement::firstOrCreate(
            ['org_id' => $org2->org_id],
            [
                'abo_date_debut'   => now()->toDateString(),
                'abo_date_fin'     => now()->addYear()->toDateString(),
                'abo_statut'       => 'actif',
                'abo_montant_fcfa' => 2500,
                'plan_id'          => $planPro->plan_id,
            ]
        );

        // ── Utilisateurs — Org 2 ──────────────────────────────────────────────
        $usersOrg2Data = [

            // Admin & Direction
            ['util_prenom' => 'Seydou',   'util_nom' => 'Traoré',  'email' => 'admin@teranga.io',          'role' => $roleAdmin],
            ['util_prenom' => 'Binta',    'util_nom' => 'Camara',  'email' => 'directrice@teranga.io',     'role' => $roleDirecteur],

            // Assistants
            ['util_prenom' => 'Pape',     'util_nom' => 'Diouf',   'email' => 'assistant@teranga.io',      'role' => $roleAssistant],
            ['util_prenom' => 'Coumba',   'util_nom' => 'Sène',    'email' => 'assistant2@teranga.io',     'role' => $roleAssistant],

            // Managers
            ['util_prenom' => 'Moussa',   'util_nom' => 'Badji',   'email' => 'manager@teranga.io',        'role' => $roleManager],
            ['util_prenom' => 'Adja',     'util_nom' => 'Mbodj',   'email' => 'manager.finance@teranga.io','role' => $roleManager],
            ['util_prenom' => 'Babacar',  'util_nom' => 'Lô',      'email' => 'manager.tech@teranga.io',   'role' => $roleManager],
            ['util_prenom' => 'Yacine',   'util_nom' => 'Touré',   'email' => 'manager.rh@teranga.io',     'role' => $roleManager],

            // Employés
            ['util_prenom' => 'Assane',   'util_nom' => 'Sall',    'email' => 'employe@teranga.io',        'role' => $roleEmploye],
            ['util_prenom' => 'Rama',     'util_nom' => 'Diatta',  'email' => 'employe2@teranga.io',       'role' => $roleEmploye],
            ['util_prenom' => 'Malick',   'util_nom' => 'Niasse',  'email' => 'employe3@teranga.io',       'role' => $roleEmploye],
            ['util_prenom' => 'Dieynaba', 'util_nom' => 'Kouyaté', 'email' => 'employe4@teranga.io',       'role' => $roleEmploye],
            ['util_prenom' => 'Tidiane',  'util_nom' => 'Barry',   'email' => 'employe5@teranga.io',       'role' => $roleEmploye],
            ['util_prenom' => 'Gnilane',  'util_nom' => 'Sylla',   'email' => 'employe6@teranga.io',       'role' => $roleEmploye],
            ['util_prenom' => 'Demba',    'util_nom' => 'Wane',    'email' => 'employe7@teranga.io',       'role' => $roleEmploye],
            ['util_prenom' => 'Khadija',  'util_nom' => 'Ndiaye',  'email' => 'employe8@teranga.io',       'role' => $roleEmploye],
        ];

        $usersOrg2 = $this->seedUsers($usersOrg2Data, $org2);

        // ── Départements — Org 2 ─────────────────────────────────────────────
        $this->seedDepartements([
            [
                'dept_nom'         => 'Direction',
                'dept_description' => 'Direction générale de Teranga Solutions',
                'user_id'          => $usersOrg2['directrice@teranga.io']->id,
                'membres'          => [
                    $usersOrg2['directrice@teranga.io']->id,
                    $usersOrg2['admin@teranga.io']->id,
                    $usersOrg2['assistant@teranga.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Finance',
                'dept_description' => 'Gestion financière et comptabilité',
                'user_id'          => $usersOrg2['manager.finance@teranga.io']->id,
                'membres'          => [
                    $usersOrg2['manager.finance@teranga.io']->id,
                    $usersOrg2['employe@teranga.io']->id,
                    $usersOrg2['employe2@teranga.io']->id,
                    $usersOrg2['assistant2@teranga.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Technologie',
                'dept_description' => 'Développement et infrastructure IT',
                'user_id'          => $usersOrg2['manager.tech@teranga.io']->id,
                'membres'          => [
                    $usersOrg2['manager.tech@teranga.io']->id,
                    $usersOrg2['employe3@teranga.io']->id,
                    $usersOrg2['employe4@teranga.io']->id,
                    $usersOrg2['employe5@teranga.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Opérations',
                'dept_description' => 'Gestion des opérations et logistique',
                'user_id'          => $usersOrg2['manager@teranga.io']->id,
                'membres'          => [
                    $usersOrg2['manager@teranga.io']->id,
                    $usersOrg2['employe6@teranga.io']->id,
                    $usersOrg2['employe7@teranga.io']->id,
                ],
            ],
            [
                'dept_nom'         => 'Ressources Humaines',
                'dept_description' => 'Gestion des ressources humaines',
                'user_id'          => $usersOrg2['manager.rh@teranga.io']->id,
                'membres'          => [
                    $usersOrg2['manager.rh@teranga.io']->id,
                    $usersOrg2['assistant@teranga.io']->id,
                    $usersOrg2['employe8@teranga.io']->id,
                ],
            ],
        ], $org2);


        // ── 7. Résumé ─────────────────────────────────────────────────────────
        $this->command->info('');
        $this->command->info('✓ Base de données XAMIO initialisée avec succès !');
        $this->command->info('');

        $this->command->info('━━━  Organisation 1 : XAMIO Demo (Plan Gratuit)  ━━━');
        $this->command->table(
            ['Rôle', 'Email', 'Mot de passe'],
            [
                ['Admin Entreprise', 'admin@xamio.io',           'Xamio@2025!'],
                ['Directeur',        'directeur@xamio.io',       'Xamio@2025!'],
                ['Assistant',        'assistante@xamio.io',      'Xamio@2025!'],
                ['Assistant',        'assistante2@xamio.io',     'Xamio@2025!'],
                ['Manager',          'manager@xamio.io',         'Xamio@2025!'],
                ['Manager',          'manager.finance@xamio.io', 'Xamio@2025!'],
                ['Manager',          'manager.tech@xamio.io',    'Xamio@2025!'],
                ['Manager',          'manager.rh@xamio.io',      'Xamio@2025!'],
                ['Employé',          'employe@xamio.io',         'Xamio@2025!'],
                ['Employé',          'employe2@xamio.io',        'Xamio@2025!'],
                ['Employé',          'employe3@xamio.io',        'Xamio@2025!'],
                ['Employé',          'employe4@xamio.io',        'Xamio@2025!'],
                ['Employé',          'employe5@xamio.io',        'Xamio@2025!'],
                ['Employé',          'employe6@xamio.io',        'Xamio@2025!'],
                ['Employé',          'employe7@xamio.io',        'Xamio@2025!'],
                ['Employé',          'employe8@xamio.io',        'Xamio@2025!'],
            ]
        );
        $this->command->table(
            ['Département', 'Manager', 'Nb membres'],
            [
                ['Direction',           'Amadou Diallo', '3 membres'],
                ['Finance',             'Ousmane Diop',  '4 membres'],
                ['Technologie',         'Cheikh Mbaye',  '4 membres'],
                ['Opérations',          'Fatou Diallo',  '3 membres'],
                ['Ressources Humaines', 'Rokhaya Sarr',  '3 membres'],
            ]
        );

        $this->command->info('');
        $this->command->info('━━━  Organisation 2 : Teranga Solutions (Plan Pro)  ━━━');
        $this->command->table(
            ['Rôle', 'Email', 'Mot de passe'],
            [
                ['Admin Entreprise', 'admin@teranga.io',           'Xamio@2025!'],
                ['Directeur',        'directrice@teranga.io',      'Xamio@2025!'],
                ['Assistant',        'assistant@teranga.io',       'Xamio@2025!'],
                ['Assistant',        'assistant2@teranga.io',      'Xamio@2025!'],
                ['Manager',          'manager@teranga.io',         'Xamio@2025!'],
                ['Manager',          'manager.finance@teranga.io', 'Xamio@2025!'],
                ['Manager',          'manager.tech@teranga.io',    'Xamio@2025!'],
                ['Manager',          'manager.rh@teranga.io',      'Xamio@2025!'],
                ['Employé',          'employe@teranga.io',         'Xamio@2025!'],
                ['Employé',          'employe2@teranga.io',        'Xamio@2025!'],
                ['Employé',          'employe3@teranga.io',        'Xamio@2025!'],
                ['Employé',          'employe4@teranga.io',        'Xamio@2025!'],
                ['Employé',          'employe5@teranga.io',        'Xamio@2025!'],
                ['Employé',          'employe6@teranga.io',        'Xamio@2025!'],
                ['Employé',          'employe7@teranga.io',        'Xamio@2025!'],
                ['Employé',          'employe8@teranga.io',        'Xamio@2025!'],
            ]
        );
        $this->command->table(
            ['Département', 'Manager', 'Nb membres'],
            [
                ['Direction',           'Binta Camara',  '3 membres'],
                ['Finance',             'Adja Mbodj',    '4 membres'],
                ['Technologie',         'Babacar Lô',    '4 membres'],
                ['Opérations',          'Moussa Badji',  '3 membres'],
                ['Ressources Humaines', 'Yacine Touré',  '3 membres'],
            ]
        );

        $this->command->info('');
        $this->command->info('Total organisations : 2');
        $this->command->info('Total utilisateurs  : 32');
        $this->command->info('');
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    /**
     * Crée les utilisateurs et leurs appartenances pour une organisation donnée.
     *
     * @return array<string, User>  Tableau indexé par email
     */
    private function seedUsers(array $usersData, Organisation $organisation): array
    {
        $users = [];

        foreach ($usersData as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'util_nom'         => $data['util_nom'],
                    'util_prenom'      => $data['util_prenom'],
                    'password'         => Hash::make('Xamio@2025!'),
                    'util_twofa_actif' => false,
                ]
            );

            Appartenance::firstOrCreate(
                [
                    'org_id'  => $organisation->org_id,
                    'user_id' => $user->id,
                ],
                [
                    'role_id'        => $data['role']->role_id,
                    'app_date_ajout' => now()->toDateString(),
                    'app_statut'     => 'actif',
                ]
            );

            $users[$data['email']] = $user;
        }

        return $users;
    }

    /**
     * Crée les départements et leurs membres pour une organisation donnée.
     */
    private function seedDepartements(array $deptData, Organisation $organisation): void
    {
        foreach ($deptData as $data) {
            $dept = Departement::firstOrCreate(
                [
                    'org_id'   => $organisation->org_id,
                    'dept_nom' => $data['dept_nom'],
                ],
                [
                    'dept_description' => $data['dept_description'],
                    'dept_actif'       => true,
                    'user_id'          => $data['user_id'],
                ]
            );

            foreach ($data['membres'] as $userId) {
                MembreDepartement::firstOrCreate(
                    [
                        'dept_id' => $dept->dept_id,
                        'user_id' => $userId,
                    ],
                    [
                        'membdept_date_ajout' => now()->toDateString(),
                    ]
                );
            }
        }
    }
}