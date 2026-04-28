# XAMIO — Frontend React

La plateforme SaaS tout-en-un pensée pour les entreprises africaines.

## 🚀 Lancement rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur de développement
npm start

# 3. Build de production
npm run build
```

L'application sera disponible sur **http://localhost:3000**

**Identifiants de démo :**
- Email : `demo@xamio.io`
- Mot de passe : `xamio2025` (n'importe quel mot de passe ≥ 4 caractères)

---

## 📁 Structure du projet

```
src/
├── App.js                        # Routeur principal
├── index.js                      # Point d'entrée React
├── index.css                     # Variables CSS globales + animations
│
├── context/
│   ├── AuthContext.js            # Authentification (login/logout, user)
│   └── NotifContext.js           # Système de toasts/notifications
│
├── data/
│   └── mockData.js               # Données de démonstration
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.js          # Shell principal (sidebar + outlet)
│   │   ├── Sidebar.js            # Navigation latérale (collapsible)
│   │   └── TopBar.js             # Barre supérieure + notifications
│   │
│   ├── ui/
│   │   ├── Icon.js               # Icônes SVG inline
│   │   └── index.js              # Badge, Button, Card, Modal, Input…
│   │
│   ├── auth/
│   │   └── LoginPage.js          # Page de connexion
│   │
│   ├── dashboard/
│   │   └── DashboardPage.js      # Tableau de bord + stats
│   │
│   ├── meetings/
│   │   ├── MeetingsPage.js       # Liste + filtres des réunions
│   │   └── MeetingDetail.js      # Détail réunion + résumé IA
│   │
│   ├── tasks/
│   │   └── TasksPage.js          # Kanban (déplacer les tâches entre colonnes)
│   │
│   ├── documents/
│   │   └── DocumentsPage.js      # Gestion documentaire + upload
│   │
│   ├── appointments/
│   │   └── AppointmentsPage.js   # Rendez-vous groupés par date
│   │
│   └── workshops/
│       └── WorkshopsPage.js      # Ateliers internes
```

---

## ✨ Fonctionnalités

| Module | Fonctionnalités |
|---|---|
| **Auth** | Login / Logout, validation, session persistante (localStorage) |
| **Dashboard** | Stats temps réel, réunions à venir, résumé IA, actions rapides |
| **Réunions** | Liste, filtres, recherche, création, détail + résumé IA + décisions |
| **Tâches** | Kanban 3 colonnes, déplacement entre colonnes, création, filtres |
| **Documents** | Table, recherche, filtres par catégorie, partage, upload, stockage |
| **Rendez-vous** | Vue groupée par date, confirmation, création, annulation |
| **Ateliers** | Liste, création, invitations |
| **Notifications** | Toast système (succès/erreur/info/warning) + panneau cloche |
| **Sidebar** | Navigation active, collapsible, profil utilisateur |

---

## 🎨 Design System

| Token | Valeur |
|---|---|
| `--teal` | #00C9A7 — couleur principale |
| `--gold` | #F9A825 — accent/alertes |
| `--blue` | #4A8FE7 — info |
| `--red` | #FF5370 — danger |
| `--purple` | #9C6FFF — IA |
| `--bg-base` | #0B1629 — fond principal |
| `--font-display` | Syne (titres) |
| `--font-body` | DM Sans (texte) |

---

## 🔌 Connexion au backend

Pour connecter au vrai backend, remplacez les données mock dans `src/data/mockData.js` par des appels API dans `src/hooks/` :

```js
// Exemple : src/hooks/useMeetings.js
import { useState, useEffect } from 'react';

export function useMeetings() {
  const [meetings, setMeetings] = useState([]);
  useEffect(() => {
    fetch('/api/meetings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setMeetings);
  }, []);
  return meetings;
}
```

Les routes backend attendues (Laravel / FastAPI) :
```
GET    /api/meetings
POST   /api/meetings
GET    /api/meetings/{id}
PUT    /api/meetings/{id}
DELETE /api/meetings/{id}
GET    /api/tasks
POST   /api/tasks
GET    /api/documents
POST   /api/documents
GET    /api/appointments
POST   /api/appointments
POST   /api/auth/login
POST   /api/auth/logout
```

---

## 📦 Dépendances

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-scripts": "5.0.1",
  "react-router-dom": "^6.22.0"
}
```

Aucune autre dépendance UI — tout le design system est custom.

---

© 2025 XAMIO — Confidentiel
