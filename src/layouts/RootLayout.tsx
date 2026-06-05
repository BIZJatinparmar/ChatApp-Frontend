import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { useState } from "react";

export function RootLayout() {
  const [isExpanded, setIsExpanded] = useState(false);

  function toggleSidebar() {
    setIsExpanded((prev) => !prev);
  }

  return (
    <div className="flex h-screen w-full bg-[#fcf9f8] text-[#1b1b1b] font-sans selection:bg-[#c0c1ff] selection:text-[#07006c]">
      <Sidebar isExpanded={isExpanded} toggleSideBar={toggleSidebar} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header toggleSidebar={toggleSidebar} />
        <Outlet />
      </div>
    </div>
  );
}
