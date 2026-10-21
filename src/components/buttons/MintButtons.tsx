import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Contract, parseEther } from "ethers";
import { useContractWithSigner } from "../../hooks/useContractWithSigner";

const SepoliaChainId = 11155111;

type Tier = "bronze" | "silver" | "gold";

const prices: Record<Tier, string> = {
  bronze: "0.007",
  silver: "0.008",
  gold: "0.009",
};

const mintFunctions: Record<Tier, string> = {
  bronze: "mintBronze",
  silver: "mintSilver",
  gold: "mintGold",
};

type MintButtonProps = { tier: Tier | string }; // tolerate casing from parent

const MintButton: React.FC<MintButtonProps> = ({ tier }) => {
  const { address, isConnected, chain } = useAccount();
  const { contractReadOnly, getContractWithSigner } = useContractWithSigner();

  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [hasMinted, setHasMinted] = useState<boolean | null>(null);

  // Normalize tier to lowercase and validate at runtime
  const normalizedTier = String(tier).toLowerCase() as Tier;
  const isValidTier = normalizedTier === "bronze" || normalizedTier === "silver" || normalizedTier === "gold";

  useEffect(() => {
    const checkMinted = async () => {
      if (!isConnected || !address || !contractReadOnly) return;
      try {
        const minted = await contractReadOnly.hasMinted(address);
        setHasMinted(minted);
      } catch {
        setHasMinted(null);
      }
    };
    checkMinted();
  }, [isConnected, address, contractReadOnly]);

  const handleMint = async () => {
    setError(null);
    setSuccess(false);

    if (!isConnected || !address) {
      setError("Connect your wallet to mint.");
      return;
    }

    if (!isValidTier) {
      setError(`Invalid tier: "${tier}". Use bronze, silver, or gold.`);
      return;
    }

    if (hasMinted) {
      setError("You have already minted an NFT with this wallet.");
      return;
    }

    if (chain?.id !== SepoliaChainId) {
      setError("Please switch your wallet network to Sepolia Testnet.");
      return;
    }

    const price = prices[normalizedTier];
    if (!price) {
      setError(`No price configured for tier "${normalizedTier}".`);
      return;
    }

    try {
      setIsMinting(true);

      const contractWithSigner = await getContractWithSigner();
      if (!contractWithSigner) {
        setError("No signer available.");
        return;
      }

      // Call the correct mint function for the tier
      const fn = mintFunctions[normalizedTier];
      const tx = await (contractWithSigner as Contract)[fn]({
        value: parseEther(price), // <-- guaranteed defined string (0.007 / 0.008 / 0.009)
      });

      setTxHash(tx.hash);
      await tx.wait();

      setSuccess(true);
      setHasMinted(true);
    } catch (e: any) {
      const msg = (e?.error?.message || e?.message || "").toLowerCase();

      if (msg.includes("already minted")) {
        setError("You have already minted an NFT with this wallet.");
        setHasMinted(true);
      } else if (msg.includes("insufficient funds")) {
        setError("Insufficient funds to complete the purchase.");
      } else if (msg.includes("user rejected") || msg.includes("user denied")) {
        setError("Transaction rejected by the user.");
      } else {
        setError("Minting failed. Please try again.");
      }
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected || !address) return <p>Please connect your wallet to check mint status.</p>;
  if (hasMinted) return <p className="mint-status-text" style={{ color: "#90ee90" }}>You have already minted your NFT. Thank you!</p>;
  if (success)
    return (
      <p className="mint-status-text">
        Mint successful!{" "}
        {txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#1e90ff" }}
          >
            View on Etherscan
          </a>
        )}
      </p>
    );

  return (
    <div className="mint-button-container">
      <div className="mint-button-wrapper">
        <button
          className="mint-button"
          onClick={handleMint}
          disabled={isMinting || !isConnected}
          aria-busy={isMinting}
          aria-disabled={isMinting || !isConnected}
          aria-label={`Mint ${normalizedTier.charAt(0).toUpperCase() + normalizedTier.slice(1)} NFT`}
          type="button"
        >
          {isMinting
            ? "Minting..."
            : `Mint ${normalizedTier.charAt(0).toUpperCase() + normalizedTier.slice(1)} - ${prices[normalizedTier]} ETH`}
        </button>
      </div>

      {error && <p className="mint-error-text" style={{ color: "red", marginTop: 8 }}>{error}</p>}
    </div>
  );
};

export default MintButton;
