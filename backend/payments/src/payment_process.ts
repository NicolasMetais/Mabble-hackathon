import { mintMabbleToken } from "./token_interaction";
import { setWhiteListToken } from "./token_interaction";
import { approval } from "./token_interaction";
import { getUserWallet } from "./utils"
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { ethers } from "ethers";
import { getTransaction } from "./utils";
import { error } from "node:console";
import { getWhiteListStatus } from "./token_interaction";

const MABBLE_WALLET_ID = process.env.MABBLE_WALLET_ID as string;
const MABBLE_WALLET_ADDRESS = process.env.MABBLE_WALLET_ADDRESS as string;
const MABBLE_ESCROW_ADDRESS = process.env.MABBLE_ESCROW_ADDRESS as string;
const MABBLE_TOKEN_ADDRESS = process.env.MABBLE_TOKEN_ADDRESS as string
const API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET as string;
const USDC_TOKEN_ADRESS = "0x3600000000000000000000000000000000000000";

export async function welcomeOnMabble( _userWalletAddress: string, _userWalletID: string, _userToken: string ) {

	const amount : bigint = ethers.parseUnits("100", 18);
	const data = await setWhiteListToken( _userWalletAddress, true );
	let currentState = data.state;
	while ( currentState != "COMPLETE" && currentState != "FAILED" ) {
		await new Promise(r => setTimeout(r, 1500));
		const txResponse = await getTransaction( data.id );
		currentState = txResponse.data.transaction.state;
	}
	if ( currentState == "FAILED" )
			throw new Error ( "setwhite list failed");
	await mintMabbleToken( _userWalletAddress, amount);
	const challengeID = await approval( _userWalletID, MABBLE_TOKEN_ADDRESS, _userToken, amount );
	return ( challengeID );
}

function batchPayment(to : string, USDCValue : number, MBBLValue : number)
{
	const erc20Interface = new ethers.Interface(["function approve(address spender, uint256 amount)"]);
	const escrowInterface = new ethers.Interface(["function pay( address to_, uint256 MBBLvalue_, uint256 USDCvalue_ )"]);
	let byteApproveUSDC = "";
	let byteApproveMBBL = "";
	const batch = [];

	const parsedUSDC = USDCValue > 0 ? ethers.parseUnits(String(USDCValue), 6) : 0n;
	const parsedMBBL = MBBLValue > 0 ? ethers.parseUnits(String(MBBLValue), 18) : 0n;
	
	if ( parsedUSDC > 0n )
	{
		byteApproveUSDC = erc20Interface.encodeFunctionData("approve",[ MABBLE_ESCROW_ADDRESS, parsedUSDC ]);
		batch.push([USDC_TOKEN_ADRESS, 0, byteApproveUSDC]);
	}
	if ( parsedMBBL > 0n )
	{
		byteApproveMBBL = erc20Interface.encodeFunctionData("approve",[ MABBLE_ESCROW_ADDRESS, parsedMBBL ]);
		batch.push([MABBLE_TOKEN_ADDRESS, 0, byteApproveMBBL]);
	}
	const bytePay = escrowInterface.encodeFunctionData("pay",[ to, parsedMBBL, parsedUSDC ]);
	batch.push([MABBLE_ESCROW_ADDRESS, 0, bytePay]);
	return ( batch );
}

export async function payment( fromWalletAddress : string, fromWalletID : string, userToken: string, to : string, USDCValue : number, MBBLValue : number, UUID : any ) {

	const toStatusHex = await getWhiteListStatus( to );
	const isToWhiteListed = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], toStatusHex)[0];
	if ( !isToWhiteListed )
		throw new Error ( "to is not white listed");
		
	const fromStatusHex = await getWhiteListStatus( fromWalletAddress );
	const isFromWhiteListed = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], fromStatusHex)[0];
	if ( !isFromWhiteListed )
		throw new Error ( "from is not white listed");
	const batchOfTransaction = batchPayment( to, USDCValue, MBBLValue);
	const responsePay = await fetch(
	`https://api.circle.com/v1/w3s/user/transactions/contractExecution`,
	{
		method: "POST",
		headers: {
			Authorization : `Bearer ${API_KEY}`,
			"Content-Type": "application/json",
			"X-User-Token": userToken,
		},
		body : JSON.stringify({
			idempotencyKey: UUID,
			contractAddress: fromWalletAddress,
			abiFunctionSignature: "executeBatch((address, uint256, bytes)[])",
			walletId: fromWalletID,
			abiParameters: [ batchOfTransaction ],
			feeLevel: "MEDIUM"
		})
	});

	const data = await responsePay.json();
	if (!responsePay.ok)
			throw new Error(data.message || data);
	return data;
}