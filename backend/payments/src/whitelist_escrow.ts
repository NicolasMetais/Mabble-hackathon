import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import "dotenv/config";

const API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET as string;
const MABBLE_WALLET_ID = process.env.MABBLE_WALLET_ID as string;
const MABBLE_TOKEN_ADDRESS = process.env.MABBLE_TOKEN_ADDRESS as string;
const MABBLE_ESCROW_ADDRESS = process.env.MABBLE_ESCROW_ADDRESS as string;

async function whitelistEscrow() {
	if (!API_KEY || !CIRCLE_ENTITY_SECRET || !MABBLE_WALLET_ID || !MABBLE_TOKEN_ADDRESS || !MABBLE_ESCROW_ADDRESS) {
		throw new Error("Missing environment variables. Please check your .env file.");
	}

	console.log(`Initialisation de l'API Circle...`);
	const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
		apiKey: API_KEY,
		entitySecret: CIRCLE_ENTITY_SECRET,
	});

	console.log(`Ajout du contrat Escrow (${MABBLE_ESCROW_ADDRESS}) à la WhiteList du Token (${MABBLE_TOKEN_ADDRESS})...`);

	const response = await circleDeveloperSdk.createContractExecutionTransaction({
		walletId: MABBLE_WALLET_ID,
		contractAddress: MABBLE_TOKEN_ADDRESS,
		abiFunctionSignature: "setWhiteList(address,bool)",
		abiParameters: [MABBLE_ESCROW_ADDRESS, "true"],
		fee: {
			type: "level",
			config: {
				feeLevel: "MEDIUM"
			}
		}
	});

	if (!response.data) {
		throw new Error(response.statusText);
	}

	console.log("Transaction de mise à jour de la WhiteList envoyée avec succès.");
	console.log("ID de la transaction :", response.data.id);
	
	// Si tu veux suivre le statut de la transaction, tu pourrais utiliser :
	// await circleDeveloperSdk.getTransaction({ id: response.data.id })
}

whitelistEscrow().catch((error) => {
	console.error("Erreur :", error.message || error);
	process.exit(1);
});
