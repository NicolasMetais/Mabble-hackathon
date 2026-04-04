import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import "dotenv/config";

import * as fs from "node:fs";
import * as path from "node:path";

const API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET as string;
const MABBLE_WALLET_ID = process.env.MABBLE_WALLET_ID as string;
const MABBLE_TOKEN_ADDRESS = process.env.MABBLE_TOKEN_ADDRESS as string

async function poolStatusDeployement( contractId : string )
{
	const circleContractSdk = initiateSmartContractPlatformClient({
		apiKey: API_KEY,
		entitySecret : CIRCLE_ENTITY_SECRET 
	});
	const contract = await circleContractSdk.getContract({
		id: contractId,
	});
	if ( !contract.data )
		throw new Error( contract.statusText );
	let currentStatus = "PENDING";
	let _contractAddress = "";
	while (currentStatus !== "COMPLETE" && currentStatus !== "FAILED")
	{
		await new Promise(resolve => setTimeout(resolve, 2000));
		const contract = await circleContractSdk.getContract(
		{
			id: contractId 
		});
		if ( contract.data && contract.data.contract ) 
		{
			currentStatus = contract.data.contract.status || "FAILED";
			_contractAddress = contract.data.contract.contractAddress || "";
			console.log("Statut actuel : " + currentStatus);
		} 
		else 
			currentStatus = "FAILED";
	}
	if (currentStatus === "FAILED" || !_contractAddress)
		throw new Error( "[DEPLOYMENT] Le déploiement a échoué sur la blockchain." );
	console.log("Contrat déployé avec succès à l'adresse :", _contractAddress);
}

async function deployMabbleContract( _name : string, _description : string, _abiPath : string, _constructorParam : [string] )
{
	const _abiJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), _abiPath), 'utf8'));	// ABI ( build avec foundry )
	const _bytecode = _abiJson.bytecode.object;
	console.log( _bytecode );
	const circleContractSdk = initiateSmartContractPlatformClient({									// Initialisation Contract SDK 
		apiKey: API_KEY,
		entitySecret : CIRCLE_ENTITY_SECRET 
	});
	const responseTokenDeployement = await circleContractSdk.deployContract({						// Deployement MabbleToken
		name: _name,
		description: _description,
		blockchain: "ARC-TESTNET",
		walletId: MABBLE_WALLET_ID,
		abiJson: JSON.stringify(_abiJson.abi),
		constructorParameters : _constructorParam,
		bytecode: _bytecode,
		fee: { type: "level", config: { feeLevel: "MEDIUM" } },
	});
	if (!responseTokenDeployement.data)
		throw new Error( responseTokenDeployement.statusText );
	return ( responseTokenDeployement.data );
}

deployMabbleContract( "MabbleEscrowTest2", "Deployment Testing", "abi/MabbleEscrow.json",  [MABBLE_TOKEN_ADDRESS] ).catch( (error) =>
	{
		console.error("Erreur :", error.message || error);
		process.exit(1);
	}
);

