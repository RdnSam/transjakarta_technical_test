import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import Dashboard from "./pages/Dashboard";
import "./index.css";

import { ThemeProvider } from "./components/theme-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange storageKey="vite-ui-theme">
        <Dashboard />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
