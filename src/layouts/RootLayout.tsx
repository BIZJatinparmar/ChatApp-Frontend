import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";

export function RootLayout() {
  return (
    <div className="flex h-screen w-full bg-[#fcf9f8] text-[#1b1b1b] font-sans selection:bg-[#c0c1ff] selection:text-[#07006c]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}
