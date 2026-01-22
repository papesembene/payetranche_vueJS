# JSON Server Setup - PayTranche SaaS

## Vue d'ensemble

Ce document explique comment utiliser JSON Server pour simuler un backend API complet pour PayTranche. Cela vous permet de voir la structure des données, les relations, et de tester les endpoints avant d'implémenter un vrai backend.

## Installation

```bash
npm install
```

JSON Server est déjà ajouté comme dépendance de développement.

## Schéma de Base de Données

### Tables (Entités) et Attributs

#### 1. `users` - Utilisateurs

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(10),
  password VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  -- Champs embarqués (embedded)
  subscription_plan VARCHAR(50),
  subscription_status ENUM('active', 'trial', 'expired', 'cancelled', 'past_due'),
  subscription_currentPeriodStart DATE,
  subscription_currentPeriodEnd DATE,
  subscription_cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,
  subscription_trialEnd DATETIME,
  subscription_stripeSubscriptionId VARCHAR(255),
  usage_clients INT DEFAULT 0,
  usage_payments INT DEFAULT 0,
  usage_totalAmount DECIMAL(10,2) DEFAULT 0
);
```

#### 2. `subscriptionPlans` - Plans d'abonnement

```sql
CREATE TABLE subscriptionPlans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  billing VARCHAR(20) DEFAULT 'mensuel',
  -- Limites (embedded JSON)
  limits_maxClients INT,
  limits_maxPayments INT,
  limits_maxPaymentAmount DECIMAL(10,2),
  -- Fonctionnalités (JSON array)
  features JSON,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);
```

#### 3. `subscriptions` - Abonnements actifs

```sql
CREATE TABLE subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status ENUM('active', 'cancelled', 'past_due') NOT NULL,
  currentPeriodStart DATE NOT NULL,
  currentPeriodEnd DATE NOT NULL,
  cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,
  trialEnd DATETIME,
  stripeSubscriptionId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (plan) REFERENCES subscriptionPlans(id)
);
```

#### 4. `payments` - Historique des paiements

```sql
CREATE TABLE payments (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  subscriptionId VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  status ENUM('pending', 'succeeded', 'failed', 'cancelled') NOT NULL,
  stripePaymentIntentId VARCHAR(255),
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
);
```

#### 5. `clients` - Clients des utilisateurs

```sql
CREATE TABLE clients (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  totalDebt DECIMAL(10,2) DEFAULT 0,
  lastPayment DATETIME,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id)
);
```

#### 6. `transactions` - Transactions de paiement

```sql
CREATE TABLE transactions (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  clientId VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  type ENUM('payment', 'credit', 'debit') NOT NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL,
  description TEXT,
  dueDate DATE,
  paymentDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (clientId) REFERENCES clients(id)
);
```

#### 7. `auth_tokens` - Tokens d'authentification

```sql
CREATE TABLE auth_tokens (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY (token)
);
```

## Relations Entre Tables

### Diagramme des Relations

```
users (1) ──── (N) subscriptions
users (1) ──── (N) payments
users (1) ──── (N) clients
users (1) ──── (N) transactions
users (1) ──── (N) auth_tokens

subscriptions (N) ──── (1) subscriptionPlans
subscriptions (1) ──── (N) payments

clients (1) ──── (N) transactions
```

### Types de Relations

1. **One-to-One** :

   - `users.subscription` → Données embarquées (pas de table séparée)

2. **One-to-Many** :

   - `users → subscriptions` (1:N)
   - `users → clients` (1:N)
   - `users → payments` (1:N)
   - `users → transactions` (1:N)
   - `users → auth_tokens` (1:N)
   - `subscriptions → payments` (1:N)
   - `clients → transactions` (1:N)

3. **Many-to-One** :
   - `subscriptions → users` (N:1)
   - `subscriptions → subscriptionPlans` (N:1)
   - `payments → users` (N:1)
   - `payments → subscriptions` (N:1)
   - `clients → users` (N:1)
   - `transactions → users` (N:1)
   - `transactions → clients` (N:1)
   - `auth_tokens → users` (N:1)

## Structure des Données

Le fichier `db.json` contient toutes les entités et relations de l'application :

### Entités Principales

#### `users` - Utilisateurs

```json
{
  "id": "user123",
  "email": "commercant@example.com",
  "name": "Amadou Diallo",
  "avatar": "A",
  "password": "password123",
  "createdAt": "2024-01-15T00:00:00.000Z",
  "subscription": {
    "id": "sub_123",
    "plan": "essential",
    "status": "active",
    "currentPeriodStart": "2024-12-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-01-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "trialEnd": null,
    "stripeSubscriptionId": "sub_mock_123"
  },
  "usage": {
    "clients": 12,
    "payments": 45,
    "totalAmount": 250000
  }
}
```

#### `subscriptionPlans` - Plans d'abonnement

```json
{
  "id": "essential",
  "name": "Essentiel",
  "price": 5000,
  "currency": "FCFA",
  "billing": "mensuel",
  "limits": {
    "maxClients": 50,
    "maxPayments": 500,
    "maxPaymentAmount": 500000
  },
  "features": ["basic_dashboard", "client_management", ...],
  "description": "Pour les petits commerçants",
  "active": true
}
```

#### `subscriptions` - Abonnements actifs

```json
{
  "id": "sub_123",
  "userId": "user123",
  "plan": "essential",
  "status": "active",
  "currentPeriodStart": "2024-12-01T00:00:00.000Z",
  "currentPeriodEnd": "2025-01-01T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "trialEnd": null,
  "stripeSubscriptionId": "sub_mock_123",
  "createdAt": "2024-12-01T00:00:00.000Z",
  "updatedAt": "2024-12-01T00:00:00.000Z"
}
```

#### `payments` - Historique des paiements

```json
{
  "id": "pay_123",
  "userId": "user123",
  "subscriptionId": "sub_123",
  "amount": 5000,
  "currency": "FCFA",
  "status": "succeeded",
  "stripePaymentIntentId": "pi_mock_123",
  "description": "Abonnement Essentiel - Décembre 2024",
  "createdAt": "2024-12-01T00:00:00.000Z"
}
```

#### `clients` - Clients des utilisateurs

```json
{
  "id": "client_1",
  "userId": "user123",
  "name": "Moussa Kane",
  "email": "moussa@example.com",
  "phone": "+221 77 123 45 67",
  "totalDebt": 15000,
  "lastPayment": "2024-12-10T00:00:00.000Z",
  "status": "active",
  "createdAt": "2024-10-01T00:00:00.000Z"
}
```

#### `transactions` - Transactions de paiement

```json
{
  "id": "txn_1",
  "userId": "user123",
  "clientId": "client_1",
  "amount": 5000,
  "currency": "FCFA",
  "type": "payment",
  "status": "completed",
  "description": "Paiement partiel",
  "dueDate": "2024-12-15T00:00:00.000Z",
  "paymentDate": "2024-12-10T00:00:00.000Z",
  "createdAt": "2024-12-10T00:00:00.000Z"
}
```

## Relations

```
users
├── 1:1 → subscription (embedded)
├── 1:1 → usage (embedded)
├── 1:N → clients
├── 1:N → transactions
├── 1:N → payments
└── 1:N → auth_tokens

subscriptionPlans
└── 1:N → subscriptions

subscriptions
├── N:1 → users
├── N:1 → subscriptionPlans
└── 1:N → payments

clients
└── N:1 → users

transactions
├── N:1 → users
└── N:1 → clients
```

## Démarrage du Serveur

### Terminal 1 : JSON Server

```bash
npm run json-server
```

Le serveur démarre sur `http://localhost:3000`

### Terminal 2 : Application Frontend

```bash
npm run dev
```

L'application démarre sur `http://localhost:5173`

### Configuration Frontend

Créez un fichier `.env` à la racine :

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCK=false
```

## Endpoints Disponibles

### Authentification

```
GET    /auth_tokens
POST   /auth_tokens
GET    /auth_tokens/:id
PUT    /auth_tokens/:id
DELETE /auth_tokens/:id
```

### Utilisateurs

```
GET    /users
POST   /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
```

### Plans d'abonnement

```
GET    /subscriptionPlans
POST   /subscriptionPlans
GET    /subscriptionPlans/:id
PUT    /subscriptionPlans/:id
DELETE /subscriptionPlans/:id
```

### Abonnements

```
GET    /subscriptions
POST   /subscriptions
GET    /subscriptions/:id
PUT    /subscriptions/:id
DELETE /subscriptions/:id
```

### Paiements

```
GET    /payments
POST   /payments
GET    /payments/:id
PUT    /payments/:id
DELETE /payments/:id
```

### Clients

```
GET    /clients
POST   /clients
GET    /clients/:id
PUT    /clients/:id
DELETE /clients/:id
```

### Transactions

```
GET    /transactions
POST   /transactions
GET    /transactions/:id
PUT    /transactions/:id
DELETE /transactions/:id
```

## Requêtes Personnalisées

JSON Server supporte les filtres et recherches :

### Filtrer par utilisateur

```
GET /clients?userId=user123
GET /transactions?userId=user123
GET /payments?userId=user123
```

### Filtrer par statut

```
GET /subscriptions?status=active
GET /payments?status=succeeded
```

### Recherche

```
GET /users?q=amadou
GET /clients?q=moussa
```

## Routes Personnalisées (routes.json)

Pour des endpoints plus complexes, créez un fichier `routes.json` :

```json
{
  "/api/auth/login": "/auth_tokens",
  "/api/user/profile": "/users/1",
  "/api/subscription/plans": "/subscriptionPlans",
  "/api/subscription/create": "/subscriptions",
  "/api/payment/create-intent": "/payments"
}
```

Puis lancez avec :

```bash
json-server db.json --routes routes.json
```

## Middleware et Validation

JSON Server ne fait pas de validation, mais vous pouvez :

1. **Créer des scripts de validation** en JavaScript
2. **Utiliser des middlewares** personnalisés
3. **Ajouter des contraintes** dans le code frontend

## Données de Test

### Comptes de test

- **email**: `commercant@example.com` / **password**: `password123` (Plan Essentiel)
- **email**: `vendeur@example.com` / **password**: `password123` (Plan Gratuit)

### Scénarios à tester

1. **Connexion** avec différents plans
2. **Mise à niveau** d'abonnement
3. **Ajout de clients** et vérification des limites
4. **Création de transactions**
5. **Annulation d'abonnement**

## Migration vers Backend Réel

Une fois que vous avez validé la structure :

1. **Gardez `db.json`** comme référence
2. **Implémentez les endpoints** dans votre backend
3. **Respectez les formats** de données
4. **Basculez** `VITE_USE_MOCK=false` vers `VITE_API_BASE_URL=votre-api`

## Outils Utiles

### Interface Graphique

- **JSON Server GUI** : `npx json-server-gui db.json`
- **Postman** : Pour tester les endpoints
- **Insomnia** : Alternative à Postman

### Monitoring

- **Console réseau** du navigateur
- **Logs JSON Server** dans le terminal

---

**Note** : JSON Server est parfait pour le prototypage et les tests, mais ne l'utilisez pas en production. Il ne gère pas l'authentification réelle, la validation, ou la persistance durable.
