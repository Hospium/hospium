"use client";
import {
  WalletContextProvider,
  useWalletContext,
} from "@/contexts/wallet.context";
import { useHospium } from "@/hooks/hospium.hook";
import { useMetaMask } from "@/hooks/metamask.hook";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useState } from "react";

function Home() {
  return (
    <WalletContextProvider>
      <HomeContent />
    </WalletContextProvider>
  );
}

function HomeContent() {
  const {
    isConnected,
    address,
    chain: chainId,
    connect,
    block,
  } = useWalletContext();
  const {
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
  } = useHospium();
  const { chain, addContract, requestChangeToChain } = useMetaMask();
  const [amount, setAmount] = useState<string>("");
  const needsChainChange = chainId !== undefined && chain.chainId !== chainId;

  console.info(`don't look at my console, get some hospium instead`);

  function formatNumber(value: number): string {
    let postfix = "";
    let fixed = 0;
    if (Math.abs(value) > 1e6) {
      value = value / 1e6;
      postfix = "M";
      fixed = 2;
    } else if (Math.abs(value) > 1e3) {
      value = value / 1e3;
      postfix = "k";
      fixed = 2;
    }
    return value
      .toFixed(fixed)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      .concat(postfix);
  }

  function handleAmountChanged(value: string) {
    setAmount(value);
    estimateReceiveTokens(value);
  }

  function needsApproval(): boolean {
    return approvedAmount?.isLessThan(amount) ?? true;
  }

  return (
    <>
      <Head>
        <title>$HOSP</title>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="UTF-8" />
        <meta name="description" content="Get your hospium by buying $HOSP" />
      </Head>
      <main className="min-h-screen flex flex-col items-center">
        <div className="navbar">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl">Hospium</a>
          </div>
          <div className="flex flex-row gap-4">
            <p className="text-sm text-slate-500 hidden md:flex">
              Block: {block}
            </p>
            <button
              className="btn btn-primary hidden md:flex"
              onClick={() => reload()}
            >
              Reload
            </button>
            {needsChainChange ? (
              <button
                className="btn btn-primary"
                onClick={() => requestChangeToChain(chain.chainId)}
              >
                {`Change network to ${chain.chainName}`}
              </button>
            ) : isConnected ? (
              <button className="btn btn-ghost" disabled>
                <p className="text-white">{`${address?.slice(
                  0,
                  4
                )}...${address?.slice(-4)}`}</p>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => connect()}>
                Connect your wallet
              </button>
            )}
          </div>
        </div>
        {isConnected ? (
          <div className="card mx-4 md:w-128 bg-slate-100 shadow-xl mt-16">
            <div className="card-body">
              <h2 className="card-title">
                Get your hospium by buying <p className="text-primary">$HOSP</p>
              </h2>
              <div
                className="cursor-pointer"
                onClick={() =>
                  handleAmountChanged(balanceOfInputToken?.toString() ?? "0")
                }
                onKeyDown={() => {}}
              >
                Balance: {balanceOfInputToken?.toFixed(2).toString() ?? "0"}{" "}
                <strong className="text-secondary">DUSD</strong>
              </div>
              <div className="flex flex-row items-center">
                <input
                  type="number"
                  placeholder="Amount"
                  className="input input-bordered input-primary w-full mr-4"
                  onWheel={(e) => e.currentTarget.blur()}
                  value={amount}
                  onChange={(e) => handleAmountChanged(e.target.value)}
                />
                <strong className="text-secondary">DUSD</strong>
              </div>
              {estimatedReceivedTokens ? (
                <p>
                  Estimation: {estimatedReceivedTokens?.toString() ?? ""}{" "}
                  <strong className="text-primary">HOSP</strong>
                </p>
              ) : (
                <p>
                  Estimation:{" "}
                  <strong className="text-sm font-normal text-slate-500">
                    Please enter an amount
                  </strong>
                </p>
              )}
              <button
                className="btn btn-block btn-primary"
                onClick={() =>
                  needsApproval() ? approveAmount(amount) : buyTokens(amount)
                }
              >
                {isBuying ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : needsApproval() ? (
                  "Approve"
                ) : (
                  "Buy"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="card mx-4 md:w-128 bg-slate-100 shadow-xl mt-16">
            <div className="card-body">
              <p>
                Please connect your wallet to be able to receive{" "}
                <strong className="text-primary">HOSP</strong>
              </p>
            </div>
          </div>
        )}
        {remainingSupply && inputToLP && burnedInput && swappedInput && (
          <div className="card mx-4 md:w-128 bg-slate-100 shadow-xl mt-16">
            <div className="card-body">
              <h2 className="card-title">Statistics</h2>
              <p>
                Total supply: {formatNumber(8_000_000)}{" "}
                <strong className="text-primary">HOSP</strong>
              </p>
              <p>
                Remaining supply:{" "}
                {formatNumber(remainingSupply?.toNumber() ?? 0)}{" "}
                <strong className="text-primary">HOSP</strong> (
                {remainingSupply?.div(8_000_000).times(100).toFixed(8)}
                %)
              </p>
              <p>
                Initial price: 1{" "}
                <strong className="text-secondary">DUSD</strong> /{" "}
                <strong className="text-primary">HOSP</strong>
              </p>
              <p>
                Max price: 50 <strong className="text-secondary">DUSD</strong> /{" "}
                <strong className="text-primary">HOSP</strong>
              </p>
              <p>Burn rate: 66.7%</p>
              <p>
                Max burn: &gt;100 M{" "}
                <strong className="text-secondary">DUSD</strong>
              </p>
              <p>
                Added liquidity: {formatNumber(inputToLP?.toNumber() ?? 0)}{" "}
                <strong className="text-secondary">DUSD</strong>
              </p>
              <p>
                Burned: {formatNumber(burnedInput?.toNumber() ?? 0)}{" "}
                <strong className="text-secondary">DUSD</strong>
              </p>
              <p>
                Swapped: {formatNumber(swappedInput?.toNumber() ?? 0)}{" "}
                <strong className="text-secondary">DUSD</strong>
              </p>
              <p className="text-sm font-normal text-slate-500">
                (Amount of DUSD which are swapped to HOSP after adding to
                liquidity pool)
              </p>
            </div>
          </div>
        )}
        <div className="card mx-4 md:w-128 bg-slate-100 shadow-xl mt-16">
          <div className="card-body">
            <h2 className="card-title">Infos</h2>
            <p>
              In <strong className="text-primary">$HOSP</strong> we trust. It
              could go up or down or sideways.
            </p>
            <p>Back on the road to 50.</p>
            <p>
              Each purchase increases the coin price up to a cap of 50{" "}
              <strong className="text-secondary">DUSD</strong>.
            </p>
            <p>
              66.67% <strong className="text-secondary">DUSD</strong> burned
            </p>
            <p>
              33.33% <strong className="text-secondary">DUSD</strong> used to
              form liquidity on Vanilla Swap
            </p>
            <strong>Tokenomics</strong>
            <p>100% community allocation - 0% team allocation</p>
          </div>
        </div>
        <div className="card mx-4 md:w-128 bg-slate-100 shadow-xl mt-16">
          <div className="card-body">
            <h2 className="card-title">Contracts</h2>

            <p className="mt-4 break-all text-sm">
              <strong className="text-primary">HOSP</strong>:{" "}
              {outputTokenAddress}
            </p>
            <button
              className="btn btn-primary flex-grow"
              onClick={() =>
                outputTokenAddress && addContract(outputTokenAddress)
              }
            >
              Add HOSP to MetaMask
            </button>
            <p className="mt-4 break-all text-sm">
              <strong className="text-secondary">DUSD</strong>:{" "}
              {inputTokenAddress}
            </p>
            <button
              className="btn btn-secondary flex-grow"
              onClick={() =>
                inputTokenAddress && addContract(inputTokenAddress)
              }
            >
              Add DUSD to MetaMask
            </button>
          </div>
        </div>
        <div className="card mx-4 md:w-128 bg-slate-100 shadow-xl my-16">
          <div className="card-body">
            <h2 className="card-title">Disclaimer</h2>
            <p>
              Anyone buying or interacting with Hospium is doing so at their own
              risk. We take no responsibility whatsoever.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default dynamic(() => Promise.resolve(Home), { ssr: false });
