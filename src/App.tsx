import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootLayout } from "./layouts/RootLayout";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import type { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { AuthRedirect } from "./pages/AuthRedirect";
import { ChatStreamProvider } from "./hooks/useSendMessage";

const queryClient = new QueryClient();

type AppProps = {
  msalInstance: PublicClientApplication;
};
export default function App({ msalInstance }: AppProps) {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <ChatStreamProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="login-redirect" element={<AuthRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<RootLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/c/:threadId" element={<Chat />} />
                    <Route element={<ProtectedRoute adminOnly />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ChatStreamProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}
