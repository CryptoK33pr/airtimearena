import { useState, useEffect, useCallback } from "react";
import { Contract, parseEther } from "ethers";
import { useAccount, useChainId } from "wagmi";
import { useContractWithSigner } from "../hooks/useContractWithSigner";

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

export const useMintStatus = (tier: Tier | string) => {
  const { address, isConnected } = useAccount(); // removed `chain`
  const { contractReadOnly, getContractWithSigner } = useContractWithSigner();
  let chainId = useChainId();

  // Normalize chainId for Safari hex string issue
  if (typeof chainId === "string") chainId = parseInt(chainId, 16);

  const normalizedTier = String(tier).toLowerCase() as Tier;
  const isValidTier = ["bronze", "silver", "gold"].includes(normalizedTier);

  const [isMinting, setIsMinting] = useState(false);
  const [hasMinted, setHasMinted] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkMinted = useCallback(async () => {
    if (!isConnected || !address || !contractReadOnly) return;
    try {
      const minted = await contractReadOnly.hasMinted(address);
      setHasMinted(minted);
    } catch {
      setHasMinted(null);
    }
  }, [isConnected, address, contractReadOnly]);

  useEffect(() => {
    checkMinted();
  }, [checkMinted]);

  const handleMint = useCallback(async () => {
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

    if (chainId !== SepoliaChainId) {
      setError("Please switch your wallet network to Sepolia Testnet.");
      return;
    }

    const price = prices[normalizedTier];

    try {
      setIsMinting(true);
      const contractWithSigner = await getContractWithSigner();
      if (!contractWithSigner) {
        setError("No signer available.");
        return;
      }

      const fn = mintFunctions[normalizedTier];
      const tx = await (contractWithSigner as Contract)[fn]({
        value: parseEther(price),
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
  }, [address, isConnected, chainId, hasMinted, normalizedTier, tier, getContractWithSigner, isValidTier]);

  return {
    isMinting,
    hasMinted,
    success,
    txHash,
    error,
    handleMint,
    normalizedTier,
  };
};
