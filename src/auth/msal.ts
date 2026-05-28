import { PublicClientApplication } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_MS_CLIENT_ID?.toString() ?? "";
const tenantId = import.meta.env.VITE_MS_TENANT_ID?.toString() ?? "common";
const redirectUri =
  import.meta.env.VITE_MS_REDIRECT_URI?.toString() ??
  `${window.location.origin}/login-redirect`;

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
  cache: {
    cacheLocation: "localstorage",
  },
});

export const microsoftLoginRequest = {
  scopes: ["openid", "profile", "email"],
};
