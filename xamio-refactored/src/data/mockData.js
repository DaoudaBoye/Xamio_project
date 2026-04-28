/* ─── MEETINGS ─────────────────────────────────────────────────────────── */
export const meetings = [
  {
    id: 1,
    title: 'Revue Q1 — Stratégie commerciale',
    date: '2026-05-10',
    time: '09:00',
    duration: 90,
    location: 'Salle Atlas, Dakar',
    organizer: 'A. Diallo',
    participants: ['A. Diallo', 'F. Ndiaye', 'M. Sow', 'K. Diop'],
    status: 'pending_validation',
    visibility: 'all',
    agenda: ['Bilan des ventes Q1', 'Objectifs Q2', 'Stratégie expansion Côte d\'Ivoire'],
    summary: '',
    decisions: [],
    actions: [],
  },
  {
    id: 2,
    title: 'Sprint planning — Module IA',
    date: '2026-04-15',
    time: '14:00',
    duration: 60,
    location: 'Visioconférence',
    organizer: 'Dev team',
    participants: ['Tech lead', 'Backend dev', 'AI engineer'],
    status: 'done',
    visibility: 'all',
    agenda: ['Choix du framework IA', 'Estimation des délais', 'Répartition des tâches'],
    summary: 'L\'équipe a décidé d\'adopter FastAPI pour le module IA avec un délai estimé à 6 semaines. Priorité donnée aux résumés automatiques de réunions.',
    decisions: ['Adopter FastAPI comme backend IA', 'Délai de 6 semaines pour la v1', 'Priorité aux résumés de réunions'],
    actions: [
      { text: 'Configurer l\'environnement FastAPI', assignee: 'Backend dev', due: '2026-04-20' },
      { text: 'Intégrer OpenAI API', assignee: 'AI engineer', due: '2026-04-25' },
      { text: 'Rédiger les specs du module', assignee: 'Tech lead', due: '2026-04-18' },
    ],
  },
  {
    id: 3,
    title: 'Onboarding entreprise pilote — Sonatel',
    date: '2026-05-15',
    time: '10:30',
    duration: 120,
    location: 'Siège Sonatel, Dakar',
    organizer: 'A. Diallo',
    participants: ['Commercial', 'Support', 'DG Sonatel', 'DSI Sonatel'],
    status: 'pending_validation',
    visibility: 'all',
    agenda: ['Présentation XAMIO', 'Démo live', 'Questions / Réponses', 'Signature contrat pilote'],
    summary: '',
    decisions: [],
    actions: [],
  },
  {
    id: 4,
    title: 'Réunion de board — Investisseurs',
    date: '2026-04-10',
    time: '16:00',
    duration: 90,
    location: 'Paris (Visio)',
    organizer: 'Direction',
    participants: ['PDG', 'CFO', 'Investisseurs Series A'],
    status: 'done',
    visibility: 'direction',
    agenda: ['Budget 2025', 'Roadmap produit', 'Plan de recrutement'],
    summary: 'Budget 2025 validé à hauteur de 150M FCFA. Recrutement de 5 développeurs approuvé. Objectif 100 entreprises clientes d\'ici fin d\'année.',
    decisions: ['Budget 150M FCFA validé', '5 recrutements approuvés', 'Objectif 100 clients fin 2025'],
    actions: [
      { text: 'Lancer les offres d\'emploi', assignee: 'RH', due: '2026-04-15' },
      { text: 'Réviser le plan financier', assignee: 'CFO', due: '2026-04-20' },
    ],
  },
  {
    id: 5,
    title: 'Weekly design review',
    date: '2026-05-05',
    time: '11:00',
    duration: 45,
    location: 'Bureau XAMIO',
    organizer: 'Design lead',
    participants: ['Design lead', 'Product', 'Frontend dev'],
    status: 'upcoming',
    visibility: 'all',
    agenda: ['Review maquettes mobile', 'Feedback composants UI', 'Planning sprint design'],
    summary: '',
    decisions: [],
    actions: [],
  },
];

/* ─── TASKS ─────────────────────────────────────────────────────────────── */
export const initialTasks = {
  todo: [
    { id: 't1', title: 'Concevoir la maquette mobile PWA', priority: 'high', assignee: 'A. Diallo', due: '10 mai 2026', tags: ['Design'], description: 'Créer les écrans mobile pour les modules Réunions et Tâches.' },
    { id: 't2', title: 'Rédiger les specs de l\'API publique', priority: 'medium', assignee: 'Tech lead', due: '15 mai 2026', tags: ['Dev', 'Docs'], description: 'Documentation OpenAPI/Swagger pour les partenaires.' },
    { id: 't3', title: 'Préparer deck investisseurs Series B', priority: 'high', assignee: 'A. Diallo', due: '20 mai 2026', tags: ['Bizdev'], description: '' },
  ],
  inprogress: [
    { id: 't4', title: 'Module notifications SMS (Twilio)', priority: 'high', assignee: 'Backend dev', due: '8 mai 2026', tags: ['Dev'], description: 'Intégration Twilio pour rappels 24h/1h avant événements.' },
    { id: 't5', title: 'Dashboard analytics avancé', priority: 'medium', assignee: 'Frontend dev', due: '12 mai 2026', tags: ['Dev', 'Design'], description: 'Graphiques de suivi des KPIs clés.' },
    { id: 't6', title: 'Tests de charge infrastructure', priority: 'low', assignee: 'DevOps', due: '14 mai 2026', tags: ['Infra'], description: '' },
  ],
  done: [
    { id: 't7', title: 'Authentification JWT + 2FA', priority: 'high', assignee: 'Backend dev', due: '1 avril 2026', tags: ['Dev', 'Security'], description: 'Système d\'auth complet avec refresh tokens et 2FA pour admins.' },
    { id: 't8', title: 'Schéma base de données v1', priority: 'high', assignee: 'Backend dev', due: '28 mars 2026', tags: ['Dev'], description: '' },
    { id: 't9', title: 'Maquettes écrans desktop', priority: 'medium', assignee: 'Design lead', due: '20 mars 2026', tags: ['Design'], description: '' },
    { id: 't10', title: 'Charte graphique & brand guide', priority: 'medium', assignee: 'Design lead', due: '15 mars 2026', tags: ['Design'], description: '' },
  ],
};

/* ─── DOCUMENTS ─────────────────────────────────────────────────────────── */
export const documents = [
  { id: 'd1', name: 'Présentation commerciale XAMIO.pdf',  size: '3.2 MB', date: '1 avril 2026',  type: 'pdf',  shared: true,  category: 'Commercial', author: 'A. Diallo' },
  { id: 'd2', name: 'Document technique v1.0.pdf',          size: '1.8 MB', date: '28 mars 2026',  type: 'pdf',  shared: false, category: 'Technique',  author: 'Tech lead' },
  { id: 'd3', name: 'Roadmap 2026 — détaillée.xlsx',        size: '540 KB', date: '25 mars 2026',  type: 'xlsx', shared: true,  category: 'Stratégie',  author: 'A. Diallo' },
  { id: 'd4', name: 'Charte graphique XAMIO.fig',           size: '12 MB',  date: '20 mars 2026',  type: 'fig',  shared: false, category: 'Design',     author: 'Design lead' },
  { id: 'd5', name: 'Contrat pilote — Sonatel.docx',        size: '210 KB', date: '15 mars 2026',  type: 'docx', shared: false, category: 'Juridique',  author: 'A. Diallo' },
  { id: 'd6', name: 'Budget prévisionnel 2026.xlsx',        size: '890 KB', date: '10 mars 2026',  type: 'xlsx', shared: false, category: 'Finance',    author: 'CFO' },
  { id: 'd7', name: 'Onboarding guide utilisateur.pdf',     size: '4.1 MB', date: '5 mars 2026',   type: 'pdf',  shared: true,  category: 'Support',    author: 'Support' },
];

/* ─── APPOINTMENTS ───────────────────────────────────────────────────────── */
export const appointments = [
  { id: 'a1', title: 'Démo produit — CBAO Groupe Attijariwafa',  date: '2026-05-10', time: '11:00', duration: 60,  with: 'M. Touré (DG)',       location: 'Siège CBAO',          status: 'confirmed', type: 'demo'        },
  { id: 'a2', title: 'Réunion partenariat — Orange Money',        date: '2026-05-12', time: '15:30', duration: 90,  with: 'Équipe digital',       location: 'Orange Sonatel',      status: 'confirmed', type: 'partnership' },
  { id: 'a3', title: 'Call investisseurs Series A',               date: '2026-05-20', time: '09:00', duration: 60,  with: 'VC Paris (3 pers.)',   location: 'Visioconférence',     status: 'pending',   type: 'investment'  },
  { id: 'a4', title: 'Déjeuner commercial — Ecobank',             date: '2026-05-22', time: '12:30', duration: 90,  with: 'Directeur commercial', location: 'Restaurant Le Lagon', status: 'confirmed', type: 'commercial'  },
  { id: 'a5', title: 'Présentation DRH — Groupe CFAO',            date: '2026-05-25', time: '10:00', duration: 45,  with: 'DRH Groupe CFAO',     location: 'CFAO Dakar',          status: 'pending',   type: 'hr'          },
];

/* ─── WORKSHOPS ──────────────────────────────────────────────────────────── */
export const workshops = [
  { id: 'w1', title: 'Formation XAMIO — Équipe pilote Sonatel', date: '2026-06-05', duration: '1 jour', participants: 15, trainer: 'Support XAMIO', status: 'planned', category: 'Onboarding' },
  { id: 'w2', title: 'Atelier design thinking — Roadmap v2',    date: '2026-06-10', duration: '3h',     participants: 8,  trainer: 'A. Diallo',     status: 'planned', category: 'Interne'    },
];

/* ─── STATS ──────────────────────────────────────────────────────────────── */
export const stats = [
  { label: 'Réunions ce mois',    value: '24', delta: '+8',  color: 'teal',   icon: 'meetings'  },
  { label: 'Tâches complétées',   value: '47', delta: '+12', color: 'gold',   icon: 'tasks'     },
  { label: 'Documents partagés',  value: '18', delta: '+3',  color: 'blue',   icon: 'documents' },
  { label: 'Utilisateurs actifs', value: '5',  delta: '0',   color: 'purple', icon: 'users'     },
];

/* ─── NOTIFICATIONS ──────────────────────────────────────────────────────── */
export const notifications = [
  { id: 'n1', text: 'Réunion "Revue Q1" en attente de votre validation',  time: 'il y a 10 min', read: false, type: 'validation'  },
  { id: 'n2', text: 'Réunion "Onboarding Sonatel" en attente de validation', time: 'il y a 30 min', read: false, type: 'validation' },
  { id: 'n3', text: 'F. Ndiaye a partagé un document',                    time: 'il y a 2h',     read: true,  type: 'document'    },
  { id: 'n4', text: 'Tâche "Auth JWT" marquée terminée',                  time: 'il y a 4h',     read: true,  type: 'task'        },
  { id: 'n5', text: 'Nouveau RDV ajouté — Ecobank',                       time: 'hier',          read: true,  type: 'appointment' },
];