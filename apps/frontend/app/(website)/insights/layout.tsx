import Sidebar from "./components/Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="h-[76px] bg-red-600">HEADER</div>
      <div className="h-[100vh] flex">
        <Sidebar />
        <div className="flex-grow">{children}</div>
      </div>
    </>
  );
};

export default Layout;
