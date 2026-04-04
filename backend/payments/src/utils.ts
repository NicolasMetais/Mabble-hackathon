const API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET as string;
const CIRCLE_BASE_URL = process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";

export async function getTransaction(id: string) {
	const response = await fetch(
		`${CIRCLE_BASE_URL}/v1/w3s/transactions/${id}`,
		{
			method: "GET",
			headers:
			{
				Authorization: `Bearer ${API_KEY}`,
			}
		});
	const data = await response.json();
	if ( !response.ok )
		throw new Error(data.message || "Erreur de requête Transaction Circle");
	return (data);
}

export async function getUserWallet(userToken: string) {
	const response = await fetch(
		`${CIRCLE_BASE_URL}/v1/w3s/wallets`,
		{
			method: "GET",
			headers:
			{
				Authorization: ` Bearer ${API_KEY}`,
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
				Authorization: ` Bearer ${API_KEY}`,
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