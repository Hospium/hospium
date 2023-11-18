import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMetaMask } from "../hooks/metamask.hook";
import Web3 from "web3";

interface WalletInterface {
  address?: string;
  chain?: number;
  block?: number;
  isInstalled: boolean;
  isConnected: boolean;
  connect: () => Promise<string>;
}

const WalletContext = createContext<WalletInterface>(undefined as any);

export function useWalletContext(): WalletInterface {
  return useContext(WalletContext);
}

export function WalletContextProvider(props: PropsWithChildren): JSX.Element {
  const [address, setAddress] = useState<string>();
  const [chain, setChain] = useState<number>();
  const [block, setBlock] = useState<number>();
  const { isInstalled, verifyAccount, requestAccount, requestChain } =
    useMetaMask();
  const web3 = new Web3(Web3.givenProvider);
  const { ethereum } = window as any;

  const isConnected = address !== undefined;

  useEffect(() => {
    web3.eth.getAccounts((_err, accounts) => {
      setAddress(verifyAccount(accounts));
    });
    web3.eth.getChainId((_err, chainId) => {
      setChain(chainId);
    });
    web3.eth.getBlockNumber((_err, block) => {
      setBlock(block);
    });
    ethereum?.on("accountsChanged", (accounts: string[]) => {
      setAddress(verifyAccount(accounts));
    });
    ethereum?.on("chainChanged", (chainId: string) => {
      setChain(Number(chainId));
      // Following is a recommendation of metamask documentation. I am not sure, if we will need it.
      // Handle the new chain.
      // Correctly handling chain changes can be complicated.
      // We recommend reloading the page unless you have good reason not to.
      // window.location.reload();
    });
    web3.eth.subscribe("newBlockHeaders", (_err, blockHeader) => {
      setBlock(blockHeader.number);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect(): Promise<string> {
    const account = await requestAccount();
    if (!account) throw new Error("Permission denied or account not verified");
    setAddress(account);
    setChain(await requestChain());
    return account;
  }

  const context: WalletInterface = useMemo(
    () => ({
      address,
      chain,
      block,
      isInstalled,
      isConnected,
      connect,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, chain, block, isInstalled, isConnected]
  );

  return (
    <WalletContext.Provider value={context}>
      {props.children}
    </WalletContext.Provider>
  );
}
