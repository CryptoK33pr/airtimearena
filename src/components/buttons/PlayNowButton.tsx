import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../hooks/useEthers";
import contractABI from "../../contracts/contractABI.json";
import { contractAddress } from "../../contracts/contractAddress";

const SepoliaChainId = 11155111;
const CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

const PlayNowButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();
  let chainId = useChainId();

  if (typeof chainId === "string") chainId = parseInt(chainId, 16);

  const providerReadOnly = useMemo(
    () =>
      new JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
      ),
    []
  );

  const contractReadOnly = useMemo(
    () => new Contract(contractAddress, contractABI, providerReadOnly),
    [providerReadOnly]
  );

  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasClickedPlay, setHasClickedPlay] = useState(false);

  // ✅ Generic cache with expiration
  const getCache = (key: string) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      const { value, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp > CACHE_EXPIRATION_MS) return null;
      return value;
    } catch {
      return null;
    }
  };

  const setCache = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
    } catch (e) {
      console.warn("Failed to cache", key, e);
    }
  };

  const findOwnedTokenId = useCallback(
    async (userAddress: string): Promise<number | null> => {
      if (!isConnected || !userAddress || !contractReadOnly) return null;

      const tokenRanges = [
        { start: 1, end: 30 },
        { start: 31, end: 51 },
        { start: 52, end: 62 },
      ];

      try {
        for (const range of tokenRanges) {
          for (let tokenId = range.start; tokenId <= range.end; tokenId++) {
            const cacheKey = `balance_${userAddress}_${tokenId}`;
            let balance: bigint | null = getCache(cacheKey)
              ? BigInt(getCache(cacheKey))
              : null;

            if (balance === null) {
              const rawBalance = await contractReadOnly.balanceOf(userAddress, tokenId);
              balance = BigInt(rawBalance.toString());
              setCache(cacheKey, balance.toString()); // ✅ store as string
            }

            if (balance > 0n) return tokenId;
            await new Promise((resolve) => setTimeout(resolve, 50)); // avoid RPC spamming
          }
        }
        return null;
      } catch (e) {
        console.error("Error in findOwnedTokenId:", e);
        return null;
      }
    },
    [isConnected, contractReadOnly]
  );

  const isTokenUnplayed = useCallback(
    async (tokenId: number): Promise<boolean> => {
      if (!contractReadOnly) return false;
      try {
        const cacheKey = `tokenState_${tokenId}`;
        let tokenStateValue: number | null = getCache(cacheKey)
          ? Number(getCache(cacheKey))
          : null;

        if (tokenStateValue === null) {
          const rawState = await contractReadOnly.tokenState(tokenId);
          tokenStateValue = Number(rawState); // ✅ convert BigNumber/BigInt
          setCache(cacheKey, tokenStateValue);
        }

        return tokenStateValue === 0;
      } catch (e) {
        console.error("Error in isTokenUnplayed:", e);
        return false;
      }
    },
    [contractReadOnly]
  );

  const handlePlayNow = async () => {
    setError(null);
    setSuccess(null);
    setHasClickedPlay(true);

    if (!isConnected || !signer || !address) {
      setError("Connect your wallet to play.");
      return;
    }

    if (chainId !== SepoliaChainId) {
      setError("Please switch your wallet network to Sepolia Testnet.");
      return;
    }

    setLoadingMessage("Checking NFT Ownership...");

    try {
      const resolvedSigner =
        signer && typeof (signer as any).then === "function" ? await signer : signer;

      const contractWithSigner = new Contract(
        contractAddress,
        contractABI,
        resolvedSigner as any
      );

      const tokenId = await findOwnedTokenId(address!);
      if (!tokenId) {
        setError("No owned NFT found. Please mint an NFT to play.");
        return;
      }

      setLoadingMessage("Checking NFT State...");
      const unplayed = await isTokenUnplayed(tokenId);
      if (!unplayed) {
        setSuccess("Already Accepted!");
        return;
      }

      setLoadingMessage("Accepting challenge...");
      const tx = await contractWithSigner.acceptChallenge(tokenId);
      await tx.wait();

      // ✅ Invalidate tokenState cache after playing
      setCache(`tokenState_${tokenId}`, 1); // mark as played

      setSuccess("Good Luck! Challenge accepted. Game started.");
    } catch (e: any) {
      console.error("PlayNow error:", e);
      setError(e?.message || "Failed to start challenge.");
    } finally {
      setLoadingMessage(null);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      findOwnedTokenId(address);
    }
  }, [isConnected, address, findOwnedTokenId]);

  const isChallengeAlreadyAccepted = success === "Already Accepted!";
  const isButtonDisabled =
    !!loadingMessage || !isConnected || isChallengeAlreadyAccepted;

  const buttonText = (() => {
    if (loadingMessage) return loadingMessage;
    if (!isConnected) return "Connect Wallet";
    if (isChallengeAlreadyAccepted) return "Already Accepted!";
    return "Accept Challenge";
  })();

  return (
    <div className="playnow-button-wrapper">
      <button
        className={`playnow-button ${isChallengeAlreadyAccepted ? "disabled-button" : ""}`}
        onClick={handlePlayNow}
        disabled={isButtonDisabled}
        aria-busy={!!loadingMessage}
        aria-label="Accept Challenge and Play Now"
        type="button"
      >
        {buttonText}
      </button>

      {success && hasClickedPlay && (
        <p
          className="mint-status-text"
          style={{ color: isChallengeAlreadyAccepted ? "#00ff90" : "inherit" }}
        >
          {isChallengeAlreadyAccepted ? "Good Luck!" : success}
        </p>
      )}

      {error && <p className="mint-error-text">{error}</p>}
    </div>
  );
};

export default PlayNowButton;
