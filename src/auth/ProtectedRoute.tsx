import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";

type ProtectedRouteProps = {
  adminOnly?: boolean;
};

export function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-[#fcf9f8] text-[#464554]">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <div className="grid h-screen place-items-center bg-[#fcf9f8] px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#1b1b1b]">
            Admin access required
          </h1>
          <p className="mt-2 text-[#5d5f5e]">
            Your account can use chat, but it cannot manage users.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
