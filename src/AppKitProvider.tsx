import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia as baseSepolia } from "@reown/appkit/networks";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;
if (!projectId) throw new Error("VITE_REOWN_PROJECT_ID is not defined");

const queryClient = new QueryClient();

const metadata = {
  name: "AirTimeArena",
  description: "Accept The Challenge!",
  url: "https://www.blockchaininnovationlab.io",
  icons: ["https://cryptok33pr.github.io/airtimearena/favicon.ico"],
  redirect: {
    native: "airtimearena://", // Custom URL scheme (change if you have one)
    universal: "https://www.blockchaininnovationlab.io", // Your public URL
    // linkMode: true, // Optional: enable if your wallet/dApp supports Reown Link Mode
  },
};

// Use Alchemy for Sepolia
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
const sepolia = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      ...baseSepolia.rpcUrls.default,
      http: [`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`],
    },
  },
};

// Cast networks as tuple to satisfy types
const networks = [mainnet, sepolia] as unknown as [typeof mainnet, ...typeof mainnet[]];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true, //If you are not using server side rendering change to false.
});

const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    socials: [],  // Disable all social logins (Google, Discord, Twitter)
    email: false, // Disable email login
  },
});

// Create React context to hold the appKit instance
const AppKitContext = createContext(appKit);

// Hook to consume AppKit from context
export function useAppKit() {
  return useContext(AppKitContext);
}

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <AppKitContext.Provider value={appKit}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </AppKitContext.Provider>
  );
}
