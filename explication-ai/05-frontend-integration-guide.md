# Guide d'Intégration Frontend : Module Paiement & Conflit

Ce document est la documentation finale à destination des développeurs Frontend expliquant **tous les flux complets** autour du smart contract escrow, des requêtes API liées, et des interactions avec Circle.

Toutes les requêtes API s'adressent au middleware NestJS et requièrent le header d'authentification standard pour faire le lien avec l'utilisateur authentifié.
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Initier un paiement (Le Client)
L'acheteur accepte un service et procède au "Lock" de l'argent sur le contrat d'Escrow.

**Route API :** `POST /payment/pay`
**Body :**
```json
{
  "userToken": "tok_circle...",
  "fromWalletAddress": "0xLa_Client_Address",
  "fromWalletID": "uuid-wallet-circle-client",
  "to": "0xLe_Prestataire_Address",
  "USDCValue": 100,
  "MBBLValue": 50,
  "requestId": 15
}
```
**Réponse attendue (200 OK) :** Retourne un objet contenant le **`challengeId`**.
**Action Frontend :** L'application doit utiliser le Web SDK Circle pour _challenger_ ce client avec cette ID afin qu'il signe la transaction.
**Déroulement backend automatisé :** Dès la signature on-chain, un événement (`PaymentCreated`) notifie le microserveur, qui l'insère dans la Base de données (table `transaction`). Le statut de son paiement interne passe à **`working`**.

---

## 2. Afficher le Dashboard et l'Historique
Pour créer un tableau de bord des opérations en cours ou passées d'un utilisateur (qu'il soit client ou prestataire).

**Route API :** `GET /payment/transactions`
**Body :** Aucun (le payload est extrait du JWT)
**Réponse attendue (200 OK) :**
```json
[
  {
    "id": 1,
    "payment_id": "123456789",
    "request_id": 15,
    "client_id": "uuid",
    "provider_id": "uuid",
    "sender": "0xClient",
    "receiver": "0xPrestataire",
    "payment_status": "working", // "working" | "conflict" | "withdrawable" | "finished"
    "amountMBBL": "50",
    "amountUSDC": "100",
    "conflict_address": null
    // ...
  }
]
```
**Action Frontend :** Mapper ce tableau pour afficher "Mes Achats" ou "Mes Prestations". Gérer le design en fonction du paramètre *payment_status*.

---

## 3. Déclarer un litige / conflit (Client / Prestataire)
Le service se déroule mal, la demande de litige gèlera le processus et lancera un contrat MabbleConflict, bloquant les fonds jusqu'à résolution. 

*(A noter: le backend se chargera lui-même et aléatoirement de tirer au sort deux autres utilisateurs neutres de la base de données comme "Arbitres" et de les enregistrer dans la nouvelle table `disputes` liée)*.

**Route API :** `POST /payment/dispute`
**Body :**
```json
{
  "userToken": "tok_circle...",
  "fromWalletId": "uuid-wallet-circle",
  "paymentId": 123456789
}
```
**Réponse attendue (200 OK) :** Le backend NestJS proxy le microservice Payment qui renvoie un **`challengeId`**.
**Action Frontend :** Afficher le prompt de signature Circle SDK avec ce *Challenge Id* pour déployer on-chain le litige. 
**Déroulement backend automatisé :** Le backend met le `payment_status` à `"conflict"`. Et lorsque le contrat finit de se déployer (`ConflictCreated`), il associe sa nouvelle véritable adresse de conflit (`conflict_address`) à l'opération de transaction automatiquement.

---

## 4. Agir en tant qu'arbitre (Dashboard Résolution)
Un utilisateur de la plateforme peut être sélectionné au hasard comme arbitre pour un litige.

### A. Voir les Tâches d'Arbitrage (Dashboard)
**Route API :** `GET /payment/arbitrations`
**Body :** Aucun
**Réponse attendue (200 OK) :** Renvoie la liste de toutes les opérations de transactions *en conflit* (avec statut `= conflict`) et où son UUID correspond à un tirage au sort (`solver0_id` ou `solver1_id`). Les données contiennent la **`conflict_address`** vitale pour l'étape C.

### B. Voter avec son portefeuille (Arbiter Action)
**Route API :** `POST /payment/vote`
**Body :**
```json
{
  "userToken": "tok_circle...",
  "fromWalletId": "uuid-wallet-circle-arbitre",
  "conflictAddress": "0xAdresseDuContratLitige",
  "voteForClient": true // true = le client a raison, false = le prestataire a raison
}
```
**Réponse attendue (200 OK) :** Retourne un **`challengeId`** en communiquant avec le microservice.
**Action Frontend :** Fait apparaitre le UI de signature de Circle. Le vote est inscrit on-chain dans le contrat `MabbleConflict`. 

---

## 5. Retirer les fonds (Le Prestataire)
Si la prestation est effectuée correctement, ou qu'un litige a tourné en sa faveur, les fonds doivent être récupérés depuis l'Escrow vers le wallet Circle personnel :

**1. API Release Fund Client :** Bien que non-exposé directement par une route frontend sur l'API NestJS (`@Public`), un appel Frontend de `releaseFund` on-chain (soit via Circle Web SDK natif sur le contrat, soit par appel microservice Circle pour Release) passe le statut de la transaction automatiquement à `"withdrawable"` coté NestJS grace à l'event. 

Le plus simple est d'interagir depuis le front avec le microservice :  
`POST URL_MICOSERVICE_PAYMENTS:4001/releaseFund`
Body: `{"_userWalletID", "_userToken", "_paymentId"}`

**2. Route API Retrait :** `POST /payment/withdraw`  (Le Prestataire déclenche le vrai retrait)
**Body :**
```json
{
  "_userWalletID": "uuid-wallet-prestataire",
  "_userToken": "tok_circle...",
  "_paymentId": 123456789
}
```
**Réponse attendue (200 OK) :** Obtient le **`challengeId`**.
**Action Frontend :** Signer la réclamation avec le SDK Circle. L'argent passera du pool Escrow au Wallet USDC du prestataire. 
