"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function ConnectButton() {
  const { address, chain, isConnected } = useAccount();
  const { connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const metaMaskConnector = injected({ target: "metaMask" });

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)} (
          {chain?.name})
        </p>
        <button
          className="bg-zinc-700 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded hover:cursor-pointer"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded hover:cursor-pointer disabled:cursor-not-allowed"
        disabled={isPending}
        onClick={() => connect({ connector: metaMaskConnector })}
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>

      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Connects via MetaMask only.
      </p>

      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
    </div>
  );
}
