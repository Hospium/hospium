import { MetaMaskChainInterface } from "../hooks/metamask.hook";

export const test: MetaMaskChainInterface = {
  chainId: 1131,
  chainName: "MetaChain (TestNet)",
  nativeCurrency: {
    name: "DFI",
    symbol: "DFI",
    decimals: 18,
  },
  rpcUrls: ["https://dmc.mydefichain.com/testnet"],
  blockExplorerUrls: ["https://testnet-dmc.mydefichain.com:8444"],
};

// TODO: add testnet and mainnet DMC as soon as ready
