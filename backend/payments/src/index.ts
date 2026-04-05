import "dotenv/config";
import express from "express";
import cors from "cors";
import { getUserChallengeForWalletCreation } from "./create-user-wallets";
import { circle_OTP_request } from "./create-user-wallets";
import { welcomeOnMabble } from "./payment_process";
import { payment } from "./payment_process";
import { getUserWallet } from "./utils";
import { getUserBalance } from "./utils";
import { releaseFund } from "./token_interaction";
import { withdraw } from "./token_interaction";
import { initateDispute, voteDispute } from "./dispute";
import { startListening } from './event';

startListening();
const app = express();
app.use(cors());
const PORT = 4001;

app.use(express.json());                  // Lit la data de maniere asynchrone avant de la passer au code

app.get('/', (req, res) => {
	res.send('Bravo ! Le serveur Express fonctionne ! 🚀');
});

app.get("/ping", (req: any, res: any) => {
	console.log("ping dans payments");
	res.json({ message: "pong de payments" });
});

// Gere l'envoie de code par email et l'iniatilisation de challengeId qui permet au client de generer une cle prive
app.post("/ConnectWallet", async (req: any, res: any) => {

	const body = req.body;
	const { action, ...param } = body;

	try {
		console.log("ici");
		if (action === "requestEmailOTP") {
			const { email, deviceId } = param;
			if (!email || !deviceId) {
				throw new Error("[ Auth - requestEmailOTP ] email or deviceId : undifined.");

			}
			const clientInfo = await circle_OTP_request(email, deviceId);
			console.log("ici1");
			res.status(200).json(clientInfo);
		}
		else if (action === "initialize") {
			const { userToken } = param;
			if (!userToken) {
				throw new Error("[ INITIALIZE ] userToken undifined");
			}
			const challengeID = await getUserChallengeForWalletCreation(userToken);
			res.status(200).json(challengeID);
		}
		else
			res.status(400).json({ error: "action undifined" });
	}
	catch (error: any) {
		console.log("error");
		res.status(400).json({ error: error.message });
	}
});

app.post( "/webhooks/circle", (req: any, res: any) => {
	res.status(200).json({ message: "Hooked hihihihi" });
});

app.post("/pay", async (req: any, res: any) => {

	try
	{
		const { fromWalletAddress, fromWalletID, userToken, to, USDCValue, MBBLValue } = req.body;
		if ( !fromWalletAddress || !fromWalletID || !userToken || !to )
			throw new Error("[ Pay ] fromWalletAddress || fromWalletID || userToken || to : undifined.");
		const UUID = crypto.randomUUID();
		const challengeId = await payment( fromWalletAddress, fromWalletID, userToken, to, USDCValue, MBBLValue, UUID);
		res.status(200).json( challengeId );
	}
	catch ( error : any )
	{
		res.status(400).json({ error: error.message });
	}
});

app.post("/initializeDispute", async ( req : any, res : any ) => 
{
	try
	{
		const { fromWalletId , userToken , paymentId, solver0 , solver1 } = req.body;
		if ( !fromWalletId || !userToken || !paymentId|| !solver0 || !solver1 )
				throw new Error("fromWalletId || userToken || paymentId|| solver0 || solver1 : undifined.")
		const challengeId =  await initateDispute( fromWalletId, userToken, paymentId, solver0, solver1);		
		res.status(200).json( challengeId );
	}
	catch ( error : any )
	{
		res.status(400).json({ error: error.message });
	}
});

app.post("/vote", async (req: any, res: any) => {
	try {
		const { fromWalletId, userToken, conflictAddress, voteForClient } = req.body;
		if (!fromWalletId || !userToken || !conflictAddress || voteForClient === undefined)
			throw new Error("fromWalletId || userToken || conflictAddress || voteForClient : undefined.");
		const challengeId = await voteDispute(fromWalletId, userToken, conflictAddress, voteForClient);
		res.status(200).json(challengeId);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
});

app.post("/releaseFund", async (req: any, res: any) => {

	const { _userWalletID, _userToken, _paymentId } = req.body;
	try
	{
		if ( !_paymentId )
			throw new Error("[ releaseFund ] _paymentId : undifined.");
		const challengeId = await releaseFund( _userWalletID, _userToken, _paymentId );
		res.status(200).json( challengeId );
	}
	catch ( error : any )
	{
		res.status(400).json({ error: error.message });
	}
});

app.post("/withdraw", async (req: any, res: any) => {

	const { _userWalletID, _userToken, _paymentId } = req.body;
	try
	{
		if ( !_paymentId )
			throw new Error("[ withdraw ] _paymentId : undifined.");
		const challengeId = await withdraw( _userWalletID, _userToken, _paymentId );
		res.status(200).json( challengeId );
	}
	catch ( error : any )
	{
		res.status(400).json({ error: error.message });
	}
});

app.post("/welcome", async (req: any, res: any) => {

	const { _userWalletAddress, _userWalletID, _userToken  } = req.body;
	try 
	{
		if ( !_userWalletAddress || ! _userWalletID || !_userToken )
			res.status(400).json({ error: " [ welcome ] missing argument" });
		const challengeID = await welcomeOnMabble( _userWalletAddress, _userWalletID, _userToken );
		res.status(200).json(challengeID);	
	}
	catch( error: any ){
		res.status(400).json({ error: error.message });
	}
});

// Recupere le wallet d'un user
app.post("/getWallet", async (req: any, res: any) =>
{
	const body = req.body;
	const { action, ...param } = body;
	try
	{
		if (action === "getWallet") {
			const { userToken } = param;
			if (!userToken) {
				throw new Error("[ GET WALLET ] userToken undifined");
			}
			const wallet = await getUserWallet(userToken);
			res.status(200).json({ wallet });
		}
		else
			res.status(400).json({ error: "action undifined" });
	}
	catch (error: any) {
		res.status(400).json({ error: error.message });
	}

});

app.post("/getBalance", async (req: any, res: any) => {

	const body = req.body;
	const { action, ...param } = body;
	try {
		if (action === "getBalance") {
			const { userToken, walletId } = param;
			if (!userToken || !walletId) {
				throw new Error("[ GET BALANCE ] userToker || walletId undifined");
			}
			const balance = await getUserBalance(userToken, walletId);
			res.status(200).json({ balance });

		}
		else
			res.status(400).json({ error: "action undifined" });
	}
	catch (error: any) {
		res.status(400).json({ error: error.message });
	}
});

app.listen(PORT, () => {
	console.log(`Payments running on port ${PORT}`);
});