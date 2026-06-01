import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RoleProtectedRouteProps {
  allowedRoles: ('seeker' | 'employer' | 'admin')[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If user tries to access a route they don't have permission for,
    // redirect them to their respective dashboard
    const redirectPath = user.role === 'admin' 
      ? '/admin/dashboard' 
      : user.role === 'employer' 
        ? '/employer/dashboard' 
        : '/dashboard';
        
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
