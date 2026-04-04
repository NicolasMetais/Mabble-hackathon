# Pourquoi remplir la table `transaction` après l'event on-chain ?

## Contexte

Quand le front envoie `POST /payment/pay`, on pourrait être tenté
d'insérer directement dans `transaction`. Mais ce serait une erreur.

## Pourquoi attendre l'event on-chain ?

La transaction blockchain n'est **pas immédiate ni garantie**.
Plusieurs choses peuvent mal se passer :

- L'utilisateur ne signe pas le challenge Circle (abandon)
- La transaction est rejetée par le réseau (gas insuffisant, etc.)
- Circle retourne une erreur après la signature

Si on insère dans `transaction` au moment du `/pay`, on aurait
des lignes fantômes correspondant à des paiements qui n'ont jamais
eu lieu on-chain.

## La source de vérité, c'est la blockchain

L'event `PaymentCreated` émis par le smart contract `MabbleEscrow`
est **infalsifiable** : il ne se déclenche que si les fonds ont réellement
été transférés dans l'escrow. C'est donc lui qui fait foi.

`event.ts` écoute ce contrat en temps réel via un WebSocket sur le noeud ARC.
Quand l'event arrive, c'est la preuve que le paiement est confirmé → 
on peut alors insérer proprement dans `transaction`.

## Schéma de fiabilité

```
/pay       → intention de payer  → payment_pending (temporaire)
PaymentCreated → preuve on-chain → transaction (permanent)
```

La table `payment_pending` est donc un "pont" provisoire entre
l'intention et la confirmation.
