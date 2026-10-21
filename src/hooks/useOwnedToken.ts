// hooks/useOwnedToken.ts
import { useCallback } from "react";
import { Contract } from "ethers";

export const useOwnedToken = (contractReadOnly: Contract | null, isConnected: boolean) => {
  const tokenRanges = [
    { start: 1, end: 30 },
    { start: 31, end: 51 },
    { start: 52, end: 62 },
  ];

  const findOwnedTokenId = useCallback(
    async (userAddress: string): Promise<number | null> => {
      if (!isConnected || !userAddress || !contractReadOnly) return null;
      for (const range of tokenRanges) {
        for (let tokenId = range.start; tokenId <= range.end; tokenId++) {
          const balance = await contractReadOnly.balanceOf(userAddress, tokenId);
          if (balance > 0n) return tokenId;
        }
      }
      return null;
    },
    [isConnected, contractReadOnly]
  );

  const isTokenUnplayed = useCallback(
    async (tokenId: number): Promise<boolean> => {
      if (!contractReadOnly) return false;
      try {
        const tokenStateValue: number = await contractReadOnly.tokenState(tokenId);
        return tokenStateValue === 0;
      } catch {
        return false;
      }
    },
    [contractReadOnly]
  );

  return { findOwnedTokenId, isTokenUnplayed };
};
