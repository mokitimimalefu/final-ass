import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseService';
import { storage } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import DashboardOverview from '../../components/student/DashboardOverview';
import ApplicationsManagement from '../../components/student/ApplicationsManagement';
import InstitutionsManagement from '../../components/student/InstitutionsManagement';
import JobsManagement from '../../components/student/JobsManagement';
import ProfileManagement from '../../components/student/ProfileManagement';
import DocumentsManagement from '../../components/student/DocumentsManagements';
import ApplicationModal from '../../components/student/ApplicationModal';
import NotificationBell from '../../components/student/NotificationBell';

const StudentDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [data, setData] = useState({
    applications: [],
    institutions: [],
    jobs: [],
    allCourses: [],
    notifications: [],
    profile: {},
    transcripts: [],
    certificates: []
  });
  
  const [ui, setUi] = useState({
    activeTab: 'dashboard',
    loading: false,
    loadingApplications: true,
    loadingInstitutions: false,
    loadingJobs: true,
    loadingProfile: true,
    loadingTranscripts: true,
    loadingCertificates: true,
    loadingAllCourses: false,
    sidebarOpen: false
  });
  
  const [application, setApplication] = useState({
    selectedCourse: null,
    showApplicationModal: false,
    form: {
      personalStatement: '',
      documents: []
    }
  });

  // Tab configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'applications', label: 'My Applications', icon: '📝' },
    { id: 'institutions', label: 'Browse Institutions', icon: '🏫' },
    { id: 'courses', label: 'All Courses', icon: '📚' },
    { id: 'jobs', label: 'Job Opportunities', icon: '💼' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'documents', label: 'My Documents', icon: '📁' }
  ];

  // Helper functions
  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const updateUi = (key, value) => {
    setUi(prev => ({ ...prev, [key]: value }));
  };

  const updateApplicationState = (key, value) => {
    setApplication(prev => ({ ...prev, [key]: value }));
  };

  // Data fetching functions
  const fetchApplications = useCallback(async () => {
    try {
      if (!currentUser) return;
      updateUi('loadingApplications', true);

      const q = query(
        collection(db, 'applications'),
        where('studentId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      let apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort by appliedDate desc on client
      apps.sort((a, b) => {
        const av = a.appliedDate?.toMillis?.() ?? a.appliedDate?.seconds ?? 0;
        const bv = b.appliedDate?.toMillis?.() ?? b.appliedDate?.seconds ?? 0;
        return bv - av;
      });
      
      updateData('applications', apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      updateUi('loadingApplications', false);
    }
  }, [currentUser]);

  const fetchInstitutions = useCallback(async () => {
    try {
      updateUi('loadingInstitutions', true);
      const institutionsQuery = query(
        collection(db, 'institutions'),
        where('isActive', '==', true)
      );

      const institutionsSnapshot = await getDocs(institutionsQuery);
      const institutionsPromises = institutionsSnapshot.docs.map(async (instDoc) => {
        const instData = { id: instDoc.id, ...instDoc.data() };

        // Fetch faculties for this institution
        let facultiesData = [];
        const facultiesQuery = query(
          collection(db, 'faculties'),
          where('institutionId', '==', instDoc.id)
        );
        const facultiesSnapshot = await getDocs(facultiesQuery);
        facultiesData = facultiesSnapshot.docs.map((facultyDoc) => ({
          id: facultyDoc.id,
          ...facultyDoc.data()
        }));

        // Fallback to nested subcollection if no top-level faculties found
        if (facultiesData.length === 0) {
          const nestedFacultiesSnap = await getDocs(collection(db, 'institutions', instDoc.id, 'faculties'));
          facultiesData = nestedFacultiesSnap.docs.map((facultyDoc) => ({
            id: facultyDoc.id,
            ...facultyDoc.data()
          }));
        }

        // For each faculty, load courses
        const facultiesWithCourses = await Promise.all(
          facultiesData.map(async (faculty) => {
            let coursesData = [];
            const coursesQuery = query(
              collection(db, 'courses'),
              where('facultyId', '==', faculty.id)
            );
            const coursesSnapshot = await getDocs(coursesQuery);
            coursesData = coursesSnapshot.docs.map((courseDoc) => ({
              id: courseDoc.id,
              ...courseDoc.data()
            }));

            if (coursesData.length === 0) {
              const nestedCoursesSnap = await getDocs(
                collection(db, 'institutions', instDoc.id, 'faculties', faculty.id, 'courses')
              );
              coursesData = nestedCoursesSnap.docs.map((courseDoc) => ({
                id: courseDoc.id,
                ...courseDoc.data(),
                institutionId: instDoc.id,
                facultyId: faculty.id
              }));
            }
            
            coursesData = coursesData.filter((c) => c.isActive !== false);
            return { ...faculty, courses: coursesData };
          })
        );

        const activeFaculties = facultiesWithCourses.filter((f) => f.isActive !== false);
        return { ...instData, faculties: activeFaculties };
      });

      const institutionsData = await Promise.all(institutionsPromises);
      updateData('institutions', institutionsData);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      updateUi('loadingInstitutions', false);
    }
  }, []);

  const fetchAllCourses = useCallback(async () => {
    try {
      updateUi('loadingAllCourses', true);
      const topSnap = await getDocs(collection(db, 'courses'));
      let courses = topSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (courses.length === 0) {
        const instSnap = await getDocs(collection(db, 'institutions'));
        const nestedCourses = [];
        for (const instDoc of instSnap.docs) {
          const facSnap = await getDocs(collection(db, 'institutions', instDoc.id, 'faculties'));
          for (const facDoc of facSnap.docs) {
            const courseSnap = await getDocs(collection(db, 'institutions', instDoc.id, 'faculties', facDoc.id, 'courses'));
            courseSnap.docs.forEach(c => {
              nestedCourses.push({
                id: c.id,
                ...c.data(),
                institutionId: instDoc.id,
                facultyId: facDoc.id
              });
            });
          }
        }
        courses = nestedCourses;
      }
      
      courses = courses.filter(c => c.isActive !== false);
      courses.sort((a, b) => {
        const av = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? a.postedDate?.seconds ?? 0;
        const bv = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? b.postedDate?.seconds ?? 0;
        return bv - av;
      });
      
      updateData('allCourses', courses);
    } catch (error) {
      console.error('Error fetching all courses:', error);
    } finally {
      updateUi('loadingAllCourses', false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      updateUi('loadingJobs', true);
      const q = query(
        collection(db, 'jobs'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      let jobList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      jobList = jobList.filter(j => (j.status || 'open') === 'open');
      jobList.sort((a, b) => {
        const av = a.postedDate?.toMillis?.() ?? a.postedDate?.seconds ?? 0;
        const bv = b.postedDate?.toMillis?.() ?? b.postedDate?.seconds ?? 0;
        return bv - av;
      });
      
      updateData('jobs', jobList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      updateUi('loadingJobs', false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      notifs.sort((a, b) => {
        const av = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const bv = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return bv - av;
      });
      
      updateData('notifications', notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [currentUser]);

  const fetchProfile = useCallback(async () => {
    try {
      if (!currentUser) return;
      updateUi('loadingProfile', true);
      
      const q = query(
        collection(db, 'students'),
        where('uid', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const profileDoc = querySnapshot.docs[0];
        updateData('profile', { id: profileDoc.id, ...profileDoc.data() });
      } else {
        const basicProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          firstName: '',
          lastName: '',
          phone: '',
          idNumber: '',
          dateOfBirth: '',
          nationality: '',
          address: '',
          educationLevel: '',
          skills: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'students'), basicProfile);
        updateData('profile', { id: docRef.id, ...basicProfile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      updateUi('loadingProfile', false);
    }
  }, [currentUser]);

  const fetchDocuments = useCallback(async (type) => {
    try {
      if (!currentUser) return;
      
      if (type === 'transcript') updateUi('loadingTranscripts', true);
      if (type === 'certificate') updateUi('loadingCertificates', true);
      
      const q = query(
        collection(db, 'documents'),
        where('studentId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let documentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      documentList = documentList
        .filter(d => d.type === type)
        .sort((a, b) => {
          const av = a.uploadDate?.toMillis?.() ?? a.uploadDate?.seconds ?? 0;
          const bv = b.uploadDate?.toMillis?.() ?? b.uploadDate?.seconds ?? 0;
          return bv - av;
        });
      
      if (type === 'transcript') updateData('transcripts', documentList);
      if (type === 'certificate') updateData('certificates', documentList);
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
    } finally {
      if (type === 'transcript') updateUi('loadingTranscripts', false);
      if (type === 'certificate') updateUi('loadingCertificates', false);
    }
  }, [currentUser]);

  // Real-time listeners
  useEffect(() => {
    if (!currentUser) return;
    
    // Notifications listener
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid)
    );
    
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (querySnapshot) => {
      let notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notifs.sort((a, b) => {
        const av = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const bv = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return bv - av;
      });
      updateData('notifications', notifs);
    });

    // Applications listener
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('studentId', '==', currentUser.uid)
    );
    
    const unsubscribeApplications = onSnapshot(applicationsQuery, (querySnapshot) => {
      let apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      apps.sort((a, b) => {
        const av = a.appliedDate?.toMillis?.() ?? a.appliedDate?.seconds ?? 0;
        const bv = b.appliedDate?.toMillis?.() ?? b.appliedDate?.seconds ?? 0;
        return bv - av;
      });
      updateData('applications', apps);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeApplications();
    };
  }, [currentUser]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      updateUi('loading', true);
      try {
        await Promise.all([
          fetchApplications(),
          fetchInstitutions(),
          fetchJobs(),
          fetchProfile(),
          fetchDocuments('transcript'),
          fetchDocuments('certificate'),
          fetchAllCourses()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        updateUi('loading', false);
      }
    };
    
    fetchData();
  }, [fetchApplications, fetchInstitutions, fetchJobs, fetchProfile, fetchDocuments, fetchAllCourses]);

  // Application logic
  const canApplyToCourse = (institutionId, courseId) => {
    const existingApplication = data.applications.find(
      app => app.instituteId === institutionId && app.courseId === courseId
    );
    
    if (existingApplication) {
      return { canApply: false, reason: 'You have already applied to this course.' };
    }
    
    const institutionApplications = data.applications.filter(
      app => app.instituteId === institutionId
    );
    
    if (institutionApplications.length >= 2) {
      return { canApply: false, reason: 'You can only apply to a maximum of 2 courses per institution.' };
    }
    
    return { canApply: true };
  };

  const handleApplication = (institution, course) => {
    if (!currentUser) {
      alert('Please log in to apply for courses.');
      return;
    }

    const { canApply, reason } = canApplyToCourse(institution.id, course.id);
    
    if (!canApply) {
      alert(reason);
      return;
    }
    
    if (course.deadline) {
      const deadlineDate = new Date(course.deadline);
      const today = new Date();
      if (deadlineDate < today) {
        alert('The application deadline for this course has passed.');
        return;
      }
    }
    
    updateApplicationState('selectedCourse', { institution, course });
    updateApplicationState('showApplicationModal', true);
  };

  const submitApplication = async () => {
    if (!application.selectedCourse || !currentUser) return;
    
    updateUi('loading', true);
    try {
      const { institution, course } = application.selectedCourse;
      
      // Resolve institution and faculty names
      let institutionName = institution?.name || '';
      let facultyName = institution?.faculties?.find(f => f.id === course.facultyId)?.name || '';
      let instituteId = institution?.id || course?.institutionId;
      const facultyId = course?.facultyId;

      if (!institutionName && instituteId) {
        try {
          const instDoc = await getDoc(doc(db, 'institutions', instituteId));
          if (instDoc.exists()) {
            institutionName = instDoc.data().name || '';
          }
        } catch {}
      }

      // Upload supporting documents
      let uploadedDocuments = [];
      if (Array.isArray(application.form.documents) && application.form.documents.length > 0) {
        const MAX_FILES = 5;
        const MAX_SIZE = 10 * 1024 * 1024;
        const files = application.form.documents
          .slice(0, MAX_FILES)
          .filter((f) => f.size <= MAX_SIZE);

        const uploadTasks = files.map(async (file) => {
          try {
            const storageRef = ref(storage, `applications/${currentUser.uid}/${course.id}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              url
            };
          } catch (e) {
            console.warn('Failed to upload application document:', e);
            return null;
          }
        });

        const results = await Promise.allSettled(uploadTasks);
        uploadedDocuments = results
          .filter((r) => r.status === 'fulfilled' && r.value)
          .map((r) => r.value);
      }

      const applicationData = {
        studentId: currentUser.uid,
        studentName: `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim() || currentUser.email,
        studentEmail: currentUser.email,
        instituteId: instituteId,
        instituteName: institutionName || 'Unknown Institution',
        facultyId: facultyId,
        facultyName: facultyName || 'Unknown Faculty',
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        personalStatement: application.form.personalStatement,
        documents: uploadedDocuments,
        status: 'pending',
        appliedDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'applications'), applicationData);
      
      // Create notification for admin
      const notificationData = {
        recipientId: 'admin',
        title: 'New Application Submitted',
        message: `${applicationData.studentName} applied for ${applicationData.courseName} at ${applicationData.instituteName}`,
        type: 'application',
        relatedId: applicationData.courseId,
        isRead: false,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      
      updateApplicationState('showApplicationModal', false);
      updateApplicationState('selectedCourse', null);
      updateApplicationState('form', { personalStatement: '', documents: [] });
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      updateUi('loading', false);
    }
  };

  const startApplicationFromCourse = async (course) => {
    try {
      let institution = data.institutions.find(inst =>
        inst.faculties?.some(f => f.id === course.facultyId && f.courses?.some(c => c.id === course.id))
      );
      
      if (!institution) {
        const instituteId = course.institutionId;
        let institutionName = '';
        if (instituteId) {
          try {
            const instDoc = await getDoc(doc(db, 'institutions', instituteId));
            if (instDoc.exists()) {
              institutionName = instDoc.data().name || '';
            }
          } catch {}
        }
        institution = { id: instituteId, name: institutionName, faculties: [] };
      }
      
      updateApplicationState('selectedCourse', { institution, course });
      updateApplicationState('showApplicationModal', true);
    } catch (e) {
      alert('Unable to start application for this course. Please try from Browse Institutions.');
    }
  };

  const updateProfile = async (profileData) => {
    if (!data.profile.id) return;
    
    updateUi('loading', true);
    try {
      const updatedProfile = {
        ...profileData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'students', data.profile.id), updatedProfile);
      updateData('profile', { ...data.profile, ...updatedProfile });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      updateUi('loading', false);
    }
  };

  const uploadDocument = async (file, type) => {
    if (!currentUser) return;
    
    updateUi('loading', true);
    try {
      const storageRef = ref(storage, `documents/${currentUser.uid}/${type}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const documentData = {
        studentId: currentUser.uid,
        studentName: `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim() || currentUser.email,
        name: file.name,
        type: type,
        size: file.size,
        url: downloadURL,
        uploadDate: serverTimestamp(),
        isVerified: false
      };
      
      const docRef = await addDoc(collection(db, 'documents'), documentData);
      const newDocument = { id: docRef.id, ...documentData };
      
      if (type === 'transcript') {
        updateData('transcripts', [newDocument, ...data.transcripts]);
      } else if (type === 'certificate') {
        updateData('certificates', [newDocument, ...data.certificates]);
      }
      
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      updateUi('loading', false);
    }
  };

  const applyForJob = async (job) => {
    if (!currentUser) {
      alert('Please log in to apply for jobs.');
      return;
    }

    try {
      const jobApplicationData = {
        studentId: currentUser.uid,
        studentName: `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim() || currentUser.email,
        studentEmail: currentUser.email,
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        status: 'pending',
        appliedDate: serverTimestamp(),
        resume: data.profile.resumeUrl || '',
        coverLetter: ''
      };
      
      await addDoc(collection(db, 'jobApplications'), jobApplicationData);
      alert('Job application submitted successfully!');
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Failed to apply for job. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { badge: 'bg-warning text-dark', icon: '⏳', text: 'Pending' },
      under_review: { badge: 'bg-info', icon: '🔍', text: 'Under Review' },
      admitted: { badge: 'bg-success', icon: '✅', text: 'Admitted' },
      rejected: { badge: 'bg-danger', icon: '❌', text: 'Rejected' },
      confirmed: { badge: 'bg-primary', icon: '✓', text: 'Confirmed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge ${config.badge} d-flex align-items-center gap-1`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getUserInitials = () => {
    if (data.profile.firstName && data.profile.lastName) {
      return `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}`.toUpperCase();
    }
    return currentUser?.email?.charAt(0).toUpperCase() || 'S';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    updateUi('sidebarOpen', !ui.sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    updateUi('activeTab', tabId);
    updateUi('sidebarOpen', false);
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Toggle */}
      <button 
        className="dashboard-mobile-toggle"
        onClick={toggleSidebar}
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${ui.sidebarOpen ? 'open' : ''}`}>
        <div className="dashboard-sidebar-header">
          <h2>
            <i className="bi bi-person-circle"></i>
            Student
          </h2>
        </div>
        <ul className="dashboard-sidebar-nav d-flex flex-column align-items-center">
          {tabs.map(tab => (
            <li key={tab.id} className="dashboard-sidebar-nav-item w-100">
              <button
                className={`dashboard-sidebar-nav-link w-100 text-center ${ui.activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="dashboard-sidebar-footer">
          <button 
            className="btn btn-outline-danger w-100"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1>
              <i className="bi bi-person-circle"></i>
              Student Dashboard
            </h1>
            <p className="text-muted mb-0 mt-2">
              Welcome back{data.profile.firstName ? `, ${data.profile.firstName}` : ''}! Track your applications and explore opportunities.
            </p>
          </div>
          <div className="dashboard-header-right">
            <NotificationBell notifications={data.notifications} />
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow" 
                 style={{width: '45px', height: '45px'}}>
              {getUserInitials()}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {ui.activeTab === 'dashboard' && (
            <DashboardOverview 
              applications={data.applications} 
              jobs={data.jobs} 
              profile={data.profile}
              transcripts={data.transcripts}
              certificates={data.certificates}
              getStatusBadge={getStatusBadge}
              setActiveTab={(tab) => updateUi('activeTab', tab)}
            />
          )}

          {ui.activeTab === 'applications' && (
            <ApplicationsManagement 
              applications={data.applications}
              getStatusBadge={getStatusBadge}
              loading={ui.loading}
            />
          )}

          {ui.activeTab === 'institutions' && (
            <InstitutionsManagement 
              institutions={data.institutions}
              applications={data.applications}
              handleApplication={handleApplication}
              canApplyToCourse={canApplyToCourse}
              loading={ui.loadingInstitutions}
            />
          )}

          {ui.activeTab === 'jobs' && (
            <JobsManagement 
              jobs={data.jobs}
              applyForJob={applyForJob}
              profile={data.profile}
              loading={ui.loadingJobs}
            />
          )}

          {ui.activeTab === 'courses' && (
            <div className="tab-pane fade show active">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">All Courses</h4>
                <button className="btn btn-outline-secondary btn-sm" onClick={fetchAllCourses} disabled={ui.loadingAllCourses}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
              {ui.loadingAllCourses ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : data.allCourses.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-book text-muted fs-1 mb-3"></i>
                  <p className="text-muted">No courses found</p>
                </div>
              ) : (
                <div className="row g-3">
                  {data.allCourses.map((course) => (
                    <div key={course.id} className="col-md-6 col-lg-4">
                      <div className="card h-100">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">{course.name || 'Untitled Course'}</h6>
                          {course.code && <small className="text-muted">Code: {course.code}</small>}
                        </div>
                        <div className="card-body">
                          {course.description && <p className="small text-muted mb-3">{course.description}</p>}
                          <div className="small text-muted mb-2">
                            {course.level && <span className="me-3"><i className="bi bi-mortarboard me-1"></i>{course.level}</span>}
                            {course.department && <span className="me-3"><i className="bi bi-building me-1"></i>{course.department}</span>}
                            {course.seats && <span><i className="bi bi-people me-1"></i>{course.seats} seats</span>}
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-primary flex-grow-1" onClick={() => startApplicationFromCourse(course)}>
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {ui.activeTab === 'profile' && (
            <ProfileManagement 
              profile={data.profile}
              updateProfile={updateProfile}
              loading={ui.loading}
            />
          )}

          {ui.activeTab === 'documents' && (
            <DocumentsManagement 
              transcripts={data.transcripts}
              certificates={data.certificates}
              uploadDocument={uploadDocument}
              loading={ui.loading}
            />
          )}
        </div>
      </main>

      {/* Application Modal */}
      <ApplicationModal
        showApplicationModal={application.showApplicationModal}
        setShowApplicationModal={(show) => updateApplicationState('showApplicationModal', show)}
        selectedCourse={application.selectedCourse}
        applicationForm={application.form}
        setApplicationForm={(form) => updateApplicationState('form', form)}
        submitApplication={submitApplication}
        loading={ui.loading}
      />
    </div>
  );
};

export default StudentDashboard;
