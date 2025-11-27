import axios from 'axios';

// Use environment variable for backend URL, fallback to deployed URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://final-ass.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10s timeout
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: global 401 handler
const unauthorizedListeners = [];
export const onUnauthorized = (listener) => {
  if (typeof listener === 'function') unauthorizedListeners.push(listener);
  return () => {
    const idx = unauthorizedListeners.indexOf(listener);
    if (idx >= 0) unauthorizedListeners.splice(idx, 1);
  };
};

// Response interceptor to refresh Firebase token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error?.response?.status;
    const notRetriedYet = !originalRequest._retry;

    if (status === 401 && notRetriedYet) {
      try {
        originalRequest._retry = true;
        const { auth } = await import('../firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true);
          localStorage.setItem('token', newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {}
    }

    if (status === 403) {
      console.warn('Access forbidden. Insufficient permissions.');
    }

    if (status === 401) {
      localStorage.removeItem('token');
      unauthorizedListeners.forEach((fn) => {
        try { fn(); } catch {}
      });
    }

    return Promise.reject(error);
  }
);

// Auth API routes
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
};

// Student API routes
export const studentAPI = {
  getApplications: () => api.get('/api/student/applications'),
  applyForCourse: (instituteId, courseId, personalStatement, documents) =>
    api.post('/api/student/applications', { instituteId, courseId, personalStatement, documents }),
  getInstitutions: () => api.get('/api/student/institutions'),
  getJobs: () => api.get('/api/student/jobs'),
};

// Admin API routes
export const adminAPI = {
  getInstitutions: () => api.get('/api/admin/institutions'),
  addInstitution: (institutionData) => api.post('/api/admin/institutions', institutionData),
  getCompanies: () => api.get('/api/admin/companies'),
};

// Institute API routes
export const instituteAPI = {
  getFaculties: (instituteId) => api.get(`/api/institute/${instituteId}/faculties`),
  addFaculty: (instituteId, facultyData) => api.post(`/api/institute/${instituteId}/faculties`, facultyData),
  updateFaculty: (instituteId, facultyId, updateData) =>
    api.put(`/api/institute/${instituteId}/faculties/${facultyId}`, updateData),
  deleteFaculty: (instituteId, facultyId) => api.delete(`/api/institute/${instituteId}/faculties/${facultyId}`),

  getCourses: (instituteId, facultyId) => api.get(`/api/institute/${instituteId}/faculties/${facultyId}/courses`),
  addCourse: (instituteId, facultyId, courseData) =>
    api.post(`/api/institute/${instituteId}/faculties/${facultyId}/courses`, courseData),
  updateCourse: (instituteId, facultyId, courseId, updateData) =>
    api.put(`/api/institute/${instituteId}/faculties/${facultyId}/courses/${courseId}`, updateData),
  deleteCourse: (instituteId, facultyId, courseId) =>
    api.delete(`/api/institute/${instituteId}/faculties/${facultyId}/courses/${courseId}`),

  getApplications: (instituteId) => api.get(`/api/institute/${instituteId}/applications`),
  updateApplicationStatus: (instituteId, applicationId, status) =>
    api.put(`/api/institute/${instituteId}/applications/${applicationId}/status`, { status }),

  publishAdmissions: (instituteId, admissionData) =>
    api.post(`/api/institute/${instituteId}/admissions/publish`, { admissionData }),

  getProfile: (instituteId) => api.get(`/api/institute/${instituteId}/profile`),
  updateProfile: (instituteId, profileData) => api.put(`/api/institute/${instituteId}/profile`, profileData),
};

// Company API routes
export const companyAPI = {
  getProfile: () => api.get('/api/company/profile'),
  updateProfile: (profileData) => api.put('/api/company/profile', profileData),

  getJobs: () => api.get('/api/company/jobs'),
  createJob: (jobData) => api.post('/api/company/jobs', jobData),
  updateJob: (jobId, jobData) => api.put(`/api/company/jobs/${jobId}`, jobData),
  deleteJob: (jobId) => api.delete(`/api/company/jobs/${jobId}`),

  getQualifiedApplicants: (jobId) => api.get(`/api/company/jobs/${jobId}/applicants`),
  updateApplicantStatus: (jobId, applicationId, status) =>
    api.put(`/api/company/jobs/${jobId}/applicants/${applicationId}`, { status }),
};

export default api;
