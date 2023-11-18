import Web3 from "web3";
import ERC20_ABI from "../lib/erc20.abi.json";
import { useMemo } from "react";
import { test } from "../lib/network";

export interface MetaMaskInterface {
  isInstalled: boolean;
  chain: MetaMaskChainInterface;
  verifyAccount: (accounts: string[]) => string | undefined;
  requestAccount: () => Promise<string | undefined>;
  requestChain: () => Promise<number | undefined>;
  requestChangeToChain: (chain?: number) => Promise<void>;
  requestAddChainId: () => Promise<void>;
  addContract: (address: string) => Promise<boolean>;
}

interface MetaMaskError {
  code: number;
  message: string;
}

export interface MetaMaskChainInterface {
  chainId: number;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export function useMetaMask(): MetaMaskInterface {
  const { ethereum } = window as any;
  const web3 = new Web3(Web3.givenProvider);

  const isInstalled = Boolean(ethereum && ethereum.isMetaMask);

  async function requestAccount(): Promise<string | undefined> {
    return verifyAccount(await web3.eth.requestAccounts());
  }

  async function requestChain(): Promise<number | undefined> {
    return await web3.eth.getChainId();
  }

  async function requestChangeToChain(id?: number): Promise<void> {
    if (!id) return;
    const chainId = web3.utils.toHex(id);
    return new Promise((resolve, reject) => {
      ethereum
        .sendAsync(
          {
            method: "wallet_switchEthereumChain",
            params: [{ chainId }],
          },
          (e?: MetaMaskError) => {
            requestAddChainId();
            reject(`could not switch: ${e?.message}`);
          }
        )
        ?.then(resolve);
    });
  }

  async function requestAddChainId(): Promise<void> {
    const obj = toChainObject();
    return ethereum.sendAsync({
      method: "wallet_addEthereumChain",
      params: [{ ...obj, chainId: web3.utils.toHex(obj.chainId) }],
    });
  }

  async function addContract(address: string): Promise<boolean> {
    const tokenContract = new web3.eth.Contract(ERC20_ABI as any, address);

    const symbol = await tokenContract.methods.symbol().call();
    const decimals = await tokenContract.methods.decimals().call();

    return ethereum.sendAsync({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address,
          symbol,
          decimals,
        },
      },
      id: Math.round(Math.random() * 10000),
    });
  }

  function verifyAccount(accounts: string[]): string | undefined {
    if ((accounts?.length ?? 0) <= 0) return undefined;
    // check if address is valid
    return Web3.utils.toChecksumAddress(accounts[0]);
  }

  function toChainObject(): MetaMaskChainInterface {
    return test;
  }

  return useMemo(
    () => ({
      isInstalled,
      chain: test,
      verifyAccount,
      requestAccount,
      requestChain,
      requestChangeToChain,
      requestAddChainId,
      addContract,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isInstalled]
  );
}
