import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./components/modal/theme-provider";
import "./index.css";
import { ToastProvider } from "./components/toast-provider.jsx";
import Notification from "./components/global/notification-fcm.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ToastProvider>
        <Notification />
        <App />
      </ToastProvider>
    </ThemeProvider>
    {import.meta.env.VITE_NODE_ENV === "development" && <ReactQueryDevtools />}
  </QueryClientProvider>
);
