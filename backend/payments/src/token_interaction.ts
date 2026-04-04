import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { getUserWallet } from "./utils"
import * as fs from "node:fs";
import * as path from "node:path";

const API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET as string;

const MABBLE_TOKEN_ADDRESS = "0xd2572fa03a722fd56edcd0f076b27bf65a832dca";
const MABBLE_TOKEN_ID = "019d30fd-e9c2-7ef1-aadb-b0450aaaa168";
const MABBLE_ESCROW_ADDRESS = process.env.MABBLE_ESCROW_ADDRESS as string;

const MABBLE_WALLET_ID = process.env.MABBLE_WALLET_ID as string;
const MABBLE_WALLET_ADDRESS = process.env.MABBLE_WALLET_ADDRESS as string;

const CIRCLE_BASE_URL = process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";

export async function approval( _userWalletID : string, _contractAddress: string, userToken: string, value: bigint) {
	const responseChallengeExecution = await fetch(
		`${CIRCLE_BASE_URL}/v1/w3s/user/transactions/contractExecution`,
		{
			method: "POST",
			headers:
			{
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
				"X-User-Token": userToken,
			},
			body: JSON.stringify({
				idempotencyKey: crypto.randomUUID(),
				contractAddress: _contractAddress,
				abiFunctionSignature: "approve(address,uint256)",
				walletId: _userWalletID,
				abiParameters: [
					MABBLE_ESCROW_ADDRESS,
					value.toString()
				],
				feeLevel: "MEDIUM"
			}),
		}
	);
	const data = await responseChallengeExecution.json();
	if (!responseChallengeExecution.ok)
		throw new Error(data.message);
	return data;
}

export async function withdraw( _userWalletID : string, userToken: string, paymentId: [bigint]) {
	const responseChallengeExecution = await fetch(
		`${CIRCLE_BASE_URL}/v1/w3s/user/transactions/contractExecution`,
		{
			method: "POST",
			headers:
			{
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
				"X-User-Token": userToken,
			},
			body: JSON.stringify({
				idempotencyKey: crypto.randomUUID(),
				contractAddress: MABBLE_ESCROW_ADDRESS,
				abiFunctionSignature: "withdraw(uint256[])",
				walletId: _userWalletID,
				abiParameters: [
					[paymentId]
				],
				feeLevel: "MEDIUM"
			}),
		}
	);
	const data = await responseChallengeExecution.json();
	if (!responseChallengeExecution.ok)
		throw new Error(data);
	return data;
}


export async function releaseFund( _userWalletID : string, userToken: string, paymentId: bigint) {
	const responseChallengeExecution = await fetch(
		`${CIRCLE_BASE_URL}/v1/w3s/user/transactions/contractExecution`,
		{
			method: "POST",
			headers:
			{
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
				"X-User-Token": userToken,
			},
			body: JSON.stringify({
				idempotencyKey: crypto.randomUUID(),
				contractAddress: MABBLE_ESCROW_ADDRESS,
				abiFunctionSignature: "releaseFund(uint256)",
				walletId: _userWalletID,
				abiParameters: [
					paymentId
				],
				feeLevel: "MEDIUM"
			}),
		}
	);
	const data = await responseChallengeExecution.json();
	if (!responseChallengeExecution.ok)
		throw new Error(data);
	return data;
}


export async function setWhiteListToken(address: string, value: boolean) {
	const circleDevWalletSdk = initiateDeveloperControlledWalletsClient(
		{
			apiKey: API_KEY,
			entitySecret: CIRCLE_ENTITY_SECRET
		});
	const responseAddToWhite = await circleDevWalletSdk.createContractExecutionTransaction({
		amount: "0",
		abiFunctionSignature: "setWhiteList(address,bool)",
		abiParameters: [address, value],
		contractAddress: MABBLE_TOKEN_ADDRESS,
		walletId: MABBLE_WALLET_ID,
		fee: {
			type: "level",
			config: {
				feeLevel: "MEDIUM",
			},
		},
	});
	if (!responseAddToWhite.data)
		throw new Error(responseAddToWhite.data);
	return (responseAddToWhite.data);
}

export async function burnMabbletoken(address: string, value: number) {
	const circleDevWalletSdk = initiateDeveloperControlledWalletsClient(
		{
			apiKey: API_KEY,
			entitySecret: CIRCLE_ENTITY_SECRET
		});
	const responseBurnToken = await circleDevWalletSdk.createContractExecutionTransaction({
		amount: "0",
		abiFunctionSignature: "burn(address,uint256)",
		abiParameters: [address, value],
		contractAddress: MABBLE_TOKEN_ADDRESS,
		walletId: MABBLE_WALLET_ID,
		fee: {
			type: "level",
			config: {
				feeLevel: "MEDIUM",
			},
		},
	});
	if (!responseBurnToken.data)
		throw new Error(responseBurnToken.statusText);
}

export async function mintMabbleToken(address: string, value: bigint) {
	const circleDevWalletSdk = initiateDeveloperControlledWalletsClient(
		{
			apiKey: API_KEY,
			entitySecret: CIRCLE_ENTITY_SECRET
		});
	const responseMintToken = await circleDevWalletSdk.createContractExecutionTransaction({
		amount: "0",
		abiFunctionSignature: "mint(address,uint256)",
		abiParameters: [address, value.toString()],
		contractAddress: MABBLE_TOKEN_ADDRESS,
		walletId: MABBLE_WALLET_ID,
		fee: {
			type: "level",
			config: {
				feeLevel: "MEDIUM",
			},
		},
	});
	if (!responseMintToken.data)
		throw new Error(responseMintToken.statusText);
}

export async function getWhiteListStatus(address: string) {
	const abiMabbleToken = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'abi/MabbleToken.json'), 'utf8'));
	const circleContractSdk = initiateSmartContractPlatformClient(
		{
			apiKey: API_KEY,
			entitySecret: CIRCLE_ENTITY_SECRET
		});
	const responseGetWhiteListStatus = await circleContractSdk.queryContract({
		abiFunctionSignature: "getUserWhitelistStatus(address)",
		abiParameters: [address],
		address: MABBLE_TOKEN_ADDRESS,
		abiJson: JSON.stringify(abiMabbleToken.abi),
		blockchain: "ARC-TESTNET"
	});
	if (!responseGetWhiteListStatus.data)
		throw new Error(responseGetWhiteListStatus.statusText);
	console.log(responseGetWhiteListStatus.data.outputData);
	return (responseGetWhiteListStatus.data.outputData);
}