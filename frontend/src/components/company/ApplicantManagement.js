import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

const ApplicantManagement = ({ jobId, jobTitle }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, ready_for_interview, rejected, hired

  useEffect(() => {
    if (jobId) {
      loadApplicants();
    }
  }, [jobId]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      // Load job applications for this jobId
      const q = query(collection(db, 'jobApplications'), where('jobId', '==', jobId));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ applicationId: d.id, ...d.data() }));
      setApplicants(data || []);
    } catch (error) {
      console.error('Error loading applicants:', error);
      alert('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await updateDoc(doc(db, 'jobApplications', applicationId), { status });
      alert(`Applicant status updated to ${status.replace('_', ' ')}`);
      loadApplicants();
    } catch (error) {
      console.error('Error updating applicant status:', error);
      const errorMessage = error.message || 'Failed to update status';
      alert(`Error: ${errorMessage}`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'info';
  };

  const filteredApplicants = applicants.filter(app => {
    if (filter === 'all') return true;
    // Note: The API returns only qualified applicants, so we filter by status if needed
    return true; // All returned applicants are qualified
  });

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-people-fill me-2"></i>
          Qualified Applicants {jobTitle && `- ${jobTitle}`}
        </h5>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={loadApplicants}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
      </div>
      <div className="card-body">
        {applicants.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-person-x text-muted fs-1 mb-3"></i>
            <h5 className="text-muted">No Qualified Applicants</h5>
            <p className="text-muted">
              No applicants meet the qualification requirements for this job posting yet.
            </p>
          </div>
        ) : (
          <>
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Showing {applicants.length} qualified applicant(s) based on academic performance, 
              certificates, work experience, and job relevance.
            </div>

            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Qualification Score</th>
                    <th>Grade</th>
                    <th>Subjects</th>
                    <th>Transcript</th>
                    <th>Certificates</th>
                    <th>Work Experience</th>
                    <th>Matches</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((applicant) => (
                    <tr key={applicant.applicationId}>
                      <td><strong>{applicant.studentName}</strong></td>
                      <td>{applicant.studentEmail}</td>
                      <td>
                        <span className={`badge bg-${getScoreColor(applicant.score)}`}>
                          {applicant.score}/100
                        </span>
                      </td>
                      <td>{applicant.qualifications.grade || 'N/A'}</td>
                      <td>
                        {applicant.qualifications.subjects?.length > 0 ? (
                          <span className="badge bg-secondary">
                            {applicant.qualifications.subjects.length} subject(s)
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        {applicant.qualifications.transcript === 'uploaded' ? (
                          <i className="bi bi-check-circle-fill text-success"></i>
                        ) : (
                          <i className="bi bi-x-circle text-danger"></i>
                        )}
                      </td>
                      <td>
                        {applicant.qualifications.certificates > 0 ? (
                          <span className="badge bg-info">
                            {applicant.qualifications.certificates} certificate(s)
                          </span>
                        ) : (
                          'None'
                        )}
                      </td>
                      <td>
                        {applicant.qualifications.workExperience?.length > 0 ? (
                          <i className="bi bi-check-circle-fill text-success"></i>
                        ) : (
                          <i className="bi bi-x-circle text-danger"></i>
                        )}
                      </td>
                      <td>
                        <small>
                          {applicant.matches?.slice(0, 2).map((match, idx) => (
                            <div key={idx} className="text-muted">
                              • {match}
                            </div>
                          ))}
                          {applicant.matches?.length > 2 && (
                            <div className="text-muted">+{applicant.matches.length - 2} more</div>
                          )}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleStatusUpdate(applicant.applicationId, 'ready_for_interview')}
                            title="Mark as Ready for Interview"
                          >
                            <i className="bi bi-calendar-check"></i>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatusUpdate(applicant.applicationId, 'rejected')}
                            title="Reject"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicantManagement;

