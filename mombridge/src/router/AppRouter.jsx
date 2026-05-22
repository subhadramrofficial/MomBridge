// src/router/AppRouter.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Signup from "../auth/Signup";
import CharitySignup from "../auth/CharitySignup";
import JobSignup from "../auth/JobSignup";
import Login from "../auth/Login";
import JobProviderHome from "../models/job/pages/JobProviderHome";
import DashboardHome from "../models/admin/pages/DashboardHome";
import AdminDashboard from "../models/admin/pages/AdminDashboard";
import CharityHome from "../models/charity/pages/CharityHome";
import AddJob from "../models/job/pages/AddJob";
import MyJobs from "../models/job/pages/MyJobs";
import Profile from "../models/job/pages/Profile";
import Logout from "../auth/Logout";
import Settings from "../models/job/pages/Settings";
import CharityDonations from "../models/charity/pages/CharityDonations";
import MyDonations from "../models/charity/pages/MyDonations";
import CharityProfile from "../models/charity/pages/CharityProfile";
import CharityVerification from "../models/admin/components/CharityVerification";
import JobVerification from "../models/admin/components/JobVerification";
import AdminCharities from "../models/admin/pages/ViewCharity";
import EditJob from "../models/job/pages/EditJob";
import EditDonation from "../models/charity/pages/EditCharity";
import SocialWorkerDashboard from "../models/socialworker/SocialWorkerDashboard";
import CreateSocialWorker from "../models/admin/pages/CreateSocialWorker";
import GiveDonation from "../models/socialworker/GiveDonation";
import PickupDonation from "../models/socialworker/PickupDonation";
import VerifyMoms from "../models/socialworker/VerifyMoms";
import JobProviderApplications from "../models/job/pages/JobProviderApplications";
import JobApplications from "../models/job/pages/JobApplications";
import ViewSponsorshipRequests from "../models/admin/pages/ViewSponsorshipRequests";
import SponsorChild from "../models/charity/pages/SponsorChild";
import ViewSponsoredChildren from "../models/charity/pages/MySponsoredChildern";
import SocialWorkerSponsorship from "../models/socialworker/SponsorshipVerification";
import JobApprovalPage from "../models/admin/pages/JobApprovalPage";
import MomRequests from "../models/admin/pages/MomRequests";
import NotificationsDropdown from "../models/admin/components/NotificationsDropdown";
import NotificationSocial from "../models/socialworker/NotificationSocial";
import ChangePassword from "../models/charity/pages/ChangePassword";
import VerifiedMomsPage from "../models/admin/pages/VerifiedMomsPage";
import ForgotPassword from "../auth/ForgotPassword";
import ResetPassword from "../auth/ResetPassword";
import DashboardHomeSocial from "../models/socialworker/DashboardHomeSocial";
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/signup/charity" element={<CharitySignup />} />
        <Route path="/signup/job" element={<JobSignup />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/jobprovider/home" element={<JobProviderHome />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="mom-requests" element={<MomRequests />} />
          <Route path="job-approvals" element={<JobApprovalPage />} />
          <Route path="mom-requests" element={<MomRequests />} />
          <Route
            path="sponsorship-requests"
            element={<ViewSponsorshipRequests />}
          />
          <Route
          path="create-social-worker"
          element={<CreateSocialWorker />}
        />
          <Route path="verify/charities" element={<CharityVerification />} />
          <Route path="verify/job-providers" element={<JobVerification />} />
          <Route path="view/charities" element={<AdminCharities />} />
          <Route path="notifications" elemet={<NotificationsDropdown/>}/>
          <Route path="verified-moms" element={<VerifiedMomsPage/>}/>
        </Route>
        <Route path="/charity/dashboard" element={<CharityHome />} />
        <Route path="/jobprovider/add-job" element={<AddJob />} />
        <Route path="/jobprovider/my-jobs" element={<MyJobs />} />
        <Route path="/job-provider/profile" element={<Profile />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/jobprovider/settings" element={<Settings />} />
        <Route path="/charity/donations" element={<CharityDonations />} />
        <Route path="/charity/my-donations" element={<MyDonations />} />
        <Route path="/charity/profile" element={<CharityProfile />} />

        <Route path="/jobprovider/job/:jobId" element={<EditJob />} />
        <Route
          path="/charity/update-donation/:donationId"
          element={<EditDonation />}
        />
        <Route path="/charity/change-password" element={< ChangePassword/>}/>
        <Route
          path="/socialworker/dashboard"
          element={<SocialWorkerDashboard />}
        >
           <Route index element={<DashboardHomeSocial />} />
          <Route path="pickup" element={<PickupDonation />} />
          <Route path="give" element={<GiveDonation />} />
          <Route path="verify-moms" element={<VerifyMoms />} />
          <Route
            path="sponsored-children"
            element={<SocialWorkerSponsorship />}
          />
          <Route
            path="notifications"
            element={<NotificationSocial />}
          />
          
        </Route>

        
        <Route path="/socialworker/give" element={<GiveDonation />} />
        <Route path="/socialworker/pickup" element={<PickupDonation />} />
        <Route path="/socialworker/verify-moms" element={<VerifyMoms />} />
        <Route
          path="/jobprovider/applications"
          element={<JobProviderApplications />}
        />
        <Route
          path="/jobprovider/job/:jobId/applications"
          element={<JobApplications />}
        />

        <Route path="/charity/sponsor-child" element={<SponsorChild />} />
        <Route
          path="/charity/view-sponsored-children"
          element={<ViewSponsoredChildren />}
        />
        <Route
          path="/socialworker/dashboard/sponsored-children"
          element={<SocialWorkerSponsorship />}
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
