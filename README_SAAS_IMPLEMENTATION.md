# Implémentation SaaS - PayTranche

## Vue d'ensemble

Cette implémentation ajoute un système d'abonnement complet à PayTranche, transformant l'application en une plateforme SaaS avec différents niveaux de service adaptés au secteur informel.

## Fonctionnalités Implémentées

### 1. Modèle d'Abonnement

- **4 plans** : Essai gratuit (14 jours), Essentiel (5 000 FCFA/mois), Pro (15 000 FCFA/mois), Entreprise (50 000 FCFA/mois)
- **Limites par plan** : Nombre de clients, paiements, montant maximum
- **Fonctionnalités gating** : Certaines features réservées aux plans payants
- **Règles strictes** : Pas d'annulation d'abonnements actifs, pas de changement de plan en cours de période, pas de renouvellement anticipé

### 2. Intégration PayDunya

- **Paiement Mobile Money** : Support Orange Money, Wave, Free Money
- **Renouvellement automatique** : Configuration de paiements récurrents
- **Sécurité** : Gateway de paiement certifié pour l'Afrique de l'Ouest
- **API complète** : Création de factures, vérification de paiements, webhooks

### 2. Gestion d'État Utilisateur

- **Composable Vue** pour la gestion centralisée de l'état utilisateur (solution temporaire sans Pinia)
- **Données mockées** pour simulation (à remplacer par API réelle)
- **État d'authentification** et informations d'abonnement

### 3. Interface Utilisateur

#### Composants Créés

- `SubscriptionStatus.vue` : Affiche le plan actuel, utilisation et limites
- `UpgradePrompt.vue` : Invite intelligente à la mise à niveau
- `SettingsPage.vue` : Page complète de gestion d'abonnement

#### Pages Créées

- `RegisterPage.vue` : Inscription avec essai gratuit de 14 jours
- `PaymentSuccessPage.vue` : Confirmation de paiement et renouvellement

#### Pages Modifiées

- `LoginPage.vue` : Lien vers l'inscription
- `DashboardPage.vue` : Intégration des composants d'abonnement
- `DashboardHeader.vue` : Affichage du plan utilisateur et lien vers paramètres

### 4. Architecture Technique

#### Fichiers Créés

```
src/
├── composables/
│   └── useUser.js                 # Composable pour l'état utilisateur
├── services/
│   ├── http.js                    # Configuration HTTP client (Axios)
│   ├── auth.service.js            # Service d'authentification
│   ├── user.service.js            # Service de gestion utilisateur
│   ├── subscription.service.js    # Service d'abonnements
│   └── payment.service.js         # Service de paiements
├── components/
│   ├── SubscriptionStatus.vue     # Statut d'abonnement avec métriques
│   └── UpgradePrompt.vue          # Invite de mise à niveau
└── views/
    └── SettingsPage.vue           # Page de gestion d'abonnement
```

#### Fichiers Modifiés

```
src/
├── router/index.js                # Route /settings
├── views/DashboardPage.vue        # Intégration des composants
└── components/dashboard/
    └── DashboardHeader.vue        # Info utilisateur et plan
```

## Installation et Configuration

### 1. Backend avec JSON Server (Développement)

Pour les tests et développement, utilisez JSON Server comme backend mock :

```bash
# Installer les dépendances
npm install

# Terminal 1 : Lancer JSON Server (port 3000)
npm run json-server

# Terminal 2 : Lancer l'application frontend
npm run dev
```

**Base de données :** `db.json` contient :

- ✅ Utilisateurs avec abonnements expirés (pour tests)
- ✅ Plans d'abonnement (Gratuit, Essentiel, Pro, Entreprise)
- ✅ Historique paiements et transactions
- ✅ Clients et données métier

**Test immédiat :**

1. Connectez-vous avec `commercant@example.com`
2. Abonnement expiré visible
3. Bouton "Renouveler l'abonnement" disponible

### 2. État Global (Composable Vue)

L'implémentation utilise un composable Vue pour l'état global.

**Fichiers clés :**

- `src/composables/useUser.js` - Gestion de l'état utilisateur
- `src/data/subscriptionPlans.js` - Configuration des abonnements

### 3. Migration vers Production

Pour la production, remplacez JSON Server par une vraie API :

```bash
# API Node.js/Express recommandée
npm install express mongoose bcryptjs jsonwebtoken

# Puis migrez vers Pinia pour l'état
npm install pinia
```

### 3. Variables d'Environnement

Pour la production, configurez :

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=https://api.paytranche.com
```

## Utilisation

### Navigation

- **Page d'accueil** : Présentation avec boutons "S'inscrire" et "Se connecter"
- **Inscription** : Création de compte avec essai gratuit de 14 jours
- **Connexion** : Accès au tableau de bord
- **Tableau de bord** : Affiche le statut d'abonnement et les invites de mise à niveau
- **Paramètres** : Gestion complète du profil et de l'abonnement
- **Header** : Accès rapide aux paramètres et info du plan actuel

### Gestion des Abonnements

1. **Visualisation** : Statut actuel, utilisation et limites dans le dashboard
2. **Règles strictes** :
   - **Plan Gratuit** : Essai de 14 jours maximum (pas illimité)
   - **Pas d'annulation** d'abonnements actifs (évite le churn)
   - **Pas de changement de plan** pendant la période active
   - **Pas de renouvellement anticipé** (manuel ou automatique)
   - **Actions disponibles** : Uniquement quand expiré ou ≤7 jours avant expiration
   - **Réactivation possible** si abonnement annulé
3. **Renouvellement** : Via PayDunya avec Mobile Money (uniquement quand expiré)
4. **Paiement récurrent** : Configuration automatique (uniquement quand expiré)

### Gating des Fonctionnalités

Utilisez le composable pour vérifier les permissions :

```javascript
import { useUser } from "../composables/useUser.js";

const { hasFeature, canAddClient } = useUser();

// Vérifier une fonctionnalité
if (hasFeature("advanced_analytics")) {
  // Afficher la fonctionnalité
}

// Vérifier les limites
if (canAddClient) {
  // Permettre l'ajout
}
```

## Données Mockées

L'implémentation utilise des données mockées pour la démonstration :

- **Utilisateur** : Commerçant avec plan Essentiel
- **Utilisation** : 12 clients, 45 paiements, 250 000 FCFA
- **Abonnement** : Actif, renouvellement le 01/01/2025

## Intégration Backend

### Architecture API

L'application est conçue pour une intégration facile avec un backend. Le service API (`src/services/api.js`) gère automatiquement le basculement entre données mockées et appels réels.

### Endpoints Requis

**Authentification :**

```
POST /api/auth/register   - Inscription
POST /api/auth/login      - Connexion
POST /api/auth/verify     - Vérification token
```

**Utilisateurs :**

```
GET  /api/user/profile           - Profil utilisateur
PUT  /api/user/profile           - Mise à jour profil
```

**Abonnements :**

```
GET  /api/subscription/plans     - Plans disponibles
POST /api/subscription/create    - Créer abonnement
POST /api/subscription/cancel    - Annuler abonnement
POST /api/subscription/reactivate - Réactiver abonnement
GET  /api/subscription/billing   - Historique facturation
```

**Paiements :**

```
POST /api/payment/create-intent  - Intention de paiement (Stripe)
POST /api/payment/confirm        - Confirmation paiement
```

### Flux d'Abonnement

1. **Inscription** : Utilisateur s'inscrit → Plan gratuit par défaut
2. **Connexion** : Vérification du token et chargement du profil
3. **Utilisation** : Vérification des limites à chaque action
4. **Mise à niveau** : Création d'abonnement → Paiement → Activation
5. **Renouvellement** : Webhooks Stripe gèrent les renouvellements

### Sécurité

- **JWT** stocké dans localStorage
- **Headers d'autorisation** automatiques
- **Validation côté serveur** des limites d'abonnement
- **Webhooks** pour événements de paiement

## Prochaines Étapes

### Backend

1. **API d'authentification** : Remplacer les mocks par appels réels
2. **Gestion des abonnements** : Intégration Stripe/PayPal
3. **Base de données** : Stockage des utilisateurs et abonnements
4. **Webhooks** : Gestion des renouvellements et échecs de paiement

### Frontend

1. **Authentification réelle** : Login/logout avec JWT
2. **Modales de mise à niveau** : Interface pour sélection de plan
3. **Notifications** : Système de notifications pour renouvellements
4. **Analytics** : Suivi de l'utilisation et conversion

### Fonctionnalités Avancées

1. **Essai gratuit** : Période d'essai automatique
2. **Codes promo** : Réductions et offres spéciales
3. **Facturation multi-devises** : Support CFA, EUR, USD
4. **API publique** : Intégrations tierces

## Sécurité

- **Validation côté client** : Vérifications avant appels API
- **Gestion des erreurs** : Messages d'erreur appropriés
- **Protection des routes** : Guards pour accès authentifié
- **Sanitisation** : Nettoyage des données utilisateur

## Tests

### Tests Unitaires

```bash
npm run test:unit
```

### Tests d'Intégration

- Vérifier le gating des fonctionnalités
- Tester les changements de plan
- Valider les calculs d'utilisation

## Déploiement

### Variables Requises

```env
VITE_API_URL=https://api.paytranche.com
VITE_STRIPE_KEY=pk_live_...
VITE_SENTRY_DSN=https://...
```

### Build

```bash
npm run build
```

### Migration

Pour les utilisateurs existants :

1. Migration vers le plan Essentiel par défaut
2. Période de grâce de 30 jours
3. Communication claire des changements

## Support et Maintenance

### Monitoring

- Suivi des conversions d'abonnement
- Taux de rétention par plan
- Utilisation des fonctionnalités

### Mises à Jour

- Communication des nouvelles fonctionnalités
- Périodes de test pour changements majeurs
- Rollback planifié si nécessaire

---

**Note** : Cette implémentation fournit une base solide pour le SaaS. Les données mockées doivent être remplacées par des intégrations réelles pour la production.
