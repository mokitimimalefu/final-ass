import React, { useState } from 'react';

const InstitutionsTab = ({ institutions, applications, handleApplication, canApplyToCourse }) => {
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

  // Get unique locations for filter
  const locations = ['All Locations', ...new Set(institutions
    .filter(inst => inst.location)
    .map(inst => inst.location)
  )];

  // Toggle institution expansion
  const toggleInstitutionExpansion = (institutionId) => {
    const newExpanded = new Set(expandedInstitutions);
    if (newExpanded.has(institutionId)) {
      newExpanded.delete(institutionId);
    } else {
      newExpanded.add(institutionId);
    }
    setExpandedInstitutions(newExpanded);
  };

  // Filter institutions based on search and location
  const filteredInstitutions = institutions
    .filter(institution => institution.isActive !== false)
    .filter(institution => {
      // Search filter
      const matchesSearch = institution.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           institution.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Location filter
      const matchesLocation = locationFilter === 'All Locations' || 
                             institution.location === locationFilter;
      
      // Course filter
      const hasMatchingCourse = institution.faculties?.some(faculty => 
        faculty.courses?.some(course => 
          course.name?.toLowerCase().includes(courseFilter.toLowerCase())
        )
      );
      
      const matchesCourse = !courseFilter || hasMatchingCourse;
      
      return matchesSearch && matchesLocation && matchesCourse;
    });

  // Check application status for a course
  const getApplicationStatus = (institutionId, courseId) => {
    const application = applications.find(
      app => app.instituteId === institutionId && app.courseId === courseId
    );
    return application ? application.status : null;
  };

  // Count total courses in an institution
  const countTotalCourses = (institution) => {
    return institution.faculties?.reduce((total, faculty) => {
      return total + (faculty.courses?.length || 0);
    }, 0) || 0;
  };

  // Count total faculties in an institution
  const countTotalFaculties = (institution) => {
    return institution.faculties?.length || 0;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-0">Available Institutions</h2>
          <p className="text-muted mb-0">Browse and apply to courses (max 2 applications per institution)</p>
        </div>
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
            <p className="text-muted small">
              {searchTerm || locationFilter !== 'All Locations' || courseFilter
                ? 'Try adjusting your search or filters' 
                : 'Please check back later for new institutions'}
            </p>
          </div>
        ) : (
          filteredInstitutions.map(institution => {
            const isExpanded = expandedInstitutions.has(institution.id);
            const totalCourses = countTotalCourses(institution);
            const totalFaculties = countTotalFaculties(institution);
            
            return (
              <div key={institution.id} className="col-12">
                <div className="card shadow-sm">
                  {/* Institution Header */}
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h4 className="mb-1">{institution.name || 'Unnamed Institution'}</h4>
                          {institution.location && (
                            <div className="d-flex align-items-center gap-3 text-white-50">
                              <small>
                                <i className="bi bi-geo-alt me-1"></i>
                                {institution.location}
                              </small>
                              <small>
                                <i className="bi bi-building me-1"></i>
                                {totalFaculties} Faculty{totalFaculties !== 1 ? 's' : ''}
                              </small>
                              <small>
                                <i className="bi bi-book me-1"></i>
                                {totalCourses} Course{totalCourses !== 1 ? 's' : ''}
                              </small>
                            </div>
                          )}
                        </div>
                        <div className="text-end">
                          <span className="badge bg-light text-dark me-2">
                            {applications.filter(app => app.instituteId === institution.id).length}/2 applications
                          </span>
                          <button
                            onClick={() => toggleInstitutionExpansion(institution.id)}
                            className="btn btn-sm btn-light"
                          >
                            {isExpanded ? (
                              <>
                                <i className="bi bi-chevron-up me-1"></i>
                                Hide Courses
                              </>
                            ) : (
                              <>
                                <i className="bi bi-chevron-down me-1"></i>
                                Show Courses ({totalCourses})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Institution Description */}
                  <div className="card-body border-bottom">
                    <p className="text-muted mb-0">
                      {institution.description || 'No description available for this institution.'}
                    </p>
                  </div>

                  {/* Courses Section - Only show when expanded */}
                  {isExpanded && (
                    <div className="card-body p-0">
                      {institution.faculties && institution.faculties.length > 0 ? (
                        <div className="accordion accordion-flush" id={`institution-${institution.id}-faculties`}>
                          {institution.faculties.map((faculty, facultyIndex) => (
                            <div key={faculty.id} className="accordion-item">
                              <h2 className="accordion-header">
                                <button
                                  className="accordion-button collapsed bg-light"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#faculty-${faculty.id}`}
                                  aria-expanded="false"
                                  aria-controls={`faculty-${faculty.id}`}
                                >
                                  <div className="d-flex align-items-center w-100">
                                    <i className="bi bi-mortarboard text-primary me-3 fs-5"></i>
                                    <div className="flex-grow-1">
                                      <h5 className="mb-1">{faculty.name || 'Unnamed Faculty'}</h5>
                                      <small className="text-muted">
                                        {faculty.courses?.length || 0} course{(faculty.courses?.length || 0) !== 1 ? 's' : ''} available
                                      </small>
                                    </div>
                                    {faculty.description && (
                                      <small className="text-muted me-3">
                                        {faculty.description}
                                      </small>
                                    )}
                                  </div>
                                </button>
                              </h2>
                              <div
                                id={`faculty-${faculty.id}`}
                                className="accordion-collapse collapse"
                                data-bs-parent={`#institution-${institution.id}-faculties`}
                              >
                                <div className="accordion-body p-4">
                                  {faculty.courses && faculty.courses.length > 0 ? (
                                    <div className="row g-3">
                                      {faculty.courses.map(course => {
                                        const applicationStatus = getApplicationStatus(institution.id, course.id);
                                        const { canApply, reason } = canApplyToCourse(institution.id, course.id);
                                        const isDeadlinePassed = course.deadline && new Date(course.deadline) < new Date();
                                        const isCourseActive = course.isActive !== false;
                                        
                                        return (
                                          <div key={course.id} className="col-md-6 col-lg-4">
                                            <div className={`card h-100 border ${!isCourseActive ? 'opacity-75' : ''}`}>
                                              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0 text-truncate">{course.name || 'Unnamed Course'}</h6>
                                                {!isCourseActive && (
                                                  <span className="badge bg-warning">Inactive</span>
                                                )}
                                              </div>
                                              <div className="card-body">
                                                {/* Course Details */}
                                                {course.description && (
                                                  <p className="small text-muted mb-3">{course.description}</p>
                                                )}
                                                
                                                <div className="small text-muted mb-3">
                                                  {course.duration && (
                                                    <div className="d-flex align-items-center mb-1">
                                                      <i className="bi bi-clock me-2"></i>
                                                      <span>Duration: {course.duration}</span>
                                                    </div>
                                                  )}
                                                  {course.seats !== undefined && (
                                                    <div className="d-flex align-items-center mb-1">
                                                      <i className="bi bi-people me-2"></i>
                                                      <span>Seats: {course.seats}</span>
                                                    </div>
                                                  )}
                                                  {course.fees && (
                                                    <div className="d-flex align-items-center mb-1">
                                                      <i className="bi bi-currency-dollar me-2"></i>
                                                      <span>Fees: {course.fees}</span>
                                                    </div>
                                                  )}
                                                  {course.minimumGrade && (
                                                    <div className="d-flex align-items-start mb-1">
                                                      <i className="bi bi-award me-2 mt-1"></i>
                                                      <div>{renderMinimumGrade(course.minimumGrade)}</div>
                                                    </div>
                                                  )}
                                                  {course.deadline && (
                                                    <div className={`d-flex align-items-center mb-1 ${isDeadlinePassed ? 'text-danger' : ''}`}>
                                                      <i className="bi bi-calendar me-2"></i>
                                                      <span>
                                                        Deadline: {new Date(course.deadline).toLocaleDateString()}
                                                        {isDeadlinePassed && ' (Closed)'}
                                                      </span>
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
                                              <div className="card-footer bg-transparent border-top">
                                                {applicationStatus ? (
                                                  <div className="text-center">
                                                    <span className={`badge ${
                                                      applicationStatus === 'admitted' ? 'bg-success' :
                                                      applicationStatus === 'rejected' ? 'bg-danger' :
                                                      applicationStatus === 'confirmed' ? 'bg-primary' : 'bg-warning text-dark'
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
                                                    disabled={!canApply || isDeadlinePassed || !isCourseActive || !course.id || !institution.id}
                                                    title={
                                                      !canApply ? reason : 
                                                      isDeadlinePassed ? 'Application deadline has passed' :
                                                      !isCourseActive ? 'Course is not currently active' :
                                                      'Apply to this course'
                                                    }
                                                  >
                                                    {!isCourseActive ? 'Not Available' : 
                                                     isDeadlinePassed ? 'Closed' : 
                                                     'Apply Now'}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <i className="bi bi-book text-muted fs-1 mb-3"></i>
                                      <p className="text-muted">No courses available in this faculty</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="bi bi-mortarboard text-muted fs-1 mb-3"></i>
                          <h5 className="text-muted">No Faculties Available</h5>
                          <p className="text-muted small">This institution doesn't have any faculties set up yet.</p>
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

      {/* Summary */}
      {filteredInstitutions.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-muted">
            Showing {filteredInstitutions.length} institution{filteredInstitutions.length !== 1 ? 's' : ''} • 
            Total {filteredInstitutions.reduce((total, inst) => total + countTotalCourses(inst), 0)} courses available
          </p>
        </div>
      )}
    </div>
  );
};

export default InstitutionsTab;