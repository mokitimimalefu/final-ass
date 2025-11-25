import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import ApplicantManagement from './ApplicantManagement';

const JobList = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showApplicants, setShowApplicants] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      if (!currentUser?.uid) return;
      const q = query(collection(db, 'jobs'), where('companyId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      alert('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      alert('Job deleted successfully');
      loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      const errorMessage = error.message || 'Failed to delete job';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleViewApplicants = (jobId) => {
    setSelectedJobId(jobId);
    setShowApplicants(true);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (showApplicants && selectedJobId) {
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    return (
      <div>
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => {
            setShowApplicants(false);
            setSelectedJobId(null);
          }}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Jobs
        </button>
        <ApplicantManagement jobId={selectedJobId} jobTitle={selectedJob?.title} />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <i className="bi bi-briefcase me-2"></i>
          My Job Postings
        </h4>
        <span className="badge bg-primary">{jobs.length} job(s) posted</span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-briefcase text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No Job Postings</h5>
          <p className="text-muted">You haven't posted any jobs yet. Create your first job posting!</p>
        </div>
      ) : (
        <div className="row g-4">
          {jobs.map((job) => (
            <div key={job.id} className="col-md-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{job.title}</h5>
                  {job.isActive ? (
                    <span className="badge bg-success">Active</span>
                  ) : (
                    <span className="badge bg-secondary">Inactive</span>
                  )}
                </div>
                <div className="card-body">
                  <p className="card-text">{job.description}</p>
                  
                  <div className="mb-2">
                    {job.location && (
                      <span className="badge bg-info me-2">
                        <i className="bi bi-geo-alt me-1"></i>
                        {job.location}
                      </span>
                    )}
                    {job.salaryRange && (
                      <span className="badge bg-success me-2">
                        <i className="bi bi-cash me-1"></i>
                        {job.salaryRange}
                      </span>
                    )}
                  </div>

                  {job.qualifications && (
                    <div className="mb-2">
                      <small className="text-muted">
                        <strong>Requirements:</strong>
                        {job.qualifications.minimumGrade && (
                          <span className="ms-2">Min Grade: {job.qualifications.minimumGrade}</span>
                        )}
                        {job.qualifications.requiredSubjects?.length > 0 && (
                          <span className="ms-2">
                            Subjects: {job.qualifications.requiredSubjects.join(', ')}
                          </span>
                        )}
                        {job.qualifications.workExperience && (
                          <span className="ms-2">Work Experience Required</span>
                        )}
                      </small>
                    </div>
                  )}

                  <div className="text-muted small mb-3">
                    <i className="bi bi-calendar me-1"></i>
                    Posted: {new Date(job.postedAt?.seconds ? job.postedAt.seconds * 1000 : job.postedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="card-footer">
                  <div className="btn-group w-100" role="group">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleViewApplicants(job.id)}
                    >
                      <i className="bi bi-people me-1"></i>
                      View Applicants
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;

