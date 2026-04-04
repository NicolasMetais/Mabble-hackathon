
const MABBLE_TOKEN_ADDRESS = "0xd2572fa03a722fd56edcd0f076b27bf65a832dca";
const MABBLE_TOKEN_ID = "019d30fd-e9c2-7ef1-aadb-b0450aaaa168";
const MABBLE_ESCROW_ADDRESS = process.env.MABBLE_ESCROW_ADDRESS as string;
const API_KEY = process.env.MABBLE_ESCROW_ADDRESS as string;

export async function initateDispute( fromWalletId : string, userToken : string, paymentId : number, solver0 : string, solver1 : string ) {

	const responseTx = await fetch(
	`https://api.circle.com/v1/w3s/user/transactions/contractExecution`,
	{
		method: "POST",
		headers: {
			Authorization : `Bearer ${API_KEY}`,
			"Content-Type": "application/json",
			"X-User-Token": userToken,
		},
		body : JSON.stringify({
			idempotencyKey: crypto.randomUUID(),
			contractAddress: MABBLE_ESCROW_ADDRESS,
			abiFunctionSignature: "initializeConflict(uint256, address, address)",
			walletId: fromWalletId,
			abiParameters: [ paymentId, solver0, solver1 ],
			feeLevel: "MEDIUM"
		})
	});
	const data = await responseTx.json();
	if ( !responseTx.ok )
		throw new Error( data.message );
	return ( data );
}