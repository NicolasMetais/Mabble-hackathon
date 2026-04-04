
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
	registerEntitySecretCiphertext,
	initiateDeveloperControlledWalletsClient,
	type TokenBlockchain,
	generateEntitySecret,
} from "@circle-fin/developer-controlled-wallets";


const OUTPUT_DIR = path.join(__dirname, "output");
const WALLET_SET_NAME = "Circle Wallet Onboarding";
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";

async function createDevWallet() {

	const	apiKey = process.env.CIRCLE_API_KEY;
	if (!apiKey)
	{
		throw new Error("[API_KEY] No Circle api_key provided");
	}
	let entitySecret = process.env.CIRCLE_ENTITY_SECRET;
	if (!entitySecret) {
		entitySecret = crypto.randomBytes(32).toString( "hex" );
		
		await registerEntitySecretCiphertext(
		{
			apiKey,
			entitySecret,
			recoveryFileDownloadPath: OUTPUT_DIR,
		}
		);
		const envPath = path.join(__dirname, ".env");
		fs.appendFileSync(
			envPath,
			`\nCIRCLE_ENTITY_SECRET=${entitySecret}\n`,
			"utf-8",
		);
	}

	const	clientDeveloperControlled = initiateDeveloperControlledWalletsClient(
	{
		apiKey,
		entitySecret,
	}
	);
	
	const	PlatformWalletSet = (await clientDeveloperControlled.createWalletSet(
	{
		name: "MabbleWalletSet",
	}
	)).data?.walletSet;
	if ( !PlatformWalletSet?.id )
	{
		throw new Error("la team");
	}

	const	DevWalletList = (await clientDeveloperControlled.createWallets(
	{
		blockchains: ["ARC-TESTNET"],
		count: 1,
		walletSetId: PlatformWalletSet.id,
	}
	)).data?.wallets;	
	if (!DevWalletList)
	{
		throw new Error("[createWallets] DevWalletList not created");
	}

	const	MabbleWallet = DevWalletList[0];
	if ( !MabbleWallet )
	{
		throw new Error("[createWallets] MinterWallet not created");
	}

	console.log(` adress MabbleWallet : ${MabbleWallet.address} \n`);
	console.log(` id MabbleWallet : ${MabbleWallet.id}\n `);
	console.log(` state MabbleWallet : ${MabbleWallet.state} \n`);

	const envPath = path.join(__dirname, ".env");
	fs.appendFileSync(
		envPath,
		`\nMABBLE_WALLET_ADDRESS=${MabbleWallet.address}\nMABBLE_WALLET_ID=${MabbleWallet.id}\n`,
		"utf-8"
	);
	console.log("Les identifiants du wallet ont bien été sauvegardés dans le fichier .env !");
}


createDevWallet().catch((err) =>
	{
		console.error("Erreur :", err.message || err);
		process.exit(1);
	});