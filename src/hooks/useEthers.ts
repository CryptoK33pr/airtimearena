import { useEffect, useState } from 'react';
import { useWalletClient, type UseWalletClientReturnType } from 'wagmi';
import { BrowserProvider, type JsonRpcSigner } from 'ethers';

type WalletClient = UseWalletClientReturnType['data'];

export function walletClientToSigner(walletClient: WalletClient) {
  if (!walletClient) return null;

  const transport =
    walletClient.transport ?? (typeof window !== 'undefined' ? (window as any).ethereum : undefined);

  if (!transport) return null;

  try {
    const provider = new BrowserProvider(transport);
    return provider.getSigner(); // returns Promise<JsonRpcSigner>
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Hook: always resolves the signer, so you never have to deal with Promise<Signer> in your button
 */
export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    if (!walletClient) return;

    let canceled = false;

    walletClientToSigner(walletClient)?.then((resolved) => {
      if (!canceled) setSigner(resolved);
    });

    return () => {
      canceled = true;
    };
  }, [walletClient]);

  return signer; // JsonRpcSigner | null
}
