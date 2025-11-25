import React, { useState } from 'react';

const DocumentsManagement = ({ transcripts, certificates, uploadDocument, loading }) => {
  const [activeTab, setActiveTab] = useState('transcripts');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        await uploadDocument(file, type);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const DocumentList = ({ documents, type }) => (
    <div className="mt-3">
      {documents.length === 0 ? (
        <div className="text-center py-4">
          <i className={`bi bi-${type === 'transcript' ? 'file-earmark-text' : 'award'} text-muted fs-1 mb-3`}></i>
          <h5 className="text-muted">No {type}s Uploaded</h5>
          <p className="text-muted">Upload your {type}s to complete your profile.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div>
                      <strong>{doc.name}</strong>
                      <div className="text-muted small">
                        {Math.round(doc.size / 1024)} KB
                      </div>
                    </div>
                  </td>
                  <td>
                    {doc.uploadDate?.toDate?.() 
                      ? new Date(doc.uploadDate.toDate()).toLocaleDateString()
                      : new Date(doc.uploadDate).toLocaleDateString()
                    }
                  </td>
                  <td>
                    <span className={`badge ${doc.isVerified ? 'bg-success' : 'bg-warning'}`}>
                      {doc.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </td>
                  <td>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary me-2"
                    >
                      <i className="bi bi-eye me-1"></i>View
                    </a>
                    <button className="btn btn-sm btn-outline-danger">
                      <i className="bi bi-trash me-1"></i>Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Documents</h2>
        <div>
          <span className="badge bg-primary me-2">
            {transcripts.length} Transcript{transcripts.length !== 1 ? 's' : ''}
          </span>
          <span className="badge bg-success">
            {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Upload Documents</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Upload Academic Transcripts</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, 'transcript')}
                disabled={uploading}
              />
              <div className="form-text">
                Upload your academic transcripts (PDF, DOC, JPG, PNG). Max file size: 10MB each.
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Upload Certificates</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, 'certificate')}
                disabled={uploading}
              />
              <div className="form-text">
                Upload additional certificates (PDF, DOC, JPG, PNG). Max file size: 10MB each.
              </div>
            </div>
          </div>
          {uploading && (
            <div className="mt-3 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Uploading...</span>
              </div>
              <p className="mt-2">Uploading documents...</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Tabs */}
      <ul className="nav nav-tabs mb-3" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'transcripts' ? 'active' : ''}`}
            onClick={() => setActiveTab('transcripts')}
          >
            <i className="bi bi-file-earmark-text me-2"></i>
            Academic Transcripts ({transcripts.length})
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            <i className="bi bi-award me-2"></i>
            Certificates ({certificates.length})
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {activeTab === 'transcripts' && (
          <DocumentList documents={transcripts} type="transcript" />
        )}
        {activeTab === 'certificates' && (
          <DocumentList documents={certificates} type="certificate" />
        )}
      </div>
    </div>
  );
};

export default DocumentsManagement;