import { Outlet } from "react-router-dom";

const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Outlet />
  </div>
);

export default AuthLayout;
