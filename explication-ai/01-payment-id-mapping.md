# Choix architectural : mapping paymentID on-chain ↔ request_id

## Problème

Le smart contract `MabbleEscrow` émet un événement `PaymentCreated(uint256 paymentID, address to, address from, ...)` quand un paiement est initié.

Ce `paymentID` est auto-incrémenté **on-chain**. Il est différent et indépendant de :
- l'`idempotencyKey` UUID envoyé à l'API Circle
- l'`id` de la table `request_services` en base Postgres

Du coup, quand `event.ts` reçoit le `PaymentCreated`, on a le `paymentID` on-chain et les adresses wallets — mais pas de `request_id`.

## Solution retenue (Option D)

Au moment de l'appel `POST /payment/pay`, le front envoie le `requestId`.

L'API NestJS :
1. Forward le `/pay` vers le microservice `payments`
2. Stocke `(request_id, from_wallet, to_wallet)` dans une table `payment_pending`

Quand `event.ts` reçoit le `PaymentCreated(paymentID, to, from, ...)` :
1. L'API reçoit `POST /payment/created` avec ces données
2. Elle cherche dans `payment_pending` la ligne avec `(from_wallet=from, to_wallet=to)`
3. Elle récupère le `request_id` et insère dans `transaction`
4. Elle nettoie `payment_pending` et met à jour `request_services`

## Limitation connue

Si deux paiements simultanés partent du même wallet vers le même destinataire,
le matching pourrait être ambigu. Acceptable pour un MVP hackathon.

## Pourquoi pas les autres options ?

- **Option A** (mapping via idempotencyKey) : l'event on-chain n'expose pas l'idempotencyKey Circle. Impossible.
- **Option B** (chercher le dernier pending) : trop fragile en concurrence.
- **Option C** (poll de l'event après /pay) : asynchrone, complexe, pas fiable.
