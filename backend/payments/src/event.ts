import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";

const MABBLE_ESCROW_ADDRESS = process.env.MABBLE_ESCROW_ADDRESS as string;

async function createConflictListener( contractAddress : string )
{
	const abi = new ethers.Interface( JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "abi/MabbleConflict"), 'utf8')) );	// ABI ( build avec foundry )
	const provider = new ethers.WebSocketProvider("wss://rpc.testnet.arc.network");
	const contract = new ethers.Contract(contractAddress, abi, provider );
	
	contract.on( "conflictSolved", (_paymentId, _conflictAddress, _solver0, _solver1, _refundAddrees) => {
		console.log(` paymentID : ${_paymentId}`);
		console.log(` _conflictAddress : ${_conflictAddress} `);
		console.log(` _solver0 : ${_solver0} `);
		console.log(` _solver1 : ${_solver1} `);
		console.log(` _refundAddress : ${_refundAddrees} `);
		fetch(
		`http://api:4000/conflictResolved`,
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

export async function startListening()
{
	const abi = new ethers.Interface( JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "abi/MabbleEscrow"), 'utf8')) );	// ABI ( build avec foundry )
	const provider = new ethers.WebSocketProvider("wss://rpc.testnet.arc.network");
	const contract = new ethers.Contract(MABBLE_ESCROW_ADDRESS, abi, provider );
	
	contract.on( "ConflictCreated", (paymentID, _conflictAddress) => {
		console.log(` paymentID : ${paymentID}`);
		console.log(` _conflictAddress : ${_conflictAddress} `)
		createConflictListener( _conflictAddress );
	});
	console.log("Conflict Initialiser Listner On");
}

