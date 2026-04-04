// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.20;

// import {Test, console} from "forge-std/Test.sol";
// import {MabbleToken} from "../src/MabbleToken.sol";

// contract MabbleTokenTest is Test {
//     MabbleToken public token;
//     address public owner = address(this);
//     address public escrow = address(0x111);
//     address public mintContract = address(0x222);
    
//     address public user1 = address(0x333);
//     address public user2 = address(0x444);

//     function setUp() public {
//         token = new MabbleToken(escrow, mintContract);
//     }

//     function test_constructor() public {
//         assertEq(token.getPaymentContract(), escrow);
//         assertEq(token.getMintContract(), mintContract);
//         assertTrue(token.getUserWhitelistStatus(address(0)));
//     }

//     function test_setPaymentContract() public {
//         address newEscrow = address(0x555);
//         token.setPaymentContract(newEscrow);
//         assertEq(token.getPaymentContract(), newEscrow);
//     }

//     function test_setPaymentContract_revertNotOwner() public {
//         vm.prank(user1);
//         vm.expectRevert(); // Ownable restriction
//         token.setPaymentContract(address(0x555));
//     }

//     function test_setWhiteList() public {
//         token.setWhiteList(user1, true);
//         assertTrue(token.getUserWhitelistStatus(user1));
//     }

//     function test_setWhiteList_revertNotOwner() public {
//         vm.prank(user1);
//         vm.expectRevert(); // Ownable restriction
//         token.setWhiteList(user1, true);
//     }

//     function test_getPaymentContract_revertNotOwner() public {
//         vm.prank(user1);
//         vm.expectRevert();
//         token.getPaymentContract();
//     }

//     function test_getMintContract_revertNotOwner() public {
//         vm.prank(user1);
//         vm.expectRevert();
//         token.getMintContract();
//     }

//     function test_getUserWhitelistStatus_revertNotOwner() public {
//         vm.prank(user1);
//         vm.expectRevert();
//         token.getUserWhitelistStatus(user1);
//     }

//     function test_mint() public {
//         token.setWhiteList(user1, true);

//         vm.prank(mintContract);
//         token.mint(user1, 1000);
//         assertEq(token.balanceOf(user1), 1000);
//     }

//     function test_mint_revertUnauthorizedMint() public {
//         token.setWhiteList(user1, true);

//         vm.prank(user2);
//         vm.expectRevert(abi.encodeWithSelector(MabbleToken.MabbleUnauthorizedMint.selector, user2, 1000));
//         token.mint(user1, 1000);
//     }

//     function test_burn() public {
//         token.setWhiteList(escrow, true);

//         // Mint to escrow
//         vm.prank(mintContract);
//         token.mint(escrow, 1000);

//         // La correction exige que SEUL le contrat d'escrow puisse initier la transaction de burn
//         vm.prank(escrow);
//         token.burn(escrow, 500);

//         assertEq(token.balanceOf(escrow), 500);
//     }

//     function test_burn_revertUnauthorizedBurn() public {
//         token.setWhiteList(user1, true);

//         vm.prank(mintContract);
//         token.mint(user1, 1000);

//         // Try to burn from user1 (which is not escrowContract)
//         vm.prank(user1);
//         vm.expectRevert(abi.encodeWithSelector(MabbleToken.MabbleUnauthorizedBurn.selector, user1, 500));
//         token.burn(user1, 500);
//     }

//     function test_transfer() public {
//         token.setWhiteList(user1, true);
//         token.setWhiteList(user2, true);

//         vm.prank(mintContract);
//         token.mint(user1, 1000);

//         vm.prank(user1);
//         token.transfer(user2, 500);

//         assertEq(token.balanceOf(user1), 500);
//         assertEq(token.balanceOf(user2), 500);
//     }

//     function test_transfer_revertNotWhitelisted() public {
//         token.setWhiteList(user1, true);
//         // user2 is not whitelisted

//         vm.prank(mintContract);
//         token.mint(user1, 1000);

//         vm.prank(user1);
//         vm.expectRevert("MabbleToken : Address unauthorized to procede transaction.");
//         token.transfer(user2, 500);
//     }

//     // ----------------------------------------------------
//     // Tests spécifiques pour l'override de _update
//     // ----------------------------------------------------

//     function test_update_revertFromNotWhitelisted_Transfer() public {
//         token.setWhiteList(user1, true);
//         token.setWhiteList(user2, true);

//         vm.prank(mintContract);
//         token.mint(user1, 1000);

//         // On retire user1 de la whitelist (l'expéditeur)
//         token.setWhiteList(user1, false);

//         vm.prank(user1);
//         vm.expectRevert("MabbleToken : Address unauthorized to procede transaction.");
//         token.transfer(user2, 500);
//     }

//     function test_update_revertZeroAddressNotWhitelisted_Mint() public {
//         token.setWhiteList(user1, true);

//         // On retire l'adresse 0 (qui est `from` lors d'un mint) de la whitelist
//         token.setWhiteList(address(0), false);

//         vm.prank(mintContract);
//         vm.expectRevert("MabbleToken : Address unauthorized to procede transaction.");
//         token.mint(user1, 1000);
//     }

//     function test_update_revertZeroAddressNotWhitelisted_Burn() public {
//         token.setWhiteList(escrow, true);

//         vm.prank(mintContract);
//         token.mint(escrow, 1000);

//         // On retire l'adresse 0 (qui est `to` lors d'un burn) de la whitelist
//         token.setWhiteList(address(0), false);

//         vm.prank(user1); 
//         vm.expectRevert("MabbleToken : Address unauthorized to procede transaction.");
//         token.burn(escrow, 500);
//     }

//     // ----------------------------------------------------
//     // Tests demandés pour vérifier le rôle de la whitelist sur escrow / mintContract
//     // ----------------------------------------------------

//     function test_mint_SuccessWhenMintContractNotWhitelisted() public {
//         token.setWhiteList(user1, true);
        
//         // On s'assure que mintContract N'EST PAS dans la whitelist
//         assertFalse(token.getUserWhitelistStatus(mintContract));

//         // L'adresse qui appelle la fonction (msg.sender = mintContract) n'a pas besoin d'être whitelistée
//         // car le require vérifie uniquement 'from' (address 0) et 'to' (user1)
//         vm.prank(mintContract);
//         token.mint(user1, 1000);
        
//         // Le mint passe avec succès !
//         assertEq(token.balanceOf(user1), 1000); 
//     }

//     function test_burn_RevertWhenEscrowNotWhitelisted() public {
//         // Pour pouvoir d'abord miner des jetons vers l'escrow, l'escrow doit être whitelisté
//         token.setWhiteList(escrow, true);
//         vm.prank(mintContract);
//         token.mint(escrow, 1000);

//         // On retire l'escrow de la whitelist juste avant d'essayer de burn ses jetons
//         token.setWhiteList(escrow, false);
//         assertFalse(token.getUserWhitelistStatus(escrow));

//         // Lors d'un Burn, l'adresse du compte depuis lequel on détruit (from = escrow) 
//         // DOIT être whitelistée selon votre require.
//         // La destruction va donc échouer.
//         vm.prank(user1); 
//         vm.expectRevert("MabbleToken : Address unauthorized to procede transaction.");
//         token.burn(escrow, 500);
//     }
// }
