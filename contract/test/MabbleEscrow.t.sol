// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.20;

// import {Test, console} from "forge-std/Test.sol";
// import {MabbleEscrow} from "../src/MabbleEscrow.sol";
// import {MabbleToken} from "../src/MabbleToken.sol";
// import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// // Mock USDC pour outrepasser l'adresse hardcodée 0x360...
// contract MockUSDC is ERC20 {
//     constructor() ERC20("Mock USDC", "USDC") {}
//     function mint(address to, uint256 amount) public {
//         _mint(to, amount);
//     }
// }

// // Harness pour tester la fonction internal burnMabbleToken
// contract MabbleEscrowHarness is MabbleEscrow {
//     constructor(address _mbbl) MabbleEscrow(_mbbl) {}
    
//     function exposed_burnMabbleToken(address account, uint256 value) public {
//         burnMabbleToken(account, value);
//     }
// }

// contract MabbleEscrowTest is Test {

//     MabbleEscrow public escrow;
//     MabbleToken public token;
//     MockUSDC public usdc;

//     address public owner = address(this);
//     address public mintContract = address(0x222);
//     address public user1 = address(0x333); // Envoyeur
//     address public user2 = address(0x444); // Receveur
    
//     // Adresse USDC hardcodée dans MabbleEscrow
//     address constant USDC_ADDRESS = 0x3600000000000000000000000000000000000000;

//     function setUp() public {
//         usdc = new MockUSDC();
//         // Remplacement du code à l'adresse USDC_ADDRESS par notre Mock
//         vm.etch(USDC_ADDRESS, address(usdc).code);
        
//         // Setup initial balances
//         MockUSDC(USDC_ADDRESS).mint(user1, 10000 * 1e6);

//         // Deploiement des contrats (gestion circulaire token/escrow)
//         token = new MabbleToken(address(0), mintContract);
//         escrow = new MabbleEscrow(address(token));
        
//         // Liaison Token -> Escrow
//         token.setPaymentContract(address(escrow));

//         // Whitelist des adresses pour les transferts
//         token.setWhiteList(address(escrow), true);
//         token.setWhiteList(user1, true);
//         token.setWhiteList(user2, true);

//         // Mint de MBBL initiaux
//         vm.prank(mintContract);
//         token.mint(user1, 10000 * 1e18);

//         // Approuver l'escrow pour dépenser les tokens de user1
//         vm.startPrank(user1);
//         token.approve(address(escrow), type(uint256).max);
//         MockUSDC(USDC_ADDRESS).approve(address(escrow), type(uint256).max);
//         vm.stopPrank();
//     }

//     function test_pay() public {
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);

//         assertEq(token.balanceOf(address(escrow)), 100 * 1e18);
//         assertEq(MockUSDC(USDC_ADDRESS).balanceOf(address(escrow)), 50 * 1e6);
//         assertEq(escrow._nonce(), 1);
//     }

//     function test_pay_zero_values() public {
//         vm.prank(user1);
//         escrow.pay(user2, 0, 0);

//         assertEq(escrow._nonce(), 1);
//         assertEq(token.balanceOf(address(escrow)), 0);
//         assertEq(MockUSDC(USDC_ADDRESS).balanceOf(address(escrow)), 0);
//     }

//     function test_releaseFund() public {
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);

//         vm.prank(user1);
//         escrow.releaseFund(0);
        
//         // On vérifie que les fonds sont débloqués en tentant un withdraw plus tard (indirectement)
//     }

//     function test_releaseFund_revertCallerNotAllowed() public {
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);

//         vm.prank(user2); // user2 try to release (must be sender)
//         vm.expectRevert(MabbleEscrow.CallerNotAllowed.selector);
//         escrow.releaseFund(0);
//     }

//     function test_releaseFund_revertPaimentAlreadyApproved() public {
//         vm.startPrank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);
//         escrow.releaseFund(0); // Première fois fonctionne
        
//         vm.expectRevert(MabbleEscrow.PaimentAlreadyApproved.selector);
//         escrow.releaseFund(0); // Seconde fois revert
//         vm.stopPrank();
//     }

//     function test_withdraw() public {
//         // user1 paie user2
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);
        
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);

//         // user1 valide le paiement
//         vm.prank(user1);
//         escrow.releaseFund(0);

//         vm.prank(user1);
//         escrow.releaseFund(1);

//         uint256[] memory pIds = new uint256[](2);
//         pIds[0] = 0;
//         pIds[1] = 1;

//         uint256 initMbblUser2 = token.balanceOf(user2);
//         uint256 initUsdcUser2 = MockUSDC(USDC_ADDRESS).balanceOf(user2);

//         // user2 retire les fonds
//         vm.prank(user2);
//         escrow.withdraw(pIds);

//         assertEq(token.balanceOf(user2), initMbblUser2 + ((100 * 1e18) * 2));
//         assertEq(MockUSDC(USDC_ADDRESS).balanceOf(user2), initUsdcUser2 + ((50 * 1e6) * 2));
//     }

//     function test_withdraw_revertCallerNotAllowed() public {
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);

//         vm.prank(user1);
//         escrow.releaseFund(0);

//         uint256[] memory pIds = new uint256[](1);
//         pIds[0] = 0;

//         vm.prank(user1); // Pas user2!
//         vm.expectRevert(MabbleEscrow.CallerNotAllowed.selector);
//         escrow.withdraw(pIds);
//     }

//     function test_withdraw_revertFundNotReleased() public {
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6); 

//         uint256[] memory pIds = new uint256[](1);
//         pIds[0] = 0;

//         // user1 n'a pas appelé releaseFund
//         vm.prank(user2);
//         vm.expectRevert(MabbleEscrow.FundNotReleased.selector);
//         escrow.withdraw(pIds);
//     }

//     function test_withdraw_revertPaimentAlreadyWithdrawn() public {
//         vm.prank(user1);
//         escrow.pay(user2, 100 * 1e18, 50 * 1e6);

//         vm.prank(user1);
//         escrow.releaseFund(0);

//         uint256[] memory pIds = new uint256[](1);
//         pIds[0] = 0;

//         vm.startPrank(user2);
//         escrow.withdraw(pIds); // 1er retrait OK
        
//         vm.expectRevert(MabbleEscrow.PaimentAlreadyWithdrawn.selector);
//         escrow.withdraw(pIds); // 2eme retrait Revert
//         vm.stopPrank();
//     }

//     function test_internal_burnMabbleToken() public {
//         // Déploiement du Harness (hérite de MabbleEscrow)
//         MabbleEscrowHarness harness = new MabbleEscrowHarness(address(token));
        
//         // Le Harness doit être déclaré comme contrat Escrow principal dans le token (sinon msg.sender != _escrowContract revertira)
//         token.setPaymentContract(address(harness));
        
//         // Le Harness doit être dans la whitelist (car le from dans _update lors d'un burn doit être whitelisté)
//         token.setWhiteList(address(harness), true);

//         // On lui mint des tokens pour le test
//         vm.prank(mintContract);
//         token.mint(address(harness), 1000);

//         // On appelle la fonction internal exposée publiquement via le harness
//         harness.exposed_burnMabbleToken(address(harness), 600);

//         // 1000 - 600 = 400
//         assertEq(token.balanceOf(address(harness)), 400);
//     }
// }
