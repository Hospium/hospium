import { MetaMaskChainInterface } from "../hooks/metamask.hook";

export const main: MetaMaskChainInterface = {
  chainId: 1130,
  chainName: "MetaChain",
  nativeCurrency: {
    name: "DFI",
    symbol: "DFI",
    decimals: 18,
  },
  rpcUrls: ["https://dmc.mydefichain.com/mainnet"],
  blockExplorerUrls: ["https://mainnet-dmc.mydefichain.com:8441/"],
};
