// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract MabbleConflict {
    address public immutable _solver0;
    address public immutable _solver1;
    bool public _state;
    uint256 public immutable _paymentId;
    uint256 public nb_vote;

    event conflictSolved(
        address indexed _paymentId,
        address _solver0,
        address _solver1
    );

    error OnlySolverFunction();

    constructor(address solver0_, address solver1_, uint256 iD) {
        _solver0 = solver0_;
        _solver1 = solver1_;
        _paymentId = iD;
        _state = false;
    }

    function vote(bool state_) external solverOnly {
        _state = state_;
        nb_vote++;
        //if ( nb_vote == 2 )
        // release fund
    }

    modifier solverOnly() {
        if (msg.sender != _solver0 && msg.sender != _solver1)
            revert OnlySolverFunction();
        _;
    }
}
