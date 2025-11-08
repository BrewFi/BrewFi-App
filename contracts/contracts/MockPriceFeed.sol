// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Price feed interface (compatible with Chainlink AggregatorV3Interface)
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    
    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
}

/**
 * @title MockPriceFeed
 * @dev Mock Chainlink price feed for testing purposes
 */
contract MockPriceFeed is AggregatorV3Interface {
    uint8 public override decimals = 8;
    string public override description = "Mock AVAX/USD Price Feed";
    uint256 public override version = 1;
    
    uint80 private _roundId = 1;
    int256 private _price = 20000000000; // $20.00 with 8 decimals
    uint256 private _timestamp = block.timestamp;
    uint80 private _answeredInRound = 1;

    function setPrice(int256 price) external {
        _price = price;
        _roundId++;
        _timestamp = block.timestamp;
        _answeredInRound = _roundId;
    }

    function setPriceWithTimestamp(int256 price, uint256 timestamp) external {
        _price = price;
        _roundId++;
        _timestamp = timestamp;
        _answeredInRound = _roundId;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _price, _timestamp, _timestamp, _answeredInRound);
    }

    function getRoundData(uint80 /* roundIdParam */)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _price, _timestamp, _timestamp, _answeredInRound);
    }
}
