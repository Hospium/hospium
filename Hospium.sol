// SPDX-License-Identifier: MIT
pragma solidity >=0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface Vanilla {
    function addLiquidity(
            address tokenA,
            address tokenB,
            uint amountADesired,
            uint amountBDesired,
            uint amountAMin,
            uint amountBMin,
            address to,
            uint deadline
        ) external returns (uint amountA, uint amountB, uint liquidity);
    function swapExactTokensForTokens(uint256 amount, uint256 minResult, 
                                      address[] memory tokens, address to, uint256 deadline) external returns (uint[] memory amounts);
    
}

contract Coin is ERC20 {
    constructor(string memory _name, string memory _symbol, uint256 _init) ERC20(_name, _symbol) {
        _mint(msg.sender, _init * (10**18));
    }
}

contract Hospium {

    Vanilla dex;
    ERC20 public token;
    ERC20 public inputToken;

    uint256 public burnedInput;
    uint256 public inputToLP;
    uint256 public swappedInput;

    uint private constant MAX_SUPPLY= 8_000_000;
    uint private constant LP_FACTOR= 3;
    
    uint private constant MAX_PRICE= 50;
    uint private constant START_PRICE= 1;

    uint private constant MAX_SWAP_IN= 10_000;
    uint private constant NO_SLIPAGE_THRESHOLD= 100;

    constructor(Vanilla _dex,string memory name, string memory symbol,address allowedTradeIn) {
        dex= _dex;
        token= new Coin(name,symbol,MAX_SUPPLY); 
        inputToken= ERC20(allowedTradeIn);
        burnedInput= 0;
        inputToLP= 0;
    }

    function remainingSupply() public view returns (uint256 supply) {
        supply= token.balanceOf(address(this));
    }

    function tokensForInput(uint256 input) public view returns (uint256 output) {
        require(input < MAX_SWAP_IN*(1e18), "swap in is limited");
        uint256 total= token.totalSupply();
        uint256 distributed= total - token.balanceOf(address(this));
        //uint256 basePrice= START_PRICE + (MAX_PRICE-START_PRICE)*(distributed/total);
        //baseOutput= input/basePrice
        uint256 baseOutput= (input*total)/(START_PRICE*total + (MAX_PRICE-START_PRICE)*distributed);
        if(input < NO_SLIPAGE_THRESHOLD*(1e18)) {
            output= baseOutput;
        } else {
            uint256 slipageOutput= (input*total)/(START_PRICE*total + (MAX_PRICE-START_PRICE)*(distributed+baseOutput));
            output= (baseOutput+slipageOutput)/2;
        }
    }

    function getToken(uint256 input) external {
        inputToken.transferFrom(msg.sender, address(this), input);
        uint256 output= tokensForInput(input); 

        uint256 outputForLP= output/LP_FACTOR;
        uint256 wantedInputForLP= input/LP_FACTOR;

        //send coins to user
        token.transfer(msg.sender, output);

        //add liquidity
        inputToken.approve(address(dex), wantedInputForLP);
        token.approve(address(dex),outputForLP);
        (uint256 amountA, , ) = dex.addLiquidity(address(inputToken),address(token),
                                                                        wantedInputForLP,outputForLP,0,0,
                                                                        address(this),block.timestamp+360000);
        inputToLP += amountA;

        uint256 burn= input-wantedInputForLP;
        inputToken.transfer(address(inputToken),burn); //sending to token Token address is as good as burned.
        burnedInput += burn;

        uint256 swap= wantedInputForLP - amountA; //if pool is below current SC price -> swap rest to "buy back" coin.
        if(swap > 0) {
            swappedInput += swap;
            inputToken.approve(address(dex),swap);
            address[] memory path = new address[](2);
            path[0]=address(inputToken);
            path[1]=address(token);
            dex.swapExactTokensForTokens(swap, 0, path, msg.sender, block.timestamp+36000);
        }
    }
}

