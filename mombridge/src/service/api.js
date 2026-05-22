import axios from "axios";

/* ---------------------------------------
   Axios Instance
--------------------------------------- */
const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json",
  },
});
export const baseURL = "http://127.0.0.1:5000";
/* ---------------------------------------
   AUTH APIs
--------------------------------------- */

export const loginApi = (data) => {
  console.log(data);
  return api.post("/login", data);
};

export const registerJobProviderApi = (data) => {
  return api.post("/register-jobprovider", data);
};

export const registerCharityProviderApi = (data) => {
  return api.post("/register-charityprovider", data);
};

export const AddJobApi = (data) => {
  return api.post("/jobprovider/add-job", data);
};

export const getJobsByProviderApi = (login_id) => api.get(`/jobs/${login_id}`);

export const getJobProviderProfileApi = (login_id) =>
  api.get(`/job-provider/profile/${login_id}`);

export const updateJobProviderProfileApi = (login_id, data) => {
  console.log("Updating profile for:", login_id, data);
  return api.put(`/job-provider/profile/${login_id}`, data);
};

export const changePasswordApi = (login_id, data) => {
  return api.put(`/job-provider/change-password/${login_id}`, data);
};

export const submitDonationApi = (data) => {
  return api.post("/charity/donate", data);
};

export const getCharityProfileApi = (login_id) => {
  return api.get(`/charity/profile/${login_id}`);
};

export const updateCharityProfileApi = (login_id, data) => {
  console.log("Updating charity profile:", login_id, data);
  return api.put(`/charity/profile/${login_id}`, data);
};

export const getAllCharityProvidersApi = () => {
  return api.get("/api/charity-providers"); // returns array of charity providers
};

// Approve a charity provider
export const approveCharityProviderApi = (id) => {
  return api.post(`/api/charity-providers/${id}/approve`, {
    status: "Approved",
  });
};

// Reject a charity provider
export const rejectCharityProviderApi = (id) => {
  return api.post(`/api/charity-providers/${id}/reject`, {
    status: "Rejected",
  });
};

export const getAllJobProvidersApi = () => {
  return api.get("/api/job-providers");
};

export const approveJobProviderApi = (id) => {
  return api.post(`/api/job-providers/${id}/approve`, { status: "Approved" });
};

export const rejectJobProviderApi = (id) => {
  return api.post(`/api/job-providers/${id}/reject`, { status: "Rejected" });
};

export const getadminCharityApi = (id) => {
  return api.get("/admin/charities");
};

// service/api.js
export const getSingleJobApi = (jobId) => api.get(`/jobprovider/job/${jobId}`);

export const updateJobApi = (jobId, data) =>
  api.put(`/jobprovider/job/${jobId}`, data);

export const deleteJobApi = (jobId) =>
  api.delete(`/jobprovider/delete-job/${jobId}`);

/* ---------------------------------------
   CHARITY DONATION APIs
--------------------------------------- */

export const getMyDonationsApi = (login_id) =>
  api.get(`/charity/my-donations/${login_id}`);

export const deleteDonationApi = (donationId) =>
  api.delete(`/charity/delete-donation/${donationId}`);

export const getSingleDonationApi = (donationId) =>
  api.get(`/charity/get-donation/${donationId}`);

export const updateDonationApi = async (donationId, data) => {
  const response = await fetch(
    `http://localhost:5000/charity/update-donation/${donationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Update failed");
  }

  return result;
};
export const createSocialWorkerApi = (data) =>
  api.post("/admin/create-socialworker", data);

// Get all donations for social worker
export const getAllDonationsApi = () => api.get("/social-worker/donations");

// Update donation status
export const updateDonationStatusApi = (id, data) =>
  api.put(`/social-worker/update-status/${id}`, data);

export const getDonationSummaryApi = () => api.get("/admin/donation-summary");

export const getJobApplicationsApi = (jobprovider_login_id) => {
  return api.post("/jobprovider/job-applications", {
    jobprovider_login_id,
  });
};

export const updateApplicationStatusApi = (application_id, status) => {
  return api.post("/jobprovider/update-application-status", {
    application_id,
    status,
  });
};

export const getPendingMoms = () => api.get("/socialworker/pending-moms");

export const verifyMom = (momId) =>
  api.put(`/socialworker/verify-mom/${momId}`);

export const getSponsorshipRequestsApi = () => {
  return api.get("/admin/view-sponsorship-requests");
};

export const approveSponsorshipApi = (data) => {
  return api.post("/admin/approve-sponsorship", data);
};

// export const rejectSponsorshipApi = (data) => {
//   return api.post("/admin/reject-sponsorship", data);
// };

export const getApprovedSponsorshipsApi = () => {
  return api.get("/charity/view-approved-sponsorships");
};

export const sponsorChildApi = (request_id, sponsor_id) => {
  const formData = new FormData();

  formData.append("request_id", request_id);
  formData.append("sponsor_id", sponsor_id);

  return api.post("/charity/sponsor-child", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
// src/service/api.js
export const getSponsoredChildrenApi = () => {
  return api.get("/charity/view-sponsored-children");
};
export const getSponsoredChildren = () =>
  api.get("/socialworker/sponsored-children");
export const completeSponsorshipApi = (id) =>
  api.patch(`/socialworker/complete-sponsorship/${id}`);
export default api;

export const getPendingJobsApi = () => {
  return api.get("/admin/pending-jobs");
};

export const approveJobApi = (job_id) => {
  return api.put(`/admin/approve-job/${job_id}`);
};

export const rejectJobApi = (job_id) => {
  return api.put(`/admin/reject-job/${job_id}`);
};

export const getPendingSponsorshipsApi = () => {
  return api.get("/socialworker/pending-sponsorships");
};

export const verifySponsorshipApi = (id) => {
  return api.put(`/socialworker/verify-sponsorship/${id}`);
};

export const rejectSponsorshipApi = (id) => {
  return api.put(`/socialworker/reject-sponsorship/${id}`);
};

export const getMomRequestsApi = async () => {
  const res = await fetch("http://localhost:5000/admin/mom-requests");
  return res.json();
};

// service/api.js
export const getSocialWorkersApi = async () => {
  try {
    const res = await fetch("http://localhost:5000/admin/social-workers");
    
    // Check if the response is ok
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    // Parse JSON safely
    const data = await res.json();

    // Return array or empty array fallback
    if (Array.isArray(data)) return data;
    if (data?.workers) return data.workers;

    return []; // fallback
  } catch (err) {
    console.error("Failed to fetch social workers:", err);
    return []; // fallback so frontend won't break
  }
};

export const assignWorkerApi = async (requestId, workerId) => {
  const res = await fetch(
    `http://localhost:5000/admin/assign-social-worker/${requestId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        social_worker_id: workerId,
      }),
    }
  );
 const data = await res.json();

  // 🔥 THIS IS THE FIX
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};

export const collectDonationApi = async (donationId, workerId) => {
  const res = await fetch(
    `http://localhost:5000/socialworker/collect-donation/${donationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worker_id: workerId,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to collect donation");
  }

  return data;
};

// src/service/api.js

// Get notifications
// Corrected version
export const getNotificationsApi = async (userId) => {
  try {
    const res = await api.get(`/notifications/${userId}`);
    // filter out notifications handled by this user
    return res.data.filter(n => 
      !n.read && (!n.handled_by || !n.handled_by.map(id => id.toString()).includes(userId))
    );
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};
export const markNotificationReadApi = async (notificationId, userId) => {
  try {
    const res = await api.put(`/notifications/mark-read/${notificationId}`, {
      userId: userId
    });
    return res.data;
  } catch (err) {
    console.error("Error marking notification as read:", err);
    throw err;
  }
};
export const changeCharityPasswordApi = (login_id, oldPassword, newPassword) => {
  return axios.put(`http://127.0.0.1:5000/change-password/${login_id}`, {
    oldPassword,
    newPassword,
  });
};

export const getVerifiedMomsApi = async () => {
  return await axios.get("http://127.0.0.1:5000/admin/verified-moms");
};

export const rejectMom = (id) =>
  axios.put(`http://localhost:5000/reject-mom/${id}`);