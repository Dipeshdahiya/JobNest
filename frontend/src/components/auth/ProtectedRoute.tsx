import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Return a loading spinner or skeleton
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optionally block unverified users here, or only on specific routes.
  // For JobNest, we block unverified users from dashboards and redirect them to verify.
  if (!user.is_verified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
};
