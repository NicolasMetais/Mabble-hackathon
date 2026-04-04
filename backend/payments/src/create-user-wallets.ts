const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_BASE_URL = process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";

// Envoie un email contenant un code lors de l'Auth

export async function circle_OTP_request(email: string, deviceId: string) {
	const response = await fetch(
		`https://api.circle.com/v1/w3s/users/email/token`,
		{
			method: "POST",
			headers:
			{
				"Content-Type": "application/json",
				Authorization: `Bearer ${CIRCLE_API_KEY}`
			},
			body: JSON.stringify({
				idempotencyKey: crypto.randomUUID(),
				deviceId,
				email,
			}),
		});
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Erreur de requête OTP Circle");
	}
	// { deviceToken, deviceEncryptionKey, otpToken }
	return (data);
}

/* Initialisation => Challenge envoyer au USER pour auth 
( ouverture du porte feuille blockchain lors de la premiere connexiom ) */

export async function getUserChallengeForWalletCreation(userToken: string) {
	const response = await fetch(
		`https://api.circle.com/v1/w3s/user/initialize`,
		{
			method: "POST",
			headers:
			{
				"Content-Type": "application/json",
				Authorization: `Bearer ${CIRCLE_API_KEY}`,
				"X-User-Token": userToken,
			},
			body: JSON.stringify({
				idempotencyKey: crypto.randomUUID(),
				accountType: "SCA",
				blockchains: ["ARC-TESTNET"]
			})
		});
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Erreur de requête Challenge Circle");
	}
	// { challengeId }
	return data;
}

// get

export async function getUserWallet(userToken: string) {
	const response = await fetch(
		`${CIRCLE_BASE_URL}/v1/w3s/wallets`,
		{
			method: "GET",
			headers:
			{
				Authorization: ` Bearer ${CIRCLE_API_KEY}`,
				"X-User-Token": userToken
			}
		}
	);
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Erreur de requête Wallet Circle");
	}
	return (data);
}

export async function getUserBalance(userToken: string, walletId: string) {
	const response = await fetch(
		`${CIRCLE_BASE_URL}/v1/w3s/wallets/${walletId}/balances`,
		{
			method: "GET",
			headers:
			{
				Authorization: ` Bearer ${CIRCLE_API_KEY}`,
				"X-User-Token": userToken
			}
		}
	);
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Erreur de requete Balance Circle");
	}
	return (data);
}