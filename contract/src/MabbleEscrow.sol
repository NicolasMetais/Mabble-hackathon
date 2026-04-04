// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import { IMabbleToken } from "../interface/IMabbleToken.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MabbleConflict } from "./MabbleConflict.sol";

contract MabbleEscrow {

	struct  Payment
	{
		address				_to;
		address				_from;
		uint256				_valueMBBL;
		uint256				_valueUSDC;
		uint256				_paymentId;
		uint256				_releaseTimestamp;
		bool				_isWithdrawn;
		bool				_isApproved;
		MabbleConflict		 conflict;
	}

	uint256						public	_nonce;
	IMabbleToken				public	_MabbleToken;
	IERC20						public	_USDCToken;
	mapping(uint256 => Payment) private	_inProgressPayment;
	mapping(address => uint256) public	balanceMBBL;
	mapping(address => uint256) public	balanceUSDC;

	event	PaymentCreated(
	
		uint256 indexed paymentID,
		address indexed to,
		address indexed from,
		uint256 amountMBBL,
		uint256 amountUSDC,
		uint256 releaseTimestamp
	);

	event	Withdraw(

		uint256 indexed paymentID,
		address indexed to,
		uint256 amountMBBL,
		uint256 amountUSDC,
		uint256 releaseTimestamp,
		address indexed refundTo
	);

	event	ConflictCreated(

		uint256	indexed paymentID,
		address _conflictAddress
	);

	event	ReleaseFund(
		
		uint256	indexed paymentID
	);

	error CallerNotAllowed();
	error FundNotReleased();
	error PaimentAlreadyWithdrawn();
	error PaimentDispute();
	error PaimentAlreadyApproved();
	error ConflictOnTheWrongPayment();
	error NoPaymentId();
	error PaymentIsInConflict();

	constructor( address MBBLTokenAdress )
	{
		_USDCToken = IERC20( 0x3600000000000000000000000000000000000000 );
		_MabbleToken = IMabbleToken( MBBLTokenAdress );
	}

	function initializeConflict( uint256 paymentId, address solver0_, address solver1_) external
	{
		Payment storage payment = _inProgressPayment[ paymentId ];		
		if ( msg.sender != payment._to &&  msg.sender != payment._from )
			revert ConflictOnTheWrongPayment();
		address conflict_from = msg.sender;
		address conflict_to;
		if (conflict_from == payment._from )
			conflict_to = payment._to;
		else 
			conflict_to = payment._from;
		payment.conflict = new MabbleConflict( address(this), solver0_, solver1_, paymentId, conflict_from, conflict_to );
		emit ConflictCreated( paymentId, address(payment.conflict) );
	}

	function getNonce() public view returns ( uint256 )
	{
		return ( _nonce );
	}

	function burnMabbleToken( address account, uint256 value ) internal
	{
		_MabbleToken.burn( account, value );
	}

	function conflictRefund( uint256 paymenId, address refundAdress ) external
	{
		Payment storage paymentInConflict = _inProgressPayment[paymenId];
		if ( msg.sender != address(paymentInConflict.conflict) )
			revert  CallerNotAllowed();
		if ( paymentInConflict._valueUSDC != 0 )
			_USDCToken.transfer(refundAdress, paymentInConflict._valueUSDC);
		if ( paymentInConflict._valueMBBL != 0 )
			_MabbleToken.transfer(refundAdress, paymentInConflict._valueMBBL);
	}

	function releaseFund( uint256 paymentId ) external
	{
		Payment storage payment = _inProgressPayment[ paymentId ];
		if ( msg.sender != payment._from )
			revert CallerNotAllowed();
		if ( payment._isApproved )
			revert PaimentAlreadyApproved();
		if ( address(payment.conflict) != address(0) )
			revert PaymentIsInConflict();
		payment._isApproved = true;
		emit ReleaseFund( paymentId );
	}

	function pay( address to_, uint256 MBBLvalue_, uint256 USDCvalue_ ) external
	{
		if ( MBBLvalue_ != 0 )
			_MabbleToken.transferFrom( msg.sender, address( this ), MBBLvalue_ );
		if ( USDCvalue_ != 0 )
			_USDCToken.transferFrom( msg.sender, address( this ), USDCvalue_ );
		_inProgressPayment[ _nonce ] = Payment( to_, msg.sender, MBBLvalue_, USDCvalue_, _nonce, block.timestamp, false, false, MabbleConflict(address(0)) );
		balanceMBBL[ to_ ] += MBBLvalue_;
		balanceUSDC[ to_ ] += USDCvalue_;
		emit PaymentCreated( _nonce, to_, msg.sender, MBBLvalue_, USDCvalue_, block.timestamp );
		_nonce += 1;
	}

	function withdraw( uint256[] calldata _paymentId ) external
	{
		uint256 totalAmountUSDC = 0;
		uint256 totalAmountMBBL = 0;

		if ( _paymentId.length == 0 )
			revert NoPaymentId();
		for ( uint256 i = 0; i < _paymentId.length; i++ )
		{
			Payment storage payment = _inProgressPayment [ _paymentId[ i ] ];
			if ( payment._to != msg.sender && msg.sender != address(payment.conflict) )
				revert CallerNotAllowed();
			if ( payment._isWithdrawn )
				revert PaimentAlreadyWithdrawn();
			if ( payment._isApproved == false )
				revert FundNotReleased();
			if ( address(payment.conflict) != address(0) && msg.sender != address(payment.conflict) )
				revert PaymentIsInConflict();
			totalAmountMBBL += payment._valueMBBL;
			totalAmountUSDC += payment._valueUSDC;
			payment._isWithdrawn = true;
		}
		if ( totalAmountMBBL != 0 )
		{
			_MabbleToken.transfer( msg.sender, totalAmountMBBL );		
			balanceMBBL[ msg.sender ] -= totalAmountMBBL;
		}
		if ( totalAmountUSDC != 0 )
		{
			_USDCToken.transfer( msg.sender, totalAmountUSDC );		
			balanceUSDC[ msg.sender ] -= totalAmountUSDC;
		}
		emit Withdraw( _nonce, msg.sender, totalAmountMBBL, totalAmountUSDC, block.timestamp, msg.sender);
	}
}