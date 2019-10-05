/*

NumberBetManager
v 1.0.0

http://www.crytogachapon.com

Copyright © 2019 S.H. LEE <windmill131@naver.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See the COPYING file for more details.

*/

pragma solidity ^0.5.6;

/// @title Basic operational actions
/// @notice You can use this contract for only the most basic simulation
/// @dev All function calls are currently implemented without side effects
contract OperationalControl {

	// Holds a position of authority to execute operational actions
    address payable public operator;

	// If true, major operational actions are blocked
    bool public isPaused;

	/// @dev Emited when contract variable is changed
    event OptionChanged(address operator);

    /// @dev Operation modifiers for restricted access
	modifier onlyOperator() {
		require(msg.sender == operator);
		_;
	}

    /// @dev Change operator address by previous operator
	function changeOperator(address payable _newOperator) public onlyOperator {
		operator = _newOperator;
		emit OptionChanged(msg.sender);
	}

    /// @dev Stops the availability of contract actions
	function pauseContract() public onlyOperator {
		isPaused = true;
		emit OptionChanged(msg.sender);
	}

    /// @dev Resumes the availability of contract actions
	function unpauseContract() public onlyOperator {
		isPaused = false;
		emit OptionChanged(msg.sender);
	}

	/// @notice Any kinds of donation is welcome
	function() external payable {}

    /// @dev Pleasure of mine
	function withdraw(uint256 _amount) public onlyOperator {
		require(address(this).balance >= _amount);
		operator.transfer(_amount);
		emit OptionChanged(msg.sender);
	}

    /// @dev Just in case
	function kill() public onlyOperator {
		selfdestruct(operator);
	}
}

/*

ORACLIZE_API

Copyright (c) 2015-2016 Oraclize SRL
Copyright (c) 2016 Oraclize LTD

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
contract usingOraclize {

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

	function strConcat(string memory _a, string memory _b) internal pure returns (string memory _concatenatedString) {
        return strConcat(_a, _b, "", "", "");
    }

    function strConcat(
		string memory _a,
		string memory _b,
		string memory _c,
		string memory _d,
		string memory _e
		) internal pure returns (string memory _concatenatedString) {
        bytes memory _ba = bytes(_a);
        bytes memory _bb = bytes(_b);
        bytes memory _bc = bytes(_c);
        bytes memory _bd = bytes(_d);
        bytes memory _be = bytes(_e);
        string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
        bytes memory babcde = bytes(abcde);
        uint k = 0;
        uint i = 0;
        for (i = 0; i < _ba.length; i++) {
            babcde[k++] = _ba[i];
        }
        for (i = 0; i < _bb.length; i++) {
            babcde[k++] = _bb[i];
        }
        for (i = 0; i < _bc.length; i++) {
            babcde[k++] = _bc[i];
        }
        for (i = 0; i < _bd.length; i++) {
            babcde[k++] = _bd[i];
        }
        for (i = 0; i < _be.length; i++) {
            babcde[k++] = _be[i];
        }
        return string(babcde);
    }
}

/// @title A managing contract for guessing number bet
/// @notice Make and take bet for transfering the ownership
/// @dev All function calls are currently implemented without side effects
contract NumberBetManager is OperationalControl, usingOraclize {

	// Maximum number of table
	uint256 public maxTable;
	// Maximum number of case
	uint256 public maxCase;
	/// @dev In percentage
	uint256 public feeRate;

	/// @dev Table index with bet maker's and taker's information
	struct Table {
		// Address of the maker
		address payable maker;
		// Deposit of the bet which can be lost by losing bet
        uint256 deposit;
		// Hashed number given by the maker
        bytes32 hashedNum;
		// Allowed time for maker to show real number not to lose his deposit
		// This value is given by maker and long duration costs higher fee
		uint256 allowedTime;

		// Address of the taker
		address payable taker;
		// Taker's payment
        uint256 payment;
		// Guessed number given by the taker
        uint256 guessedNum;
		// The time that taker takes
        uint256 takingTime;
    }

	/// @notice House has many tables
	/// @dev Table index with maker and taker informations
    mapping (uint256 => Table) public tables;

	/// @dev Emited when table variable is changed
    event TableChanged(uint256 tableIndex);

	/// @dev Emited when contract sends eth out
    event SendEth(address payable sendTo, uint256 amountTo);

	/// @dev Comparison result event for verification purpose
	event revealNum(bytes32 hashedNum, string realNumStr, string strToHash, bytes32 realHashedNum);

	/// @dev Manager receives fee in some cases
    event receiveFee(uint256 amount);

	/// @dev Creates a reference to GachaTicket contract
	constructor(uint256 _maxTable, uint256 _maxCase, uint256 _feeRate) public {

		// OperationalControl
		operator = msg.sender;
		isPaused = false;

		// NumberBetManager
		maxTable = _maxTable;
		maxCase = _maxCase;
		feeRate = _feeRate;
	}

	/// @notice Maker can maker the bet by paying deposit
	/// @dev Maker's information is added to the struct
    /// @param _tableIndex Shows the table position
    /// @param _hashedNum Hash(sha256): Number + salt
    /// @param _allowedTime In seconds
	function makeBet(
		uint256 _tableIndex,
		bytes32 _hashedNum,
		uint256 _allowedTime
		) public payable {

		// Check that contract is not paused
		require(!isPaused);
		// Check table index is less than maximum number
		require(_tableIndex < maxTable);
		// Check that selected table is available for making a bet
		require(tables[_tableIndex].maker == address(0) && tables[_tableIndex].taker == address(0));
		// Requires minimum bet of 0.001 ETH
		require(msg.value >= 1000000000000000);
		// Exact amount is nedded for taker's to pay
		require(msg.value % maxCase == 0);
		// Minumum waiting of 2 min and maximum of 1 hr for taker to unearn the bet
		require(120 <= _allowedTime && _allowedTime <= 3600);

		Table storage table = tables[_tableIndex];
		table.maker = msg.sender;
		table.deposit = msg.value;
		table.hashedNum = _hashedNum;
		table.allowedTime = _allowedTime;

		emit TableChanged(_tableIndex);
	}

	/// @notice Taker can join the bet by paying specified amount
	/// @dev Taker's information is added to the struct
    /// @param _tableIndex Shows the table position
    /// @param _guessedNum Taker's guessed number to the maker's real number
	function takeBet(
		uint256 _tableIndex,
		uint256 _guessedNum
		) public payable {

		// Check that contract is not paused
		require(!isPaused);
		// Check table index is less than maximum number
		require(_tableIndex < maxTable);
		// Check that selected table is available for making a bet
		require(tables[_tableIndex].maker != address(0) && tables[_tableIndex].taker == address(0));
		// Check that taker pays properly
		require(tables[_tableIndex].deposit == msg.value * maxCase);

		Table storage table = tables[_tableIndex];
		table.taker = msg.sender;
		table.payment = msg.value;
		table.guessedNum = _guessedNum;
		table.takingTime = now;

		emit TableChanged(_tableIndex);
	}

	/// @notice Maker can finalize the bet by submitting the real number
	/// @dev Verifies maker's submitted number by hashing
    /// @param _tableIndex Shows the table position
    /// @param _realNum Taker's real number
    /// @param _saltWord Salt word to hash the real number
	function finalizeBet(
		uint256 _tableIndex,
		uint256 _realNum,
		string memory _saltWord
		) public {

		// Check that contract is not paused
		require(!isPaused);
		// Check table index is less than maximum number
		require(_tableIndex < maxTable);
		// Maker can only send real number
		require(msg.sender == tables[_tableIndex].maker);
		// Check that selected table is available for making a bet
		require(tables[_tableIndex].maker != address(0) && tables[_tableIndex].taker != address(0));
		// Check table index is less than maximum number
		require(_realNum < maxCase);

		string memory realNumStr = uint2str(_realNum);
		string memory strToHash = strConcat(realNumStr, _saltWord);
		bytes32 realHashedNum = sha256(bytes(strToHash));

		emit revealNum(tables[_tableIndex].hashedNum, realNumStr, strToHash, realHashedNum);

		// Verify submitted real number is same as previously submitted hashed number
		//hashedNum = crypto.createHash(‘sha256’).update(Num + Salt).digest(‘hex’)
		require(tables[_tableIndex].hashedNum == realHashedNum);

		if (_realNum == tables[_tableIndex].guessedNum) {
			// Case: taker win (taker guessed it right)
			address payable addressToSend = tables[_tableIndex].taker;
			uint256 amountToSend = tables[_tableIndex].deposit;

			address payable addressToRefund = tables[_tableIndex].maker;
			uint256 amountToRefund = tables[_tableIndex].payment;

			delete tables[_tableIndex];

			emit SendEth(addressToSend, amountToSend);
			addressToSend.transfer(amountToSend);
			emit SendEth(addressToRefund, amountToRefund);
			addressToRefund.transfer(amountToRefund);
		} else {
			// Case: maker win
			address payable addressToSend = tables[_tableIndex].maker;
			uint256 amountToSend = tables[_tableIndex].deposit + tables[_tableIndex].payment;

			delete tables[_tableIndex];

			emit SendEth(addressToSend, amountToSend);
			addressToSend.transfer(amountToSend);
		}

		emit TableChanged(_tableIndex);
	}

	/// @notice Taker can redeem the bet regardless of maker's appearance but it cost
	/// @dev Taker can only redeem the bet after a period of time set by maker
    /// @param _tableIndex Shows the table position
	function unearnedBet(uint256 _tableIndex) public {

		// Check that contract is not paused
		require(!isPaused);
		// Check table index is less than maximum number
		require(_tableIndex < maxTable);
		// Taker can only execute this function
		require(msg.sender == tables[_tableIndex].taker);
		// Check that selected table is available for making a bet
		require(tables[_tableIndex].maker != address(0) && tables[_tableIndex].taker != address(0));
		// Check that taker pays properly
		require(now > tables[_tableIndex].takingTime + tables[_tableIndex].allowedTime);

		address payable addressToSend = tables[_tableIndex].taker;
      	uint256 feeToManager = tables[_tableIndex].deposit * feeRate / 100;

		uint256 amountToSend = tables[_tableIndex].deposit - feeToManager;

		address payable addressToRefund = tables[_tableIndex].maker;
		uint256 amountToRefund = tables[_tableIndex].payment;

		delete tables[_tableIndex];

		emit receiveFee(feeToManager);

		emit SendEth(addressToSend, amountToSend);
		addressToSend.transfer(amountToSend);

		emit SendEth(addressToRefund, amountToRefund);
		addressToRefund.transfer(amountToRefund);

		emit TableChanged(_tableIndex);
	}

	/// @notice Maker can cancel the bet if there is no taker
	/// @dev Resets the table status permanently
    /// @param _tableIndex Shows the table position
	function cancelBet(uint256 _tableIndex) public {

		// Check that contract is not paused
		require(!isPaused);
		// Check table index is less than maximum number
		require(_tableIndex < maxTable);
		// Maker can only send real number
		require(msg.sender == tables[_tableIndex].maker);
		// Check that selected table is available for canceling a bet
		require(tables[_tableIndex].taker == address(0));

		address payable makerAddress = tables[_tableIndex].maker;
		uint256 makerAmount = tables[_tableIndex].deposit;

		delete tables[_tableIndex];

		emit SendEth(makerAddress, makerAmount);
		makerAddress.transfer(makerAmount);

		emit TableChanged(_tableIndex);
	}

	/// @notice In case table is stucked by anonymous reason
	/// @dev Resets the table status permanently
    /// @param _tableIndex Shows the table position
	function resetTable(uint256 _tableIndex) public onlyOperator {

		// Check that contract is paused
		require(isPaused);

		address payable makerAddress = tables[_tableIndex].maker;
		uint256 makerAmount = tables[_tableIndex].deposit;

		address payable takerAddress = tables[_tableIndex].taker;
		uint256 takerAmount = tables[_tableIndex].payment;

		delete tables[_tableIndex];

		if (makerAmount != 0) {
			emit SendEth(makerAddress, makerAmount);
			makerAddress.transfer(makerAmount);
		}

		if (takerAmount != 0) {
			emit SendEth(takerAddress, takerAmount);
			takerAddress.transfer(takerAmount);
		}

		emit TableChanged(_tableIndex);
	}

	/// @dev Changes maximum number of tables
	function changeMaxTable(uint256 _maxTable) public onlyOperator {
		// Check that contract is paused
		require(isPaused);

		maxTable = _maxTable;
		emit OptionChanged(msg.sender);
	}

	/// @dev Changes maximum number of cases
	function changeMaxCase(uint256 _maxCase) public onlyOperator {
		// Check that contract is paused
		require(isPaused);

		maxCase = _maxCase;
		emit OptionChanged(msg.sender);
	}

	/// @dev Changes fee rate in percentage
	function changeFeeRate(uint256 _feeRate) public onlyOperator {
		// Check that contract is paused
		require(isPaused);

		feeRate = _feeRate;
		emit OptionChanged(msg.sender);
	}

    function getCurrentEth() public view returns (uint256 _balance) {
		return address(this).balance;
	}
}
