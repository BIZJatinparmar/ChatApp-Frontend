import { LayoutDashboard, Menu } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext";

type HeaderProps = {
  toggleSidebar?: () => void;
};
export function Header({ toggleSidebar }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-[#fcf9f8] w-full sticky top-0 border-b border-[#e2e2e2] flex justify-between items-center h-14 px-6 z-10">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-[#464554] hover:bg-[#f0eded] p-1 rounded-md transition-colors"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </button>
        <Link
          to="/"
          className="text-lg font-semibold text-[#1b1b1b] hover:text-[#4648d4] transition-colors"
        >
          Chat
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {user?.role === "admin" && (
          <Link
            to="/dashboard"
            className="hidden h-9 items-center gap-2 rounded-md border border-[#e2e2e2] bg-white px-3 text-sm font-medium text-[#464554] shadow-sm transition-colors hover:border-[#4648d4] hover:text-[#4648d4] sm:flex"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
        )}
        <div className="hidden text-right text-xs leading-5 text-[#5d5f5e] sm:block">
          <div className="max-w-[220px] truncate font-medium text-[#1b1b1b]">
            {user?.email ?? "Signed in"}
          </div>
          <div className="capitalize">{user?.role}</div>
        </div>
      </div>
    </header>
  );
}
