// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IMabbleToken is IERC20 {

	function burn( address account, uint256 value ) external;
	
	function mint( address account, uint256 value ) external;

}

