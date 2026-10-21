// ✅ main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AppKitProvider } from "./AppKitProvider.tsx"; // make sure path is correct
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>
);
