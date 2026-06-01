import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import About from "./pages/About";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

import SeekerDashboard from "./pages/seeker/Dashboard";
import Profile from "./pages/seeker/Profile";
import Resume from "./pages/seeker/Resume";
import JobSearch from "./pages/seeker/JobSearch";
import JobDetail from "./pages/seeker/JobDetail";
import SavedJobs from "./pages/seeker/SavedJobs";
import AppliedJobs from "./pages/seeker/AppliedJobs";
import AIMatch from "./pages/seeker/AIMatch";
import Notifications from "./pages/seeker/Notifications";
import Messages from "./pages/seeker/Messages";
import SocialFeed from "./pages/seeker/SocialFeed";
import SinglePost from "./pages/seeker/SinglePost";
import Connections from "./pages/seeker/Connections";
import Trending from "./pages/seeker/Trending";
import { PublicProfile, ApplicationView } from "./pages/seeker/StubPages";

import EmployerDashboard from "./pages/employer/Dashboard";
import { CompanyProfile, EditCompanyProfile, PostJob, ManageJobs as EManageJobs, JobAnalytics, Applicants, AllApplicants, ApplicationDetail } from "./pages/employer/StubPages";

import AdminDashboard from "./pages/admin/Dashboard";
import { ManageUsers, ManageJobs as AManageJobs, Moderation, Reports } from "./pages/admin/StubPages";

import GlobalSearch from "./pages/shared/GlobalSearch";
import CompanyProfileView from "./pages/shared/CompanyProfileView";


import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/company/:userId" element={<CompanyProfileView />} />
            </Route>

            {/* Auth */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Route>

            {/* Sub-app layouts wrapped in Protected and Role routes */}
            
            {/* Seeker */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleProtectedRoute allowedRoles={['seeker']} />}>
                <Route element={<DashboardLayout role="seeker" />}>
                  <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
                  <Route path="/seeker/profile" element={<Profile />} />
                  <Route path="/seeker/public-profile" element={<PublicProfile />} />
                  <Route path="/seeker/search" element={<GlobalSearch role="seeker" />} />
                  <Route path="/seeker/resume" element={<Resume />} />
                  <Route path="/seeker/jobs" element={<JobSearch />} />
                  <Route path="/seeker/jobs/:id" element={<JobDetail />} />
                  <Route path="/seeker/company/:userId" element={<CompanyProfileView />} />
                  <Route path="/seeker/saved-jobs" element={<SavedJobs />} />
                  <Route path="/seeker/applied-jobs" element={<AppliedJobs />} />
                  <Route path="/seeker/application/:id" element={<ApplicationView />} />
                  <Route path="/seeker/ai-match" element={<AIMatch />} />
                  <Route path="/seeker/notifications" element={<Notifications />} />
                  <Route path="/seeker/messages" element={<Messages />} />
                  <Route path="/seeker/social" element={<SocialFeed />} />
                  <Route path="/seeker/post/:id" element={<SinglePost />} />
                  <Route path="/seeker/connections" element={<Connections />} />
                  <Route path="/seeker/trending" element={<Trending />} />
                </Route>
              </Route>
            </Route>

            {/* Employer */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleProtectedRoute allowedRoles={['employer']} />}>
                <Route element={<DashboardLayout role="employer" />}>
                  <Route path="/employer/dashboard" element={<EmployerDashboard />} />
                  <Route path="/employer/company-profile" element={<CompanyProfile />} />
                  <Route path="/employer/search" element={<GlobalSearch role="employer" />} />
                  <Route path="/employer/edit-company" element={<EditCompanyProfile />} />
                  <Route path="/employer/post-job" element={<PostJob />} />
                  <Route path="/employer/manage-jobs" element={<EManageJobs />} />
                  <Route path="/employer/applicants" element={<AllApplicants />} />
                  <Route path="/employer/analytics/:jobId" element={<JobAnalytics />} />
                  <Route path="/employer/job/:jobId/applicants" element={<Applicants />} />
                  <Route path="/employer/public-profile" element={<PublicProfile />} />
                  <Route path="/employer/application/:id" element={<ApplicationDetail />} />
                </Route>
              </Route>
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<DashboardLayout role="admin" />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/search" element={<GlobalSearch role="admin" />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                  <Route path="/admin/jobs" element={<AManageJobs />} />
                  <Route path="/admin/moderation" element={<Moderation />} />
                  <Route path="/admin/reports" element={<Reports />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
