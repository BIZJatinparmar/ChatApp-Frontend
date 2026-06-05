import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { listConversations } from "../api/conversations";
import { useAuth } from "../auth/AuthContext";

type SidebarProps = {
  isExpanded: boolean;
  toggleSideBar: () => void;
};
export function Sidebar({ isExpanded, toggleSideBar }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: ({ signal }) => listConversations(signal),
  });

  return (
    <aside
      className={`bg-[#fcf9f8] border-r border-[#e2e2e2] flex flex-col p-3 gap-4 shrink-0 items-start transition-all duration-300 ease-in-out max-h-screen overflow-auto absolute -translate-x-full md:translate-x-0 md:top-0
          md:relative ${
            isExpanded ? "md:w-64 z-20 translate-x-0" : "md:w-16 items-center "
          }`}
    >
      <button
        onClick={() => toggleSideBar()}
        className={`p-2 hover:bg-[#f0eded] rounded-md transition-colors text-[#464554] ${isExpanded ? "self-start" : ""}`}
      >
        <Menu size={20} className="hidden md:block" />
        <ArrowLeft size={20} className="block md:hidden" />
      </button>

      <nav className="flex-1 w-full flex flex-col gap-4 mt-2">
        <Link
          to="/"
          className={`bg-white border border-[#e2e2e2] text-[#4648d4] rounded-lg flex items-center h-10 shadow-sm transition-all ${isExpanded ? "px-3 justify-start gap-3" : "justify-center w-10"}`}
          title="New Chat"
        >
          <MessageSquare size={20} className="shrink-0" />
          {isExpanded && (
            <span className="font-medium text-[15px] whitespace-nowrap">
              New Chat
            </span>
          )}
        </Link>
        {!isLoading &&
          data?.conversations?.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/c/${conversation.id}`}
              className={`bg-white border border-[#e2e2e2] text-[#4648d4] rounded-lg flex items-center h-10 shadow-sm transition-all ${isExpanded ? "px-3 justify-start gap-3" : "justify-center w-10"}`}
              title={conversation.title}
            >
              <span className="font-medium text-[15px] whitespace-nowrap overflow-hidden text-ellipsis">
                {conversation.title}
              </span>
            </Link>
          ))}
        {user?.role === "admin" && (
          <Link
            to="/dashboard"
            className={`text-[#5d5f5e] hover:text-[#1b1b1b] hover:bg-[#e5e2e1]/50 rounded-lg flex items-center h-10 transition-all ${isExpanded ? "px-3 justify-start gap-3" : "justify-center w-10"}`}
            title="Dashboard"
          >
            <LayoutDashboard size={20} className="shrink-0" />
            {isExpanded && (
              <span className="font-medium text-[15px] whitespace-nowrap">
                Dashboard
              </span>
            )}
          </Link>
        )}
        {/* <a
          href="#"
          className={`text-[#5d5f5e] hover:text-[#1b1b1b] hover:bg-[#e5e2e1]/50 rounded-lg flex items-center h-10 transition-all ${isExpanded ? "px-3 justify-start gap-3" : "justify-center w-10"}`}
          title="History"
        >
          <Clock size={20} className="shrink-0" />
          {isExpanded && (
            <span className="font-medium text-[15px] whitespace-nowrap">
              History
            </span>
          )}
        </a> */}
        {/* <a
          href="#"
          className={`text-[#5d5f5e] hover:text-[#1b1b1b] hover:bg-[#e5e2e1]/50 rounded-lg flex items-center h-10 transition-all ${isExpanded ? "px-3 justify-start gap-3" : "justify-center w-10"}`}
          title="Projects"
        >
          <FolderOpen size={20} className="shrink-0" />
          {isExpanded && (
            <span className="font-medium text-[15px] whitespace-nowrap">
              Projects
            </span>
          )}
        </a>
        <a
          href="#"
          className={`text-[#5d5f5e] hover:text-[#1b1b1b] hover:bg-[#e5e2e1]/50 rounded-lg flex items-center h-10 transition-all ${isExpanded ? "px-3 justify-start gap-3" : "justify-center w-10"}`}
          title="Team"
        >
          <Users size={20} className="shrink-0" />
          {isExpanded && (
            <span className="font-medium text-[15px] whitespace-nowrap">
              Team
            </span>
          )}
        </a> */}
      </nav>

      <div className="w-full flex flex-col gap-4 mt-auto pb-4">
        <button
          type="button"
          onClick={async () => {
            await logoutUser();
            navigate("/login", { replace: true });
          }}
          className={`text-[#5d5f5e] hover:text-[#1b1b1b] hover:bg-[#e5e2e1]/50 rounded-lg flex items-center h-10 transition-all ${isExpanded ? "px-3 justify-start gap-3" : "justify-center w-10"}`}
          title="Log out"
        >
          <LogOut size={20} className="shrink-0" />
          {isExpanded && (
            <span className="font-medium text-[15px] whitespace-nowrap">
              Log out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
