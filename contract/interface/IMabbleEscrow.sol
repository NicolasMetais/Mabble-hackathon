// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract IMabbleEscrow{

	function releaseFund( uint256 paymentId ) external;
	function conflictRefund(uint256 paymenId, address refundAdress);


}