import { ethers } from "ethers";

async function listenConflict()
{
    const provider = new ethers.WebSocketProvider("wss://rpc.testnet.arc.network");
    const contract = new ethers.Contract()
}