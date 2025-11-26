import axios from 'axios';

// Use local backend during development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://final-group-5.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple subscribers to handle unauthorized globally (optional usage from UI)
const unauthorizedListeners = [];
export const onUnauthorized = (listener) => {
  if (typeof listener === 'function') {
    unauthorizedListeners.push(listener);
  }
  return () => {
    const idx = unauthorizedListeners.indexOf(listener);
    if (idx >= 0) unauthorizedListeners.splice(idx, 1);
  };
};

// Handle 401 responses: try to refresh Firebase ID token once, then report unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error?.response?.status;
    const isUnauthorized = status === 401;
    const notRetriedYet = !originalRequest._retry;
    if (isUnauthorized && notRetriedYet) {
      try {
        originalRequest._retry = true;
        // Lazy import to avoid circular deps and reduce bundle impact
        const { auth } = await import('../firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true);
          localStorage.setItem('token', newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // fall through to logout/redirect below
      }
    }
    // Optional: surface clearer messages for 403s
    if (status === 403) {
      console.warn('Access forbidden. Your account may not have the required permissions.');
    }
    // If still unauthorized (no user or refresh failed), clear token and notify listeners
    if (isUnauthorized) {
      try {
        localStorage.removeItem('token');
      } catch {}
      // Notify subscribers so UI can present a message or route without hard reload
      unauthorizedListeners.forEach((fn) => {
        try { fn(); } catch {}
      });
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const studentAPI = {
  getApplications: () => api.get('/student/applications'),
  applyForCourse: (instituteId, courseId, personalStatement, documents) =>
    api.post('/student/applications', { instituteId, courseId, personalStatement, documents }),
  getInstitutions: () => api.get('/student/institutions'),
  getJobs: () => api.get('/student/jobs'),
};

export const adminAPI = {
  getInstitutions: () => api.get('/admin/institutions'),
  addInstitution: (institutionData) =>
    api.post('/admin/institutions', institutionData),
  getCompanies: () => api.get('/admin/companies'),
};

export const instituteAPI = {
  // Faculty operations
  getFaculties: (instituteId) => api.get(`/institute/${instituteId}/faculties`),
  addFaculty: (instituteId, facultyData) => api.post(`/institute/${instituteId}/faculties`, facultyData),
  updateFaculty: (instituteId, facultyId, updateData) => api.put(`/institute/${instituteId}/faculties/${facultyId}`, updateData),
  deleteFaculty: (instituteId, facultyId) => api.delete(`/institute/${instituteId}/faculties/${facultyId}`),

  // Course operations (under faculties)
  getCourses: (instituteId, facultyId) => api.get(`/institute/${instituteId}/faculties/${facultyId}/courses`),
  addCourse: (instituteId, facultyId, courseData) => api.post(`/institute/${instituteId}/faculties/${facultyId}/courses`, courseData),
  updateCourse: (instituteId, facultyId, courseId, updateData) => api.put(`/institute/${instituteId}/faculties/${facultyId}/courses/${courseId}`, updateData),
  deleteCourse: (instituteId, facultyId, courseId) => api.delete(`/institute/${instituteId}/faculties/${facultyId}/courses/${courseId}`),

  // Application operations
  getApplications: (instituteId) => api.get(`/institute/${instituteId}/applications`),
  updateApplicationStatus: (instituteId, applicationId, status) =>
    api.put(`/institute/${instituteId}/applications/${applicationId}/status`, { status }),

  // Admissions
  publishAdmissions: (instituteId, admissionData) => api.post(`/institute/${instituteId}/admissions/publish`, { admissionData }),

  // Profile operations
  getProfile: (instituteId) => api.get(`/institute/${instituteId}/profile`),
  updateProfile: (instituteId, profileData) => api.put(`/institute/${instituteId}/profile`, profileData),
};

export const companyAPI = {
  // Profile operations
  getProfile: () => api.get('/company/profile'),
  updateProfile: (profileData) => api.put('/company/profile', profileData),

  // Job operations
  getJobs: () => api.get('/company/jobs'),
  createJob: (jobData) => api.post('/company/jobs', jobData),
  updateJob: (jobId, jobData) => api.put(`/company/jobs/${jobId}`, jobData),
  deleteJob: (jobId) => api.delete(`/company/jobs/${jobId}`),

  // Applicant operations
  getQualifiedApplicants: (jobId) => api.get(`/company/jobs/${jobId}/applicants`),
  updateApplicantStatus: (jobId, applicationId, status) =>
    api.put(`/company/jobs/${jobId}/applicants/${applicationId}`, { status }),
};

export default api;
