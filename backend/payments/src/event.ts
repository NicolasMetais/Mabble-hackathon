import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";

const MABBLE_ESCROW_ADDRESS = process.env.MABBLE_ESCROW_ADDRESS as string;
const provider = new ethers.WebSocketProvider("wss://rpc.testnet.arc.network");

async function createConflictListener(contractAddress: string) {

	const outCompile = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "./abi/MabbleConflict"), 'utf8'));	// ABI ( build avec foundry )
	const abi = outCompile.abi;
	const contract = new ethers.Contract(contractAddress, abi, provider);

	contract.on("conflictSolved", (_paymentId, _conflictAddress, _solver0, _solver1, _refundAddrees) => {
		console.log(` paymentID : ${_paymentId}`);
		console.log(` _conflictAddress : ${_conflictAddress} `);
		console.log(` _solver0 : ${_solver0} `);
		console.log(` _solver1 : ${_solver1} `);
		console.log(` _refundAddress : ${_refundAddrees} `);
		fetch(
			`http://api:4000/payment/conflictResolved`,
			{
				method: "POST",
				headers:
				{
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					paymentID: _paymentId,
					solver0: _solver0,
					solver1: _solver1,
					refundAddrees: _refundAddrees
				}),
			});
		contract.removeAllListeners();
	});
	console.log(`Conflict Listner On : ${contractAddress}`);
}

export async function startListening() {
	const outCompile = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "./abi/MabbleEscrow.json"), 'utf8'));	// ABI ( build avec foundry )
	const abi = outCompile.abi;
	const contract = new ethers.Contract(MABBLE_ESCROW_ADDRESS, abi, provider);

	contract.on("ConflictCreated", (paymentID, _conflictAddress) => {
		console.log(` paymentID : ${paymentID}`);
		console.log(` _conflictAddress : ${_conflictAddress} `)

		fetch(`http://api:4000/payment/conflictCreated`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				paymentID: paymentID.toString(),
				conflictAddress: _conflictAddress
			})
		}).catch(console.error);

		createConflictListener(_conflictAddress);
	});
	console.log("Conflict Initialiser Listner On");

	contract.on("PaymentCreated", (paymentID, to, from, amountMBBL, amountUSDC, releaseTimestamp) => {
		console.log(` paymentID : ${paymentID}`);
		console.log(` to : ${to} `);
		console.log(` from : ${from} `);
		console.log(` amountMBBL : ${amountMBBL} `);
		console.log(` amountUSDC : ${amountUSDC} `);
		console.log(` releaseTimestamp : ${releaseTimestamp} `);
		fetch(
			`http://api:4000/payment/created`,
			{
				method: "POST",
				headers:
				{
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					paymentID: paymentID.toString(),
					to,
					from,
					amountMBBL: amountMBBL.toString(),
					amountUSDC: amountUSDC.toString(),
					releaseTimestamp: releaseTimestamp.toString(),
				}),
			});
	});
	contract.on("ReleaseFund", (paymentId) => {
		fetch(
			`http://api:4000/payment/releaseFund`,
			{
				method: "POST",
				headers:
				{
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					paymentID: paymentId.toString(),
				}),
			});
	});
	contract.on("Withdraw", (paymentID, to, amountMBBL, amountUSDC, releaseTimestamp, refundTo) => {
		console.log(`[event] *** Withdraw *** paymentID: ${paymentID}`);
		fetch(`http://api:4000/payment/withdrawn`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				paymentID: paymentID.toString(),
			}),
		}).catch(console.error);
	});
}
