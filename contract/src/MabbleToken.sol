// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import { IMabbleToken } from "../interface/IMabbleToken.sol";

contract MabbleToken is ERC20, Ownable {

	mapping( address => bool ) private	_whiteList;
	address private						_escrowContract;
	address private						_mintContract;

	error MabbleUnauthorizedBurn( address _from, uint256 _value );
	error MabbleUnauthorizedMint( address _from, uint256 _value );

	constructor() ERC20( "MabbleTokenTest", "MBBLTest" ) Ownable( msg.sender )
	{
		_whiteList[ address(0) ] = true;
		_mintContract = msg.sender;
		_whiteList[ msg.sender ] = true;
	}

	function setPaymentContract( address newContract ) public onlyOwner 
	{
		_escrowContract = newContract;
		_whiteList[ _escrowContract ] = true;
	}

	function setMintContract( address newContract ) public onlyOwner 
	{
		_mintContract = newContract;	
	}

	function setWhiteList( address user_, bool status_) public onlyOwner 
	{
		_whiteList[ user_ ] = status_;
	}

	function getPaymentContract() view public onlyOwner returns ( address ) 
	{
		return ( _escrowContract );
	}

	function getMintContract() view public returns ( address ) 
	{
		return ( _mintContract );
	}

	function getUserWhitelistStatus( address _user ) view public returns ( bool ) 
	{
		return ( _whiteList[ _user ] );
	}

	function burn( address account, uint256 value ) external
	{
		super._burn( account, value );
	}

	function mint( address account, uint256 value ) external
	{
		super._mint( account, value );
	}

	function _update( address from, address to, uint256 value ) internal override 
	{
		require( _whiteList[ from ] == true && _whiteList[ to ] == true, "MabbleToken : Address unauthorized to procede transaction." ) ;
		if ( to == address( 0 ) && msg.sender != _escrowContract )
			revert MabbleUnauthorizedBurn({
				_from : from,
				_value : value
			});
		if ( from == address( 0 ) && msg.sender != _mintContract )
			revert MabbleUnauthorizedMint({
				_from : msg.sender,
				_value : value
			});

		super._update( from, to, value );
	}
}
