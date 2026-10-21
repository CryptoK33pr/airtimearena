import { useMemo } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import type { Signer } from "ethers";
import contractABI from "../contracts/contractABI.json";
import { contractAddress } from "../contracts/contractAddress";
import { useEthersSigner } from "./useEthers";

const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
const providerReadOnly = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`);

export const useContractWithSigner = () => {
  const signer = useEthersSigner();

  const resolveSigner = async (signerOrPromise: Signer | Promise<Signer> | null) => {
    if (!signerOrPromise) return null;
    return typeof (signerOrPromise as any).then === "function"
      ? await signerOrPromise
      : signerOrPromise;
  };

  const contractReadOnly = useMemo(
    () => new Contract(contractAddress, contractABI, providerReadOnly),
    []
  );

  const getContractWithSigner = async () => {
    const resolvedSigner = await resolveSigner(signer ?? null);
    if (!resolvedSigner) return null;
    return new Contract(contractAddress, contractABI, resolvedSigner);
  };

  return { contractReadOnly, getContractWithSigner };
};
