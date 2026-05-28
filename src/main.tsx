import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { msalInstance } from "./auth/msal.ts";
import { EventType } from "@azure/msal-browser";
import { loginWithMicrosoftToken } from "./api/auth.ts";

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log("Login Success");
  }
});

msalInstance.initialize().then(async () => {
  const redirectResult = await msalInstance.handleRedirectPromise({
    navigateToLoginRequestUrl: false,
  });

  if (redirectResult) {
    if (!redirectResult.idToken) {
      sessionStorage.setItem(
        "authRedirectError",
        "Microsoft did not return an ID token.",
      );
    } else {
      msalInstance.setActiveAccount(redirectResult.account);

      try {
        await loginWithMicrosoftToken(redirectResult.idToken);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to sign in.";
        sessionStorage.setItem("authRedirectError", message);
      }
    }
  }

  const activeAccount = msalInstance.getActiveAccount();

  if (activeAccount) {
    msalInstance.setActiveAccount(activeAccount);
  } else {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App msalInstance={msalInstance} />
    </StrictMode>,
  );
});
