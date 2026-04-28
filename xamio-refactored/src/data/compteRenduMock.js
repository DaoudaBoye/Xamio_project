/**
 * XAMIO — Mock data pour le Compte Rendu Intelligent
 * Simule les données d'un document uploadé et les réponses IA
 */

export const MOCK_DOCUMENT = {
  id: 'doc-001',
  name: 'CR_Reunion_Q1_Strategie.pdf',
  size: 248576, // ~242 KB
  type: 'application/pdf',
  uploadedAt: new Date().toISOString(),
  content: `COMPTE RENDU DE RÉUNION
Revue Q1 — Stratégie commerciale

Date : 25 mars 2025 | 09h00 – 10h30
Lieu : Salle Atlas, Dakar
Organisateur : A. Diallo
Présents : A. Diallo (PDG), F. Ndiaye (Directeur Commercial), M. Sow (Responsable Marketing), K. Diop (CFO)

────────────────────────────────────────────────────────

1. BILAN DES VENTES Q1

Le directeur commercial présente un bilan des ventes du premier trimestre. Le chiffre d'affaires s'établit à 87,4 M FCFA, soit une progression de 23% par rapport au Q1 2024. Les produits phares restent les licences SaaS (62% du CA) et les prestations d'intégration (28%).

Zones de performance :
- Dakar : +31% (moteur principal de croissance)
- Saint-Louis : +12%
- Thiès : +8%

Points de vigilance identifiés :
- Taux de churn légèrement en hausse : 4,2% vs 3,1% l'an dernier
- Délai moyen de signature : 34 jours (objectif : < 25 jours)
- 3 comptes stratégiques en phase de négociation (Sonatel, BICIS, Orange Sénégal)

2. OBJECTIFS Q2

Après discussion, l'équipe s'accorde sur les objectifs suivants pour Q2 :
- CA cible : 110 M FCFA (+26% vs Q1)
- Nouveaux clients signés : minimum 15
- Réduction du churn à 3%
- Délai de signature ramené à 28 jours max

3. STRATÉGIE EXPANSION CÔTE D'IVOIRE

Le PDG présente le plan d'expansion sur la Côte d'Ivoire avec une ouverture de bureau prévue en juin 2025. Le marché ivoirien est estimé à 3x le marché sénégalais. Budget alloué : 25 M FCFA pour l'installation et les 3 premiers mois d'opération.

Partenariat envisagé avec Expertise France pour l'accès aux entreprises locales.

DÉCISIONS PRISES :
✓ Validation du budget d'expansion CI à 25 M FCFA
✓ Recrutement d'un Country Manager Côte d'Ivoire avant avril 2025
✓ Lancement d'une offre promotionnelle Q2 (remise 20% sur les licences annuelles)
✓ Mise en place d'un tableau de bord churn hebdomadaire

ACTIONS À SUIVRE :
→ F. Ndiaye : Préparer le plan commercial Q2 détaillé — Échéance : 28 mars
→ K. Diop : Réviser les projections financières incluant CI — Échéance : 30 mars
→ M. Sow : Concevoir la campagne marketing Q2 — Échéance : 1er avril
→ A. Diallo : Contacter Expertise France pour le partenariat CI — Échéance : 29 mars

Prochaine réunion : 8 avril 2025 à 09h00 — Revue mi-trimestre Q2`,
};

export const MOCK_SUMMARY = `La réunion du Q1 a permis de faire le point sur une performance commerciale solide (+23% de CA vs N-1, à 87,4 M FCFA), malgré une légère dégradation du taux de churn. L'équipe a validé des objectifs ambitieux pour Q2 (110 M FCFA) et a acté le lancement de l'expansion en Côte d'Ivoire avec un budget de 25 M FCFA. Un Country Manager doit être recruté avant avril 2025. Des actions correctives sur le churn et les délais de signature ont été décidées.`;

export const MOCK_KEY_POINTS = {
  decisions: [
    'Budget d\'expansion Côte d\'Ivoire validé à 25 M FCFA',
    'Recrutement d\'un Country Manager CI avant avril 2025',
    'Lancement d\'une offre promotionnelle Q2 avec remise de 20% sur les licences annuelles',
    'Mise en place d\'un tableau de bord churn hebdomadaire',
  ],
  actions: [
    { text: 'Préparer le plan commercial Q2 détaillé', assignee: 'F. Ndiaye', due: '28/03/2025' },
    { text: 'Réviser les projections financières incluant CI', assignee: 'K. Diop', due: '30/03/2025' },
    { text: 'Concevoir la campagne marketing Q2', assignee: 'M. Sow', due: '01/04/2025' },
    { text: 'Contacter Expertise France pour le partenariat CI', assignee: 'A. Diallo', due: '29/03/2025' },
  ],
  highlights: [
    'CA Q1 : 87,4 M FCFA — progression de 23% vs Q1 2024',
    'Taux de churn en hausse : 4,2% vs 3,1% (point de vigilance)',
    '3 comptes stratégiques en négociation : Sonatel, BICIS, Orange Sénégal',
    'Objectif CA Q2 : 110 M FCFA avec 15 nouveaux clients minimum',
    'Ouverture du bureau Côte d\'Ivoire prévue en juin 2025',
  ],
};

export const SUGGESTED_QUESTIONS = [
  'Quels sont les points importants ?',
  'Quelles décisions ont été prises ?',
  'Quelles sont les prochaines actions ?',
  'Quel est l\'état du churn ?',
  'Parle-moi de l\'expansion CI',
];

export const AI_RESPONSES = {
  'Quels sont les points importants ?': `Voici les points clés de ce compte rendu :

**📊 Performance Q1**
Le CA s'élève à 87,4 M FCFA, en hausse de 23% par rapport à 2024. Dakar reste le moteur principal avec +31%.

**⚠️ Points de vigilance**
Le taux de churn a augmenté à 4,2% (vs 3,1% l'an passé) et les délais de signature restent trop longs (34 jours vs objectif de 25 jours).

**🎯 Objectifs Q2**
L'équipe vise 110 M FCFA de CA, avec un minimum de 15 nouveaux clients et un churn ramené à 3%.

**🌍 Expansion Côte d'Ivoire**
Le lancement est prévu pour juin 2025 avec un budget de 25 M FCFA. Un partenariat avec Expertise France est à l'étude.`,

  'Quelles décisions ont été prises ?': `4 décisions majeures ont été actées lors de cette réunion :

1. ✅ **Budget CI validé** — 25 M FCFA alloués pour l'expansion en Côte d'Ivoire
2. ✅ **Recrutement Country Manager** — Poste à pourvoir avant fin avril 2025
3. ✅ **Offre promo Q2** — Remise de 20% sur les licences annuelles pour stimuler les signatures
4. ✅ **Dashboard churn hebdomadaire** — Outil de suivi à mettre en place immédiatement

Ces décisions traduisent une double priorité : consolider la base existante (réduire le churn) tout en accélérant la croissance (expansion régionale).`,

  'Quelles sont les prochaines actions ?': `4 actions ont été assignées avec des responsables et des échéances claires :

| Action | Responsable | Échéance |
|---|---|---|
| Plan commercial Q2 détaillé | F. Ndiaye | 28 mars |
| Projections financières + CI | K. Diop | 30 mars |
| Campagne marketing Q2 | M. Sow | 1er avril |
| Contact Expertise France | A. Diallo | 29 mars |

La prochaine réunion est programmée le **8 avril 2025** pour une revue mi-trimestre Q2.`,

  'Quel est l\'état du churn ?': `Le churn est identifié comme un point de vigilance dans ce compte rendu :

**📈 Situation actuelle**
Le taux de churn est passé de **3,1%** (Q1 2024) à **4,2%** (Q1 2025), soit une dégradation d'environ 1 point.

**🎯 Objectif Q2**
L'équipe s'est fixé un objectif de ramener le churn à **3%** pour le deuxième trimestre.

**🛠️ Mesure corrective**
La mise en place d'un **tableau de bord churn hebdomadaire** a été décidée pour suivre l'évolution en temps réel et réagir rapidement.

Il serait pertinent d'analyser les raisons de départ des clients perdus pour cibler les actions de rétention.`,

  'Parle-moi de l\'expansion CI': `L'expansion en Côte d'Ivoire est un projet structurant présenté lors de cette réunion :

**🌍 Marché cible**
La Côte d'Ivoire représente un marché estimé à **3 fois** le marché sénégalais, ce qui en fait une priorité stratégique.

**📅 Planning**
- Ouverture du bureau local : **juin 2025**
- Recrutement du Country Manager : **avant fin avril 2025**

**💰 Budget**
25 M FCFA alloués pour l'installation et les 3 premiers mois d'opération.

**🤝 Partenariat**
Un rapprochement avec **Expertise France** est envisagé pour faciliter l'accès au tissu d'entreprises locales. A. Diallo doit les contacter avant le 29 mars.`,

  default: `Bonne question ! D'après l'analyse de ce compte rendu de réunion, voici ce que je peux vous dire :

Le document porte sur la **Revue Q1 — Stratégie commerciale** du 25 mars 2025. Il couvre le bilan des ventes Q1 (87,4 M FCFA, +23%), les objectifs Q2 (110 M FCFA cible), et le plan d'expansion en Côte d'Ivoire.

Si vous avez une question plus précise sur un aspect particulier — performance, décisions, actions, expansion — n'hésitez pas à la reformuler et j'irai chercher l'information directement dans le document.`,
};

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

export function getAIResponse(question) {
  // Try exact match first
  if (AI_RESPONSES[question]) return AI_RESPONSES[question];
  // Fuzzy match
  const q = question.toLowerCase();
  if (q.includes('churn') || q.includes('désabonn')) return AI_RESPONSES['Quel est l\'état du churn ?'];
  if (q.includes('côte') || q.includes('ivoire') || q.includes('ci') || q.includes('expans')) return AI_RESPONSES['Parle-moi de l\'expansion CI'];
  if (q.includes('décision')) return AI_RESPONSES['Quelles décisions ont été prises ?'];
  if (q.includes('action') || q.includes('prochaine') || q.includes('suite')) return AI_RESPONSES['Quelles sont les prochaines actions ?'];
  if (q.includes('important') || q.includes('point') || q.includes('clé') || q.includes('résumé')) return AI_RESPONSES['Quels sont les points importants ?'];
  return AI_RESPONSES['default'];
}
