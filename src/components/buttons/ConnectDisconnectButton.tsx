import React, { useState, useEffect } from "react";
import { useAppKit } from "../../AppKitProvider";
import { useAccount, useDisconnect } from "wagmi";

const ConnectDisconnectButton: React.FC = () => {
  const appKit = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect to handle connection logic
  useEffect(() => {
    if (isConnected) {
      setConnecting(false);
      setError(null);
    }
  }, [isConnected, address]);

  if (!appKit) return null;

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);

    try {
      await appKit.open(); // Open wallet connect with app kit
    } catch (e: any) {
      setError(e?.message || "Connection failed.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="wallet-button-wrapper">
      {isConnected && address ? (
        <button
          onClick={() => disconnect()}
          type="button"
          className="disconnect-button"
          aria-label="Disconnect Wallet"
          disabled={connecting}
        >
          Disconnect Wallet
        </button>
      ) : (
        <>
          <button
            onClick={handleConnect}
            type="button"
            className="connect-button"
            aria-label="Connect Wallet"
            disabled={connecting}
            aria-busy={connecting}
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
          {error && <p className="mint-error-text">{error}</p>}
        </>
      )}
    </div>
  );
};

export default ConnectDisconnectButton;