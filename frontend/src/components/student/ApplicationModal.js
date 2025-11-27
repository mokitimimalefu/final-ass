import React, { useState, useEffect } from 'react';

const ApplicationModal = ({
  showApplicationModal,
  setShowApplicationModal,
  selectedCourse,
  applicationForm,
  setApplicationForm,
  submitApplication,
  loading
}) => {
  const [localForm, setLocalForm] = useState({
    personalStatement: '',
    documents: []
  });

  // Sync with parent component's form state when modal opens
  useEffect(() => {
    if (showApplicationModal) {
      setLocalForm(applicationForm);
    }
  }, [showApplicationModal, applicationForm]);

  // Update parent component's form state when local form changes
  useEffect(() => {
    setApplicationForm(localForm);
  }, [localForm, setApplicationForm]);

  const handlePersonalStatementChange = (e) => {
    setLocalForm(prev => ({
      ...prev,
      personalStatement: e.target.value
    }));
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files);
    setLocalForm(prev => ({
      ...prev,
      documents: files
    }));
  };

  const handleClose = () => {
    setShowApplicationModal(false);
    setLocalForm({ personalStatement: '', documents: [] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitApplication();
  };

  if (!showApplicationModal || !selectedCourse) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Apply for Course</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
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
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Personal Statement *</label>
                <textarea
                  className="form-control"
                  rows="6"
                  value={localForm.personalStatement}
                  onChange={handlePersonalStatementChange}
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
                  onChange={handleDocumentsChange}
                  disabled={loading}
                />
                <div className="form-text">
                  Upload any supporting documents (transcripts, certificates, etc.). Max file size: 10MB each.
                </div>
                
                {/* Show selected files */}
                {localForm.documents.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">Selected files:</small>
                    <ul className="list-unstyled mt-1">
                      {localForm.documents.map((file, index) => (
                        <li key={index} className="small">
                          <i className="bi bi-file-text me-1"></i>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !localForm.personalStatement.trim()}
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
