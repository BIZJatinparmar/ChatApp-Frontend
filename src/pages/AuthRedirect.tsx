import { useEffect, useState } from "react";
import { Navigate } from "react-router";

export function AuthRedirect() {
  const [{ redirectTo, error }] = useState(() => {
    const nextRedirectTo =
      sessionStorage.getItem("postLoginRedirectPath") ?? "/";
    const nextError = sessionStorage.getItem("authRedirectError");

    return { redirectTo: nextRedirectTo, error: nextError };
  });

  useEffect(() => {
    sessionStorage.removeItem("postLoginRedirectPath");
    sessionStorage.removeItem("authRedirectError");
  }, []);

  if (error) {
    return <Navigate to="/login" replace state={{ error }} />;
  }

  return <Navigate to={redirectTo} replace />;
}
