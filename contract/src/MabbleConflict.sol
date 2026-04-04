// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { IMabbleEscrow } from "../interface/IMabbleEscrow.sol";

contract MabbleConflict {

    address public immutable _solver0;
    address public immutable _solver1;
    address public immutable _from;
    address public immutable _to;
    bool private _vote_solver1;
    bool private _vote_solver0;
    uint256 public immutable _paymentId;
    uint256 public nb_vote;
    IMabbleEscrow _escrowContract;

    event conflictSolved(
        uint256 indexed _paymentId,
        address _conflictAddress,
        address _solver0,
        address _solver1
    );

    error OnlySolverFunction();

    constructor(
		address escrowContractAddress,
        address solver0_,
        address solver1_,
        uint256 iD,
        address to_,
        address from_
    ) {
        _solver0 = solver0_;
        _solver1 = solver1_;
        _paymentId = iD;
        _from = from_;
        _to = to_;
        _escrowContract = IMabbleEscrow(escrowContractAddress);
    }

    function vote(bool state_) external solverOnly
	{
        nb_vote += 1;
        if (msg.sender == _solver0) 
			_vote_solver0 = state_;
        if (msg.sender == _solver1) 
			_vote_solver1 = state_;
        if (nb_vote == 2 && _vote_solver0 == true && _vote_solver1 == true) 
		{
            _escrowContract.conflictRefund(_paymentId, _from);
            emit conflictSolved(_paymentId, address(this), _solver0, _solver1);
        } 
		else if (nb_vote == 2)
		{
            _escrowContract.conflictRefund(_paymentId, _to);
            emit conflictSolved(_paymentId, address(this), _solver0, _solver1);
        }
    }

    modifier solverOnly() {
        if (msg.sender != _solver0 && msg.sender != _solver1)
            revert OnlySolverFunction();
        _;
    }
}
