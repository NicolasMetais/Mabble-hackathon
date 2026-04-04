// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {MabbleToken} from "../src/MabbleToken.sol";
import {MabbleEscrow} from "../src/MabbleEscrow.sol";

contract CounterScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        MabbleToken token = new MabbleToken();
        console.log("MabbleToken deploye a :", address(token));
        
        MabbleEscrow escrow = new MabbleEscrow(address(token));
        console.log("MabbleEscrow deploye a :", address(escrow));
        

        token.setPaymentContract(address(escrow));
        console.log("MabbleToken : Escrow contract whitelist avec succes!");

        token.setMintContract(msg.sender);
        console.log("MabbleToken : Mint contract whitelist avec succes!");

        vm.stopBroadcast();
    }
}
