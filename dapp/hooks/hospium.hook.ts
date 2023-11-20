import Web3 from "web3";
import HOSPIUM_ABI from "../lib/hospium.abi.json";
import TOKEN_ABI from "../lib/token.abi.json";
import { useWalletContext } from "../contexts/wallet.context";
import { Contract } from "web3-eth-contract";
import { useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";

export interface HospiumInterface {
  reload: () => void;
  remainingSupply?: BigNumber;
  burnedInput?: BigNumber;
  inputToLP?: BigNumber;
  swappedInput?: BigNumber;
  inputTokenAddress?: string;
  outputTokenAddress?: string;
  estimatedReceivedTokens?: BigNumber;
  estimateReceiveTokens: (amount: string) => Promise<void>;
  buyTokens: (amount: string) => Promise<void>;
  isBuying: boolean;
  approvedAmount?: BigNumber;
  approveAmount: (amount: string) => Promise<void>;
  balanceOfInputToken?: BigNumber;
}

export function useHospium(): HospiumInterface {
  const { address, chain, block } = useWalletContext();
  const web3 = new Web3(Web3.givenProvider);
  const hospiumContractAddress = "0x74FA4eb5a2b312E0e877f8B862641639DDB75F65";

  const [remainingSupply, setRemainingSupply] = useState<BigNumber>();
  const [burnedInput, setBurnedInput] = useState<BigNumber>();
  const [inputToLP, setInputToLP] = useState<BigNumber>();
  const [swappedInput, setSwappedInput] = useState<BigNumber>();
  const [inputTokenAddress, setInputTokenAddress] = useState<string>();
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>();
  const [estimatedReceivedTokens, setEstimatedReceivedTokens] =
    useState<BigNumber>();
  const [isBuying, setIsBuying] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState<BigNumber>();
  const [balanceOfInputToken, setBalanceOfInputToken] = useState<BigNumber>();

  function createContract(): Contract {
    return new web3.eth.Contract(HOSPIUM_ABI as any, hospiumContractAddress);
  }

  function errorHandler(e: any) {}

  function reload() {
    getRemainingSupply()
      .then((v) => setRemainingSupply(v))
      .catch(errorHandler);
    getBurnedInput()
      .then((v) => setBurnedInput(v))
      .catch(errorHandler);
    getInputToLP()
      .then((v) => setInputToLP(v))
      .catch(errorHandler);
    getSwappedInput()
      .then((v) => setSwappedInput(v))
      .catch(errorHandler);
    getInputTokenAddress()
      .then((v) => {
        reloadInputTokenData(v);
        return v;
      })
      .then((v) => setInputTokenAddress(v))
      .catch(errorHandler);
    getOutputTokenAddress()
      .then((v) => setOutputTokenAddress(v))
      .catch(errorHandler);
  }

  function reloadInputTokenData(tokenAddress?: string) {
    getApprovedAmount(tokenAddress)
      .then((v) => setApprovedAmount(v))
      .catch(errorHandler);
    getBalanceOfInputToken(tokenAddress)
      .then((v) => setBalanceOfInputToken(v))
      .catch(errorHandler);
  }

  useEffect(() => {
    reload();
  }, [address, chain, block]);

  useEffect(() => {
    reloadInputTokenData();
  }, [address]);

  async function getRemainingSupply(): Promise<BigNumber> {
    return new BigNumber(
      web3.utils.fromWei(
        await createContract().methods.remainingSupply().call(),
        "ether"
      )
    );
  }

  async function getBurnedInput(): Promise<BigNumber> {
    return new BigNumber(
      web3.utils.fromWei(
        await createContract().methods.burnedInput().call(),
        "ether"
      )
    );
  }

  async function getInputToLP(): Promise<BigNumber> {
    return new BigNumber(
      web3.utils.fromWei(
        await createContract().methods.inputToLP().call(),
        "ether"
      )
    );
  }

  async function getSwappedInput(): Promise<BigNumber> {
    return new BigNumber(
      web3.utils.fromWei(
        await createContract().methods.swappedInput().call(),
        "ether"
      )
    );
  }

  async function getInputTokenAddress(): Promise<string> {
    return await createContract().methods.inputToken().call();
  }

  async function getOutputTokenAddress(): Promise<string> {
    return await createContract().methods.token().call();
  }

  async function estimateReceiveTokens(amount: string): Promise<void> {
    if (amount === "" || new BigNumber(amount).isLessThanOrEqualTo(0)) return;

    const weiAmount = web3.utils.toWei(amount, "ether");
    return createContract()
      .methods.tokensForInput(weiAmount)
      .call()
      .then((v: any) => web3.utils.fromWei(v, "ether"))
      .then((v: any) => setEstimatedReceivedTokens(new BigNumber(v)));
  }

  async function buyTokens(amount: string): Promise<void> {
    if (isBuying || approvedAmount?.isLessThan(amount)) return;
    setIsBuying(true);
    return createContract()
      .methods.getToken(web3.utils.toWei(amount, "ether"))
      .send({
        from: address,
      })
      .catch(errorHandler)
      .finally(() => {
        reload();
        setIsBuying(false);
      });
  }

  async function getApprovedAmount(tokenAddress?: string): Promise<BigNumber> {
    if ((!tokenAddress && !inputTokenAddress) || !address)
      return Promise.reject();
    const contract = new web3.eth.Contract(
      TOKEN_ABI as any,
      tokenAddress ?? inputTokenAddress
    );
    return new BigNumber(
      web3.utils.fromWei(
        await contract.methods
          .allowance(address, hospiumContractAddress)
          .call(),
        "ether"
      )
    );
  }

  async function approveAmount(amount: string): Promise<void> {
    if (isBuying) return;
    setIsBuying(true);
    const contract = new web3.eth.Contract(TOKEN_ABI as any, inputTokenAddress);
    return contract.methods
      .approve(hospiumContractAddress, web3.utils.toWei(amount, "ether"))
      .send({
        from: address,
      })
      .catch(errorHandler)
      .finally(() => {
        reloadInputTokenData();
        setIsBuying(false);
      });
  }

  async function getBalanceOfInputToken(
    tokenAddress?: string
  ): Promise<BigNumber> {
    if ((!tokenAddress && !inputTokenAddress) || !address)
      return Promise.reject();
    const contract = new web3.eth.Contract(
      TOKEN_ABI as any,
      tokenAddress ?? inputTokenAddress
    );
    return new BigNumber(
      web3.utils.fromWei(
        await contract.methods.balanceOf(address).call(),
        "ether"
      )
    );
  }

  return useMemo(
    () => ({
      reload,
      remainingSupply,
      burnedInput,
      inputToLP,
      swappedInput,
      inputTokenAddress,
      outputTokenAddress,
      estimatedReceivedTokens,
      estimateReceiveTokens,
      buyTokens,
      isBuying,
      approvedAmount,
      approveAmount,
      balanceOfInputToken,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      remainingSupply,
      burnedInput,
      inputToLP,
      swappedInput,
      inputTokenAddress,
      outputTokenAddress,
      estimatedReceivedTokens,
      isBuying,
      approvedAmount,
      balanceOfInputToken,
    ]
  );
}
