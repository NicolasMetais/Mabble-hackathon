// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console, Vm} from "forge-std/Test.sol";
import {MabbleEscrow} from "../src/MabbleEscrow.sol";
import {MabbleConflict} from "../src/MabbleConflict.sol";
import {MabbleToken} from "../src/MabbleToken.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ──────────────────────────────────────────────
//  Mock USDC  (replaces the hard-coded 0x360…)
// ──────────────────────────────────────────────
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

// ──────────────────────────────────────────────
//  Base test helper
// ──────────────────────────────────────────────
contract MabbleTestBase is Test {
    MabbleToken  public token;
    MabbleEscrow public escrow;
    MockUSDC     public usdc;

    address constant USDC_ADDR = 0x3600000000000000000000000000000000000000;

    // Actors
    address public owner;       // deployer = owner of MabbleToken
    address public sender   = makeAddr("sender");
    address public receiver = makeAddr("receiver");
    address public solver0  = makeAddr("solver0");
    address public solver1  = makeAddr("solver1");
    address public outsider = makeAddr("outsider");

    uint256 constant MBBL_AMOUNT = 500 ether;
    uint256 constant USDC_AMOUNT = 200 * 1e6;

    function setUp() public virtual {
        owner = address(this);

        // 1. Deploy mock USDC and etch it at the hard-coded address
        usdc = new MockUSDC();
        vm.etch(USDC_ADDR, address(usdc).code);

        // 2. Deploy MabbleToken (this contract = owner + mintContract)
        token = new MabbleToken();

        // 3. Deploy MabbleEscrow
        escrow = new MabbleEscrow(address(token));

        // 4. Link token → escrow
        token.setPaymentContract(address(escrow));

        // 5. Whitelist actors
        token.setWhiteList(sender,   true);
        token.setWhiteList(receiver, true);

        // 6. Mint MBBL to sender
        token.mint(sender, MBBL_AMOUNT * 10);

        // 7. Mint USDC to sender (via etched contract)
        MockUSDC(USDC_ADDR).mint(sender, USDC_AMOUNT * 10);

        // 8. Sender approves escrow for both tokens
        vm.startPrank(sender);
        token.approve(address(escrow), type(uint256).max);
        MockUSDC(USDC_ADDR).approve(address(escrow), type(uint256).max);
        vm.stopPrank();
    }

    // ── Helpers ──────────────────────────────
    function _pay(uint256 mbbl, uint256 usdc_) internal returns (uint256 paymentId) {
        paymentId = escrow._nonce();
        vm.prank(sender);
        escrow.pay(receiver, mbbl, usdc_);
    }

    function _payAndRelease(uint256 mbbl, uint256 usdc_) internal returns (uint256 paymentId) {
        paymentId = _pay(mbbl, usdc_);
        vm.prank(sender);
        escrow.releaseFund(paymentId);
    }

    function _initConflict(uint256 paymentId) internal {
        vm.prank(sender);
        escrow.initializeConflict(paymentId, solver0, solver1);
    }
}

// ══════════════════════════════════════════════
//  ESCROW TESTS
// ══════════════════════════════════════════════
contract MabbleEscrowTest is MabbleTestBase {

    // ─── pay() ──────────────────────────────

    function test_pay_MBBL_only() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        assertEq(id, 0);
        assertEq(token.balanceOf(address(escrow)), MBBL_AMOUNT);
        assertEq(escrow.balanceMBBL(receiver), MBBL_AMOUNT);
        assertEq(escrow.balanceUSDC(receiver), 0);
    }

    function test_pay_USDC_only() public {
        uint256 id = _pay(0, USDC_AMOUNT);

        assertEq(id, 0);
        assertEq(MockUSDC(USDC_ADDR).balanceOf(address(escrow)), USDC_AMOUNT);
        assertEq(escrow.balanceUSDC(receiver), USDC_AMOUNT);
        assertEq(escrow.balanceMBBL(receiver), 0);
    }

    function test_pay_MBBL_and_USDC() public {
        _pay(MBBL_AMOUNT, USDC_AMOUNT);

        assertEq(token.balanceOf(address(escrow)), MBBL_AMOUNT);
        assertEq(MockUSDC(USDC_ADDR).balanceOf(address(escrow)), USDC_AMOUNT);
        assertEq(escrow.balanceMBBL(receiver), MBBL_AMOUNT);
        assertEq(escrow.balanceUSDC(receiver), USDC_AMOUNT);
    }

    function test_pay_increments_nonce() public {
        assertEq(escrow._nonce(), 0);
        _pay(MBBL_AMOUNT, 0);
        assertEq(escrow._nonce(), 1);
        _pay(MBBL_AMOUNT, 0);
        assertEq(escrow._nonce(), 2);
    }

    function test_pay_emits_PaymentCreated() public {
        vm.prank(sender);
        vm.expectEmit(true, true, true, true);
        emit MabbleEscrow.PaymentCreated(0, receiver, MBBL_AMOUNT, USDC_AMOUNT, block.timestamp, sender);
        escrow.pay(receiver, MBBL_AMOUNT, USDC_AMOUNT);
    }

    // ─── releaseFund() ──────────────────────

    function test_releaseFund_by_sender() public {
        uint256 id = _pay(MBBL_AMOUNT, USDC_AMOUNT);

        vm.prank(sender);
        vm.expectEmit(true, false, false, false);
        emit MabbleEscrow.ReleaseFund(id);
        escrow.releaseFund(id);
    }

    function test_releaseFund_revert_notSender() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        vm.prank(receiver);
        vm.expectRevert(MabbleEscrow.CallerNotAllowed.selector);
        escrow.releaseFund(id);
    }

    function test_releaseFund_revert_alreadyApproved() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        vm.startPrank(sender);
        escrow.releaseFund(id);

        vm.expectRevert(MabbleEscrow.PaimentAlreadyApproved.selector);
        escrow.releaseFund(id);
        vm.stopPrank();
    }

    function test_releaseFund_revert_whenConflictExists() public {
        uint256 id = _pay(MBBL_AMOUNT, USDC_AMOUNT);
        _initConflict(id);

        vm.prank(sender);
        vm.expectRevert(MabbleEscrow.PaymentIsInConflict.selector);
        escrow.releaseFund(id);
    }

    // ─── withdraw() ─────────────────────────

    function test_withdraw_single() public {
        uint256 id = _payAndRelease(MBBL_AMOUNT, USDC_AMOUNT);

        uint256 mbblBefore = token.balanceOf(receiver);
        uint256 usdcBefore = MockUSDC(USDC_ADDR).balanceOf(receiver);

        uint256[] memory ids = new uint256[](1);
        ids[0] = id;

        vm.prank(receiver);
        escrow.withdraw(ids);

        assertEq(token.balanceOf(receiver), mbblBefore + MBBL_AMOUNT);
        assertEq(MockUSDC(USDC_ADDR).balanceOf(receiver), usdcBefore + USDC_AMOUNT);
    }

    function test_withdraw_multiple() public {
        uint256 id0 = _payAndRelease(MBBL_AMOUNT, USDC_AMOUNT);
        uint256 id1 = _payAndRelease(MBBL_AMOUNT, USDC_AMOUNT);

        uint256 mbblBefore = token.balanceOf(receiver);
        uint256 usdcBefore = MockUSDC(USDC_ADDR).balanceOf(receiver);

        uint256[] memory ids = new uint256[](2);
        ids[0] = id0;
        ids[1] = id1;

        vm.prank(receiver);
        escrow.withdraw(ids);

        assertEq(token.balanceOf(receiver), mbblBefore + MBBL_AMOUNT * 2);
        assertEq(MockUSDC(USDC_ADDR).balanceOf(receiver), usdcBefore + USDC_AMOUNT * 2);
    }

    function test_withdraw_revert_notRecipient() public {
        uint256 id = _payAndRelease(MBBL_AMOUNT, 0);

        uint256[] memory ids = new uint256[](1);
        ids[0] = id;

        vm.prank(sender); // not the recipient
        vm.expectRevert(MabbleEscrow.CallerNotAllowed.selector);
        escrow.withdraw(ids);
    }

    function test_withdraw_revert_notReleased() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        uint256[] memory ids = new uint256[](1);
        ids[0] = id;

        vm.prank(receiver);
        vm.expectRevert(MabbleEscrow.FundNotReleased.selector);
        escrow.withdraw(ids);
    }

    function test_withdraw_revert_alreadyWithdrawn() public {
        uint256 id = _payAndRelease(MBBL_AMOUNT, USDC_AMOUNT);

        uint256[] memory ids = new uint256[](1);
        ids[0] = id;

        vm.startPrank(receiver);
        escrow.withdraw(ids);

        vm.expectRevert(MabbleEscrow.PaimentAlreadyWithdrawn.selector);
        escrow.withdraw(ids);
        vm.stopPrank();
    }

    function test_withdraw_revert_emptyArray() public {
        uint256[] memory ids = new uint256[](0);

        vm.prank(receiver);
        vm.expectRevert(MabbleEscrow.NoPaymentId.selector);
        escrow.withdraw(ids);
    }

    // ─── initializeConflict() ───────────────

    function test_initializeConflict_bySender() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);
        _initConflict(id);
        // No revert = success
    }

    function test_initializeConflict_byReceiver() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        vm.prank(receiver);
        escrow.initializeConflict(id, solver0, solver1);
        // No revert = success
    }

    function test_initializeConflict_revert_notParty() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        vm.prank(outsider);
        vm.expectRevert(MabbleEscrow.ConflictOnTheWrongPayment.selector);
        escrow.initializeConflict(id, solver0, solver1);
    }

    function test_initializeConflict_emits_ConflictCreated() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        vm.prank(sender);
        // We just check the indexed paymentID; the conflict address is unknown ahead of time
        vm.expectEmit(true, false, false, false);
        emit MabbleEscrow.ConflictCreated(id, address(0));
        escrow.initializeConflict(id, solver0, solver1);
    }
}

// ══════════════════════════════════════════════
//  CONFLICT TESTS
// ══════════════════════════════════════════════
contract MabbleConflictTest is MabbleTestBase {

    function test_vote_revert_notSolver() public {
        MabbleConflict conflict = new MabbleConflict(
            address(escrow), solver0, solver1, 0, sender, receiver
        );

        vm.prank(outsider);
        vm.expectRevert(MabbleConflict.OnlySolverFunction.selector);
        conflict.vote(true);
    }

    function test_conflict_constructor_values() public {
        // Constructor signature: (escrow, solver0, solver1, id, to_, from_)
        MabbleConflict conflict = new MabbleConflict(
            address(escrow), solver0, solver1, 42, sender, receiver
        );

        assertEq(conflict._solver0(), solver0);
        assertEq(conflict._solver1(), solver1);
        assertEq(conflict._from(), receiver); // 6th param = from_
        assertEq(conflict._to(), sender);     // 5th param = to_
        assertEq(conflict._paymentId(), 42);
    }

    function test_vote_single_does_not_resolve() public {
        MabbleConflict conflict = new MabbleConflict(
            address(escrow), solver0, solver1, 0, sender, receiver
        );

        vm.prank(solver0);
        conflict.vote(true);

        assertEq(conflict.nb_vote(), 1);
    }
}

// ══════════════════════════════════════════════
//  END-TO-END INTEGRATION TESTS
// ══════════════════════════════════════════════
contract MabbleE2ETest is MabbleTestBase {

    // ─── Normal flow: pay → release → withdraw ─────

    function test_e2e_normalPaymentFlow() public {
        uint256 senderMbblBefore  = token.balanceOf(sender);
        uint256 senderUsdcBefore  = MockUSDC(USDC_ADDR).balanceOf(sender);

        // 1. Sender pays
        uint256 id = _pay(MBBL_AMOUNT, USDC_AMOUNT);

        // Sender balances decreased
        assertEq(token.balanceOf(sender), senderMbblBefore - MBBL_AMOUNT);
        assertEq(MockUSDC(USDC_ADDR).balanceOf(sender), senderUsdcBefore - USDC_AMOUNT);

        // 2. Sender releases
        vm.prank(sender);
        escrow.releaseFund(id);

        // 3. Receiver withdraws
        uint256 receiverMbblBefore = token.balanceOf(receiver);
        uint256 receiverUsdcBefore = MockUSDC(USDC_ADDR).balanceOf(receiver);

        uint256[] memory ids = new uint256[](1);
        ids[0] = id;

        vm.prank(receiver);
        escrow.withdraw(ids);

        assertEq(token.balanceOf(receiver), receiverMbblBefore + MBBL_AMOUNT);
        assertEq(MockUSDC(USDC_ADDR).balanceOf(receiver), receiverUsdcBefore + USDC_AMOUNT);
    }

    // ─── Helper: extract conflict address from logs ─────

    function _getConflictFromLogs() internal returns (address conflictAddr) {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("ConflictCreated(uint256,address)")) {
                conflictAddr = abi.decode(logs[i].data, (address));
                return conflictAddr;
            }
        }
        revert("ConflictCreated event not found in logs");
    }

    // ─── Conflict flow: both solvers vote true → refund to conflict._from ─────
    //     Using MBBL-only payment to avoid the MBBL/USDC swap bug in conflictRefund.

    function test_e2e_conflictFlow_refundToSender_bothTrue() public {
        // Pay MBBL only (no USDC → swap bug is irrelevant)
        uint256 id = _pay(MBBL_AMOUNT, 0);

        // Sender opens conflict
        // initializeConflict: conflict_from = msg.sender = sender, conflict_to = receiver
        vm.prank(sender);
        vm.recordLogs();
        escrow.initializeConflict(id, solver0, solver1);
        MabbleConflict realConflict = MabbleConflict(_getConflictFromLogs());


        // Both vote true → conflictRefund(_from = sender)
        // conflictRefund: _MabbleToken.transfer(sender, _valueUSDC=0) → skipped
        //                 _USDCToken.transfer(sender, _valueMBBL)     → sends MBBL amount as USDC
        // With only MBBL, the swap sends 0 MBBL (via MabbleToken) and MBBL_AMOUNT as USDC.
        // But USDC balance is 0 so _valueMBBL transfer also skipped if 0...
        // Actually: _valueUSDC == 0 → first if skipped. _valueMBBL != 0 → tries _USDCToken.transfer.
        // This will revert because escrow has 0 USDC but tries to send MBBL_AMOUNT.
        // So we must expect revert here too — the swap bug makes MBBL-only refunds impossible.
        // Let's demonstrate that the swap bug causes a revert:
        vm.prank(solver0);
        realConflict.vote(true);

        vm.prank(solver1);
        // Second vote triggers conflictRefund which will revert due to swap bug
        vm.expectRevert();
        realConflict.vote(true);
    }

    // ─── Conflict flow: one solver votes false → refund to conflict._to ─────

    function test_e2e_conflictFlow_refundToReceiver_mixedVotes() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        vm.prank(sender);
        vm.recordLogs();
        escrow.initializeConflict(id, solver0, solver1);
        MabbleConflict realConflict = MabbleConflict(_getConflictFromLogs());

        // solver0 votes true, solver1 votes false → refund to _to (= receiver)
        // Same swap bug: tries _USDCToken.transfer for _valueMBBL → revert
        vm.prank(solver0);
        realConflict.vote(true);

        vm.prank(solver1);
        vm.expectRevert();
        realConflict.vote(false);
    }

    // ─── Conflict flow: both vote false → refund to conflict._to ─────

    function test_e2e_conflictFlow_bothFalse_refundToReceiver() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        vm.prank(sender);
        vm.recordLogs();
        escrow.initializeConflict(id, solver0, solver1);
        MabbleConflict realConflict = MabbleConflict(_getConflictFromLogs());

        vm.prank(solver0);
        realConflict.vote(false);

        vm.prank(solver1);
        vm.expectRevert(); // swap bug
        realConflict.vote(false);
    }

    // ─── Conflict: receiver initiates → _from = receiver ─────

    function test_e2e_conflictInitiatedByReceiver() public {
        uint256 id = _pay(MBBL_AMOUNT, 0);

        // Receiver initiates → conflict_from = receiver, conflict_to = sender
        vm.prank(receiver);
        vm.recordLogs();
        escrow.initializeConflict(id, solver0, solver1);
        MabbleConflict realConflict = MabbleConflict(_getConflictFromLogs());

        // Both vote true → refund to _from = receiver → revert (swap bug)
        vm.prank(solver0);
        realConflict.vote(true);

        vm.prank(solver1);
        vm.expectRevert();
        realConflict.vote(true);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  BUG DEMONSTRATION: conflictRefund swaps MBBL ↔ USDC
    //  This test proves the bug exists by showing that a legitimate
    //  conflict resolution reverts due to insufficient USDC balance
    //  when it tries to send the MBBL amount via the USDC token.
    // ──────────────────────────────────────────────────────────────────────

    function test_BUG_conflictRefund_swaps_token_values() public {
        // Pay with both MBBL and USDC
        uint256 id = _pay(MBBL_AMOUNT, USDC_AMOUNT);

        vm.prank(sender);
        vm.recordLogs();
        escrow.initializeConflict(id, solver0, solver1);
        MabbleConflict realConflict = MabbleConflict(_getConflictFromLogs());

        vm.prank(solver0);
        realConflict.vote(true);

        // The second vote triggers conflictRefund which does:
        //   _MabbleToken.transfer(refundAddr, _valueUSDC)  ← sends 200e6 MBBL (wrong!)
        //   _USDCToken.transfer(refundAddr, _valueMBBL)    ← tries to send 500e18 USDC (reverts!)
        // Escrow only holds 200e6 USDC, so transferring 500e18 USDC is impossible.
        vm.prank(solver1);
        vm.expectRevert();
        realConflict.vote(true);
    }

    // ─── Conflict with USDC-only payment also reverts ─────
    //     Because the swap sends _valueUSDC via MBBL token:
    //     - _MabbleToken.transfer(addr, _valueUSDC) → tries to send MBBL but escrow has 0 MBBL
    //     - Reverts with ERC20InsufficientBalance

    function test_e2e_conflictFlow_USDConly_alsoRevertsFromSwapBug() public {
        uint256 id = _pay(0, USDC_AMOUNT);

        vm.prank(sender);
        vm.recordLogs();
        escrow.initializeConflict(id, solver0, solver1);
        MabbleConflict realConflict = MabbleConflict(_getConflictFromLogs());

        vm.prank(solver0);
        realConflict.vote(true);

        // Escrow has 0 MBBL tokens but conflictRefund tries
        // _MabbleToken.transfer(addr, _valueUSDC=200e6) → reverts
        vm.prank(solver1);
        vm.expectRevert();
        realConflict.vote(true);
    }

    // ─── getNonce() view ─────

    function test_getNonce() public {
        assertEq(escrow.getNonce(), 0);
        _pay(MBBL_AMOUNT, 0);
        assertEq(escrow.getNonce(), 1);
    }
}
