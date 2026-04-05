# Intégration Frontend : Mabble Payment Flow

Ce document décrit l'architecture des flux de paiement, d'arbitrage et de retrait (withdraw) pour le développement frontend. Il détaille les routes API disponibles, les tables associées, ainsi que **ce qu'il reste à implémenter côté backend** pour que le frontend puisse fonctionner de bout en bout.

---

## 1. Flux de Paiement Initialisée par le Client

### Objectif
Un acheteur (client) valide un service accepté par le prestataire et procède au paiement. Les fonds sont envoyés vers le smart contract `MabbleEscrow`.

### Données en Base
- **Table `request_services`** : La demande doit exister et avoir le `request_status = 'accepted'`.
- La validation du paiement va lier cette requête à une `transaction`. 

### Route API à appeler par le Front
**`POST /payment/pay`**
* **Headers** : `Authorization: Bearer <JWT_TOKEN>`
* **Body** :
  ```json
  {
    "userToken": "tok_circle...",
    "fromWalletAddress": "0xClient...",
    "fromWalletID": "uuid-wallet-circle",
    "to": "0xProvider...",
    "USDCValue": 100,
    "MBBLValue": 50,
    "requestId": 12 
  }
  ```
* **Résultat** : Retourne un `challengeId`. Le frontend doit utiliser le SDK Circle pour faire signer ce challenge au client.
* **Que se passe-t-il ensuite ?** 
  Une fois signé, la blockchain exécute la transaction. Le `event.ts` (microservice) capte l'event `PaymentCreated` et appelle l'API interne `POST /created`. La table `transaction` est alors créée en DB et le statut de la requête passe de `accepted` à `finished` ? *(Il reste à `accepted` tant que c'est working pour le moment)*. La vue "Mes Commandes" passera sur la table transaction.

---

## 2. Ouverture de Conflit (Dispute)

### Objectif
En cas de problème sur la prestation, le client (ou le prestataire) peut geler les fonds en ouvrant un litige (ce qui déploie un contrat `MabbleConflict`).

### Route API à appeler par le Front
**`POST /payment/dispute`**
* **Headers** : `Authorization: Bearer <JWT_TOKEN>`
* **Body** :
  ```json
  {
    "userToken": "tok_circle...",
    "fromWalletId": "uuid-wallet-circle",
    "paymentId": 14, 
    "solver0": "0xArbitre1...",
    "solver1": "0xArbitre2..."
  }
  ```
* **Résultat** : Retourne un `challengeId` à faire signer via Circle SDK.
* **Que se passe-t-il ensuite ?**
  Le backend met immédiatement le `payment_status` de la transaction à `'conflict'`.

---

## 3. Retrait des Fonds (Withdraw)

### Objectif
Une prestation s'est bien passée. Le smart contract émet l'event `ReleaseFund` (grâce à l'action du payeur). L'API marque la transaction en base de données avec `payment_status = 'withdrawable'`. C'est au prestataire de déclencher la récupération sur son compte USDC.

### Points bloquants / Manquants pour le Front ⚠️
Actuellement, **il manque deux choses majeures sur l'API NestJS** pour que le frontend puisse réaliser cette étape :

1. **Il n'y a pas de route `GET /transactions`** 
   Le frontend ne peut pas afficher la liste des transactions "retirables". Il nous faut une route pour lister les transactions où `provider_id = current_userId` (ou `client_id`) incluant les `payment_status` (working, withdrawable, conflict, finished).
   
2. **Il n'y a pas de route `POST /payment/withdraw`**
   L'API contient la route qui *"rend possible le retrait"* (statut `withdrawable` géré automatiquement), mais il n'y a **aucune route que le Front peut appeler pour initier l'appel on-chain `withdraw()`**. Le front a besoin d'envoyer un `POST` au backend, qui lui fowardera vers le microservice (comme le `pay`), le microservice interagira avec Circle, et renverra un `challengeId` à signer pour le Frontend.

---

## 4. Résolution de conflit par les arbitres (Solvers)

### Objectif
Les deux solveurs (choisis lors du dispute) doivent voter en faveur d'un des deux partis depuis le frontend.

### Points bloquants / Manquants pour le Front ⚠️
1. **Comment les arbitres obtiennent leurs conflits ?**
   Les arbitres ont besoin d'une route API `GET /disputes` sur NestJS pour lister les contrats `MabbleConflict` en attente de leur vote. (Pour l'instant la DB enregistre l'adresse du contrat localement dans `transaction.conflict_address`, mais on n'a pas défini qui étaient les arbitres de ce conflit explicitement en Base SQL : impossible de leur faire un dashboard personnalisé des requêtes à juguler "en l'état SQL").
   
2. **Comment l'arbitre vote-t-il ? `POST /payment/vote` manquante**
   Le front va devoir appeler l'API avec un `challengeId` pour faire signer le vote de l'arbitre via son wallet Circle pour interagir avec le smart contract `MabbleConflict.vote()`.

---

## Résumé : Les requêtes pour le développeur Frontend

**CE QUI EST PRÊT :**
✅ Lancer un paiement : `POST /payment/pay`
✅ Déclencher un litige : `POST /payment/dispute`

**CE QUI DOIT ÊTRE DÉVELOPPÉ (API + Microservice) :**
❌ Visualiser l'historique : `GET /transactions`
❌ Visualiser les "jobs à arbitrer" : `GET /arbitrations`
❌ Récupérer ses fonds validés : `POST /payment/withdraw`
❌ Voter pour résoudre un litige : `POST /payment/vote`
