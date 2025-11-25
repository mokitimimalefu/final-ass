import React, { useState } from 'react';

const InstitutionsManagement = ({ 
  institutions, 
  applications, 
  handleApplication, 
  canApplyToCourse, 
  loading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [courseFilter, setCourseFilter] = useState('');
  const [expandedInstitutions, setExpandedInstitutions] = useState(new Set());

  const renderRequirements = (requirements) => {
    if (!requirements) return null;
    if (typeof requirements === 'string') return <p className="small text-muted mb-0">{requirements}</p>;
    if (Array.isArray(requirements)) {
      return (
        <ul className="small text-muted mb-0 ps-3">
          {requirements.map((item, idx) => (
            <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof requirements === 'object') {
      const { subjects, points, minGrade, ...rest } = requirements;
      return (
        <div className="small text-muted mb-0">
          {minGrade !== undefined && <div>Minimum Grade: {String(minGrade)}</div>}
          {points !== undefined && <div>Points: {String(points)}</div>}
          {subjects && (
            <div>
              Subjects:
              <ul className="mb-0 ps-3">
                {(Array.isArray(subjects) ? subjects : Object.keys(subjects || {})).map((s, idx) => (
                  <li key={idx}>{typeof s === 'string' ? s : JSON.stringify(s)}</li>
                ))}
              </ul>
            </div>
          )}
          {Object.keys(rest).length > 0 && (
            <div>Other: {JSON.stringify(rest)}</div>
          )}
        </div>
      );
    }
    return <p className="small text-muted mb-0">{String(requirements)}</p>;
  };

  const renderMinimumGrade = (minimumGrade) => {
    if (!minimumGrade) return null;
    if (typeof minimumGrade === 'string' || typeof minimumGrade === 'number') {
      return <span>Min Grade: {minimumGrade}</span>;
    }
    if (typeof minimumGrade === 'object') {
      const { minGrade, points, subjects, ...rest } = minimumGrade;
      return (
        <div>
          {minGrade !== undefined && <div>Min Grade: {String(minGrade)}</div>}
          {points !== undefined && <div>Points: {String(points)}</div>}
          {subjects && (
            <div>
              Subjects:
              <ul className="mb-0 ps-3">
                {(Array.isArray(subjects) ? subjects : Object.keys(subjects || {})).map((s, idx) => (
                  <li key={idx}>{typeof s === 'string' ? s : JSON.stringify(s)}</li>
                ))}
              </ul>
            </div>
          )}
          {Object.keys(rest).length > 0 && <div>Other: {JSON.stringify(rest)}</div>}
        </div>
      );
    }
    return <span>Min Grade: {String(minimumGrade)}</span>;
  };
  const toggleInstitutionExpansion = (institutionId) => {
    const newExpanded = new Set(expandedInstitutions);
    if (newExpanded.has(institutionId)) {
      newExpanded.delete(institutionId);
    } else {
      newExpanded.add(institutionId);
    }
    setExpandedInstitutions(newExpanded);
  };

  // Get unique locations
  const locations = ['All Locations', ...new Set(institutions
    .filter(inst => inst.location)
    .map(inst => inst.location)
  )];

  // Filter institutions
  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = institution.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         institution.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'All Locations' || 
                           institution.location === locationFilter;
    
    const hasMatchingCourse = institution.faculties?.some(faculty => 
      faculty.courses?.some(course => 
        course.name?.toLowerCase().includes(courseFilter.toLowerCase())
      )
    );
    
    return matchesSearch && matchesLocation && (!courseFilter || hasMatchingCourse);
  });

  // Count courses in institution
  const countTotalCourses = (institution) => {
    return institution.faculties?.reduce((total, faculty) => {
      return total + (faculty.courses?.length || 0);
    }, 0) || 0;
  };

  // Check application status
  const getApplicationStatus = (institutionId, courseId) => {
    const application = applications.find(
      app => app.instituteId === institutionId && app.courseId === courseId
    );
    return application ? application.status : null;
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading institutions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Browse Institutions</h2>
        <div className="d-flex gap-2">
          <input
            type="text"
            placeholder="Search institutions..."
            className="form-control"
            style={{ width: '200px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search courses..."
            className="form-control"
            style={{ width: '200px' }}
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          />
          <select 
            className="form-select" 
            style={{ width: '150px' }}
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Application Info */}
      {applications.length > 0 && (
        <div className="alert alert-info mb-4">
          <strong>Application Status:</strong> You have {applications.length} application(s) submitted. 
          You can apply to maximum 2 courses per institution.
        </div>
      )}

      <div className="row g-4">
        {filteredInstitutions.length === 0 ? (
          <div className="col-12 text-center py-5">
            <i className="bi bi-building text-muted fs-1 mb-3"></i>
            <h5 className="text-muted">
              {institutions.length === 0 
                ? 'No institutions available' 
                : 'No institutions match your search criteria'}
            </h5>
          </div>
        ) : (
          filteredInstitutions.map(institution => {
            const isExpanded = expandedInstitutions.has(institution.id);
            const totalCourses = countTotalCourses(institution);
            const institutionApplications = applications.filter(app => app.instituteId === institution.id);

            return (
              <div key={institution.id} className="col-md-4">
                <div className="card shadow-sm h-100">
                  {/* Institution Header */}
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-2">{institution.name}</h5>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex align-items-center gap-3 text-white-50 small">
                        <span>
                          <i className="bi bi-geo-alt me-1"></i>
                          {institution.location}
                        </span>
                        <span>
                          <i className="bi bi-book me-1"></i>
                          {totalCourses} Course{totalCourses !== 1 ? 's' : ''}
                        </span>
                        <span>
                          <i className="bi bi-clock me-1"></i>
                          {institutionApplications.length}/2 Applications
                        </span>
                      </div>
                      <button
                        onClick={() => toggleInstitutionExpansion(institution.id)}
                        className="btn btn-light btn-sm align-self-start"
                      >
                        {isExpanded ? (
                          <>
                            <i className="bi bi-chevron-up me-1"></i>
                            Hide Courses
                          </>
                        ) : (
                          <>
                            <i className="bi bi-chevron-down me-1"></i>
                            Show Courses
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Institution Description */}
                  <div className="card-body border-bottom">
                    <p className="text-muted mb-0">
                      {institution.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Courses Section */}
                  {isExpanded && (
                    <div className="card-body p-0">
                      {institution.faculties && institution.faculties.length > 0 ? (
                        <div className="accordion accordion-flush">
                          {institution.faculties.map((faculty) => (
                            <div key={faculty.id} className="accordion-item">
                              <h2 className="accordion-header">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#faculty-${faculty.id}`}
                                >
                                  <i className="bi bi-mortarboard text-primary me-3"></i>
                                  <div>
                                    <h6 className="mb-1">{faculty.name}</h6>
                                    <small className="text-muted">
                                      {faculty.courses?.length || 0} course{(faculty.courses?.length || 0) !== 1 ? 's' : ''} available
                                    </small>
                                  </div>
                                </button>
                              </h2>
                              <div
                                id={`faculty-${faculty.id}`}
                                className="accordion-collapse collapse"
                              >
                                <div className="accordion-body">
                                  <div className="row g-3">
                                    {faculty.courses?.map(course => {
                                      const applicationStatus = getApplicationStatus(institution.id, course.id);
                                      const { canApply, reason } = canApplyToCourse(institution.id, course.id);
                                      const isDeadlinePassed = course.deadline && new Date(course.deadline) < new Date();
                                      
                                      return (
                                        <div key={course.id} className="col-md-6 col-lg-4">
                                          <div className="card h-100 border">
                                            <div className="card-header bg-light">
                                              <h6 className="mb-0 text-primary">{course.name}</h6>
                                              {course.code && (
                                                <small className="text-muted">Code: {course.code}</small>
                                              )}
                                            </div>
                                            <div className="card-body">
                                              {course.description && (
                                                <p className="small text-muted mb-3">{course.description}</p>
                                              )}
                                              
                                              <div className="small text-muted mb-3">
                                                {course.duration && (
                                                  <div className="d-flex align-items-center mb-1">
                                                    <i className="bi bi-clock me-2"></i>
                                                    <span>{course.duration}</span>
                                                  </div>
                                                )}
                                                {course.seats !== undefined && (
                                                  <div className="d-flex align-items-center mb-1">
                                                    <i className="bi bi-people me-2"></i>
                                                    <span>{course.seats} seats</span>
                                                  </div>
                                                )}
                                                {course.fees && (
                                                  <div className="d-flex align-items-center mb-1">
                                                    <i className="bi bi-currency-dollar me-2"></i>
                                                    <span>{course.fees}</span>
                                                  </div>
                                                )}
                                                {course.minimumGrade && (
                                                  <div className="d-flex align-items-start mb-1">
                                                    <i className="bi bi-award me-2 mt-1"></i>
                                                    <div>{renderMinimumGrade(course.minimumGrade)}</div>
                                                  </div>
                                                )}
                                              </div>

                                              {course.requirements && (
                                                <div className="mb-3">
                                                  <small className="fw-bold">Requirements:</small>
                                                  {renderRequirements(course.requirements)}
                                                </div>
                                              )}
                                            </div>
                                            <div className="card-footer bg-transparent">
                                              {applicationStatus ? (
                                                <div className="text-center">
                                                  <span className={`badge ${
                                                    applicationStatus === 'admitted' ? 'bg-success' :
                                                    applicationStatus === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
                                                  }`}>
                                                    {applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
                                                  </span>
                                                  <div className="mt-1">
                                                    <small className="text-muted">Already Applied</small>
                                                  </div>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={() => handleApplication(institution, course)}
                                                  className="btn btn-primary w-100"
                                                  disabled={!canApply || isDeadlinePassed}
                                                  title={!canApply ? reason : isDeadlinePassed ? 'Application deadline has passed' : 'Apply to this course'}
                                                >
                                                  {isDeadlinePassed ? 'Closed' : 'Apply Now'}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">No faculties available in this institution.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InstitutionsManagement;