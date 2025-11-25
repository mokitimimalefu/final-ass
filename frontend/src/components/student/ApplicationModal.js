import React from 'react';

const ApplicationModal = ({
  showApplicationModal,
  setShowApplicationModal,
  selectedCourse,
  applicationForm,
  setApplicationForm,
  submitApplication,
  loading
}) => {
  if (!showApplicationModal || !selectedCourse) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Apply for Course</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setShowApplicationModal(false);
                setApplicationForm({ personalStatement: '', documents: [] });
              }}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            {/* Course Information */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">Course Information</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Course:</strong> {selectedCourse.course.name}</p>
                    <p><strong>Institution:</strong> {selectedCourse.institution.name}</p>
                    <p><strong>Faculty:</strong> {
                      selectedCourse.institution.faculties?.find(f => f.id === selectedCourse.course.facultyId)?.name || 'N/A'
                    }</p>
                  </div>
                  <div className="col-md-6">
                    {selectedCourse.course.duration && (
                      <p><strong>Duration:</strong> {selectedCourse.course.duration}</p>
                    )}
                    {selectedCourse.course.fees && (
                      <p><strong>Fees:</strong> {selectedCourse.course.fees}</p>
                    )}
                    {selectedCourse.course.deadline && (
                      <p><strong>Deadline:</strong> {new Date(selectedCourse.course.deadline).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              submitApplication();
            }}>
              <div className="mb-3">
                <label className="form-label">Personal Statement *</label>
                <textarea
                  className="form-control"
                  rows="6"
                  value={applicationForm.personalStatement}
                  onChange={(e) => setApplicationForm(prev => ({
                    ...prev,
                    personalStatement: e.target.value
                  }))}
                  placeholder="Tell us why you are interested in this course and why you would be a good candidate..."
                  required
                  disabled={loading}
                />
                <div className="form-text">
                  Write a compelling personal statement explaining your interest in this course and your qualifications.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Supporting Documents (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setApplicationForm(prev => ({
                      ...prev,
                      documents: files
                    }));
                  }}
                  disabled={loading}
                />
                <div className="form-text">
                  Upload any supporting documents (transcripts, certificates, etc.). Max file size: 10MB each.
                </div>
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> By submitting this application, you agree to the institution's terms and conditions. 
                You will be notified via email about your application status.
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowApplicationModal(false);
                setApplicationForm({ personalStatement: '', documents: [] });
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitApplication}
              disabled={loading || !applicationForm.personalStatement.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;