# Migration vers Firebase 🔥

## ✅ Ce qui a été fait

### 1. Configuration Firebase

- ✅ Création du fichier `src/firebase.js` avec la configuration Firebase
- ✅ Ajout des variables d'environnement dans `.env`
- ✅ Initialisation de Firebase dans `src/main.js`

### 2. Service d'authentification

- ✅ Migration vers Firebase Auth avec authentification téléphonique
- ✅ Support du reCAPTCHA pour la vérification SMS
- ✅ Gestion automatique des profils utilisateur

### 3. Service Firestore

- ✅ Création du service générique `src/services/firestore.service.js`
- ✅ Support des opérations CRUD, requêtes, et listeners temps réel
- ✅ Gestion automatique des timestamps

### 4. Migration des services

- ✅ `user.service.js` - Utilise Firestore pour les profils utilisateur
- ✅ `client.service.js` - CRUD clients avec Firestore
- ✅ `transaction.service.js` - Gestion des transactions avec Firestore
- ✅ `subscription.service.js` - Gestion des abonnements et plans

### 5. Script de migration

- ✅ Création de `migrate-to-firebase.js` pour migrer les données de `db.json`

## 🚧 Étapes restantes à effectuer

### 1. Configuration Firebase Console

```bash
# 1. Créer un projet Firebase : https://console.firebase.google.com/
# 2. Activer Authentication avec Phone provider
# 3. Activer Firestore Database
# 4. Copier les clés API dans .env
```

### 2. Variables d'environnement

Remplacer dans `.env` :

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

### 3. Règles Firestore

Dans Firebase Console > Firestore > Rules :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs peuvent lire/écrire leurs propres données
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Clients appartiennent à un utilisateur
    match /clients/{clientId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Même chose pour transactions, subscriptions, payments
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /payments/{paymentId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Plans d'abonnement accessibles à tous les utilisateurs authentifiés
    match /subscriptionPlans/{planId} {
      allow read: if request.auth != null;
    }
  }
}
```

### 4. Migration des données

```bash
# Migrer les données existantes
node migrate-to-firebase.js
```

### 5. Finalisation

- ✅ Supprimer `json-server` des dépendances
- ✅ Supprimer `db.json`
- ✅ Tester l'application
- ✅ Configurer le déploiement

## 🔧 Services encore à migrer

### payment.service.js

Le service de paiement utilise encore des appels HTTP mock. À adapter selon vos besoins :

- Soit garder les appels PayDunya existants
- Soit intégrer Stripe/PayPal via Firebase Functions

### PWA et offline

Firebase offre un excellent support offline. À configurer :

- Persistence des données Firestore
- Service Worker pour cache
- Stratégies de synchronisation

## 🧪 Test de l'application

1. **Authentification** : Tester la connexion avec numéro de téléphone
2. **CRUD Clients** : Créer, lire, mettre à jour, supprimer des clients
3. **Transactions** : Gérer les paiements et transactions
4. **Abonnements** : Changer de plan, annuler, réactiver
5. **Offline** : Tester le fonctionnement hors ligne

## 🚀 Déploiement

L'application peut toujours être déployée sur Vercel. Firebase gère uniquement le backend.

## 📞 Support

En cas de problème :

1. Vérifier la console Firebase pour les erreurs
2. Vérifier les règles Firestore
3. Vérifier les variables d'environnement
4. Tester avec la console Firebase (Auth et Firestore)
