# Stratégie de tests du Payment Module

## Vue d'Esemble

Les tests sont écrits avec **Jest** et se trouvent dans le module API (NestJS). Ils se divisent en deux fichiers :
1. `payment.service.spec.ts` : **Tests unitaires** (méthode par méthode)
2. `payment.e2e.spec.ts` : **Tests End-to-End (E2E)** (scénario complet)

> [!NOTE]
> La DB (`Pool`) et les appels réseau externes (`fetch` Circle API / testnet) sont intégralement "mockés" (simulés). Ça garantit que les tests s'exécutent en moins d'une seconde sans dépendre du réseau.

---

## 1. Tests Unitaires (`payment.service.spec.ts`)

L'objectif d'un test unitaire est de prendre une méthode de façon isolée et de vérifier qu'elle se comporte bien face à différents cas de figure (réussite et erreur). 

Il y a 9 tests unitaires couverts :

| Scénario | Ce que le test vérifie |
| --- | --- |
| **`pay()` — happy path** | Valide que si tout est ok, le `fetch` part vers le microservice avec les bons montants, un "challengeId" est renvoyé, et `payment_pending` est inséré. |
| **`pay()` — NotFoundException** | Refuse si l'ID de la request est introuvable ou n'appartient pas au user |
| **`pay()` — BadRequestException** | Refuse de payer si le statut de la demande n'est pas "accepted" |
| **`pay()` — wallet manquant** | Refuse car l'utilisateur a besoin d'un wallet pour initier le paiement |
| **`pay()` — erreur microservice** | Propage l'erreur si le microservice Express renvoie une erreur (400) |
| **`onPaymentCreated()` — happy path** | Vérifie le matching de pending: supprime la ligne `payment_pending` et link le `request_id` dans la `transaction` |
| **`onPaymentCreated()` — sans mapping** | Vérifie que l'event s'enregistre (fallback) même si le `payment_pending` a expiré/n'existe pas |
| **`dispute()` — happy path** | Vérifie que le statut de la transaction passe en `conflict` en BD |
| **`onConflictResolved()` — happy path** | Vérifie que le statut transaction ET request passent en `finished` |

---

## 2. Test E2E Intégration (`payment.e2e.spec.ts`)

À la différence des tests unitaires, le **test E2E** simule ce qui se passe chronologiquement dans la vraie vie et vérifie la coordination entre les différentes routes de l'application. D'où le **End-to-End**.

Ce test rejoue en 4 étapes les endpoints API dans l'ordre chronologique attendu :

1. `POST /pay` (action de l'acheteur)
2. `POST /created` (event listener blockchain)
3. `POST /dispute` (action d'arbitrage)
4. `POST /conflictResolved` (résolution sur la blockchain)

Ce fichier est crucial car il vérifie non seulement le service, mais aussi l'injection de dépendances complète dans l'application NestJS, les Guards JWT, ainsi que le parsage correct du JSON entrant en DTOs.
