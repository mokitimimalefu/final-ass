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
  const [applications, setApplications] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTranscripts, setLoadingTranscripts] = useState(true);
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [loadingAllCourses, setLoadingAllCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    personalStatement: '',
    documents: []
  });
  const [profile, setProfile] = useState({});
  const [transcripts, setTranscripts] = useState([]);
  const [certificates, setCertificates] = useState([]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'applications', label: 'My Applications', icon: '📝' },
    { id: 'institutions', label: 'Browse Institutions', icon: '🏫' },
    { id: 'courses', label: 'All Courses', icon: '📚' },
    { id: 'jobs', label: 'Job Opportunities', icon: '💼' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'documents', label: 'My Documents', icon: '📁' }
  ];

  // Fetch applications from Firebase
  const fetchApplications = useCallback(async () => {
    try {
      if (!currentUser) return;
      setLoadingApplications(true);

      // Avoid composite index: filter by studentId only, sort client-side
      const q = query(
        collection(db, 'applications'),
        where('studentId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      let apps = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() });
      });

      // Sort by appliedDate desc on client
      apps.sort((a, b) => {
        const av = a.appliedDate?.toMillis?.() ?? a.appliedDate?.seconds ?? 0;
        const bv = b.appliedDate?.toMillis?.() ?? b.appliedDate?.seconds ?? 0;
        return bv - av;
      });
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  }, [currentUser]);

  // Fetch institutions with faculties and courses from Firebase
  const fetchInstitutions = useCallback(async () => {
    try {
      setLoadingInstitutions(true);
      const institutionsQuery = query(
        collection(db, 'institutions'),
        where('isActive', '==', true)
      );

      const institutionsSnapshot = await getDocs(institutionsQuery);
      const institutionsPromises = institutionsSnapshot.docs.map(async (instDoc) => {
        const instData = { id: instDoc.id, ...instDoc.data() };

        // Fetch faculties for this institution
        // Try top-level 'faculties' with institutionId first
        let facultiesData = [];
        {
          const facultiesQuery = query(
            collection(db, 'faculties'),
            where('institutionId', '==', instDoc.id)
          );
          const facultiesSnapshot = await getDocs(facultiesQuery);
          facultiesData = facultiesSnapshot.docs.map((facultyDoc) => ({
            id: facultyDoc.id,
            ...facultyDoc.data()
          }));
        }

        // Fallback to nested subcollection if no top-level faculties found
        if (facultiesData.length === 0) {
          const nestedFacultiesSnap = await getDocs(collection(db, 'institutions', instDoc.id, 'faculties'));
          facultiesData = nestedFacultiesSnap.docs.map((facultyDoc) => ({
            id: facultyDoc.id,
            ...facultyDoc.data()
          }));
        }

        // For each faculty, load courses (top-level by facultyId; fallback to nested)
        const facultiesWithCourses = [];
        for (const faculty of facultiesData) {
          let coursesData = [];
          {
            const coursesQuery = query(
              collection(db, 'courses'),
              where('facultyId', '==', faculty.id)
            );
            const coursesSnapshot = await getDocs(coursesQuery);
            coursesData = coursesSnapshot.docs.map((courseDoc) => ({
              id: courseDoc.id,
              ...courseDoc.data()
            }));
          }
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
          facultiesWithCourses.push({ ...faculty, courses: coursesData });
        }

        const activeFaculties = facultiesWithCourses.filter((f) => f.isActive !== false);
        return { ...instData, faculties: activeFaculties };
      });

      const institutionsData = await Promise.all(institutionsPromises);
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setLoadingInstitutions(false);
    }
  }, []);

  // Fetch all courses (from top-level, fallback to nested)
  const fetchAllCourses = useCallback(async () => {
    try {
      setLoadingAllCourses(true);
      // Try top-level 'courses'
      const topSnap = await getDocs(collection(db, 'courses'));
      let courses = topSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Fallback to nested if top-level empty
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
      // Default active unless explicitly false
      courses = courses.filter(c => c.isActive !== false);
      // Sort by created/posted if present
      courses.sort((a, b) => {
        const av = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? a.postedDate?.seconds ?? 0;
        const bv = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? b.postedDate?.seconds ?? 0;
        return bv - av;
      });
      setAllCourses(courses);
    } catch (error) {
      console.error('Error fetching all courses:', error);
    } finally {
      setLoadingAllCourses(false);
    }
  }, []);

  // Fetch jobs from Firebase
  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      // Avoid composite index: fetch isActive jobs, filter status client-side, sort client-side
      const q = query(
        collection(db, 'jobs'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      let jobList = [];
      querySnapshot.forEach((doc) => {
        jobList.push({ id: doc.id, ...doc.data() });
      });

      jobList = jobList.filter(j => (j.status || 'open') === 'open');
      jobList.sort((a, b) => {
        const av = a.postedDate?.toMillis?.() ?? a.postedDate?.seconds ?? 0;
        const bv = b.postedDate?.toMillis?.() ?? b.postedDate?.seconds ?? 0;
        return bv - av;
      });
      setJobs(jobList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // Fetch notifications from Firebase
  const fetchNotifications = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      // Avoid composite index: no orderBy, sort client-side
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let notifs = [];
      querySnapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      
      notifs.sort((a, b) => {
        const av = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const bv = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return bv - av;
      });
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [currentUser]);

  // Fetch profile from Firebase
  const fetchProfile = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      const q = query(
        collection(db, 'students'),
        where('uid', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const profileDoc = querySnapshot.docs[0];
        setProfile({ id: profileDoc.id, ...profileDoc.data() });
      } else {
        // Create a basic profile if none exists
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
        setProfile({ id: docRef.id, ...basicProfile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [currentUser]);

  // Fetch transcripts from Firebase
  const fetchTranscripts = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      // Avoid composite index: filter by student only, then filter type and sort client-side
      const q = query(
        collection(db, 'documents'),
        where('studentId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let transcriptList = [];
      querySnapshot.forEach((doc) => {
        transcriptList.push({ id: doc.id, ...doc.data() });
      });
      
      transcriptList = transcriptList
        .filter(d => d.type === 'transcript')
        .sort((a, b) => {
          const av = a.uploadDate?.toMillis?.() ?? a.uploadDate?.seconds ?? 0;
          const bv = b.uploadDate?.toMillis?.() ?? b.uploadDate?.seconds ?? 0;
          return bv - av;
        });
      setTranscripts(transcriptList);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
    }
  }, [currentUser]);

  // Fetch certificates from Firebase
  const fetchCertificates = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      // Avoid composite index: filter by student only, then filter type and sort client-side
      const q = query(
        collection(db, 'documents'),
        where('studentId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let certificateList = [];
      querySnapshot.forEach((doc) => {
        certificateList.push({ id: doc.id, ...doc.data() });
      });
      
      certificateList = certificateList
        .filter(d => d.type === 'certificate')
        .sort((a, b) => {
          const av = a.uploadDate?.toMillis?.() ?? a.uploadDate?.seconds ?? 0;
          const bv = b.uploadDate?.toMillis?.() ?? b.uploadDate?.seconds ?? 0;
          return bv - av;
        });
      setCertificates(certificateList);
    } catch (error) {
      console.error('Error fetching certificates:', error);
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
      let notifs = [];
      querySnapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      notifs.sort((a, b) => {
        const av = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const bv = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return bv - av;
      });
      setNotifications(notifs);
    });

    // Applications listener
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('studentId', '==', currentUser.uid)
    );
    
    const unsubscribeApplications = onSnapshot(applicationsQuery, (querySnapshot) => {
      let apps = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() });
      });
      apps.sort((a, b) => {
        const av = a.appliedDate?.toMillis?.() ?? a.appliedDate?.seconds ?? 0;
        const bv = b.appliedDate?.toMillis?.() ?? b.appliedDate?.seconds ?? 0;
        return bv - av;
      });
      setApplications(apps);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeApplications();
    };
  }, [currentUser]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchApplications(),
          fetchInstitutions(),
          fetchJobs(),
          fetchProfile(),
          fetchTranscripts(),
          fetchCertificates(),
          fetchAllCourses()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fetchApplications, fetchInstitutions, fetchJobs, fetchProfile, fetchTranscripts, fetchCertificates]);

  // Check if student can apply to a course
  const canApplyToCourse = (institutionId, courseId) => {
    const existingApplication = applications.find(
      app => app.instituteId === institutionId && app.courseId === courseId
    );
    
    if (existingApplication) {
      return { canApply: false, reason: 'You have already applied to this course.' };
    }
    
    const institutionApplications = applications.filter(
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
    
    setSelectedCourse({ institution, course });
    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    if (!selectedCourse || !currentUser) return;
    
    setLoading(true);
    try {
      // Resolve institution and faculty names if not present
      let institutionName = selectedCourse.institution?.name || '';
      let facultyName =
        selectedCourse.institution?.faculties?.find(f => f.id === selectedCourse.course.facultyId)?.name || '';
      let instituteId = selectedCourse.institution?.id || selectedCourse.course?.institutionId;
      const facultyId = selectedCourse.course?.facultyId;

      if (!institutionName && instituteId) {
        try {
          const instDoc = await getDoc(doc(db, 'institutions', instituteId));
          if (instDoc.exists()) {
            institutionName = instDoc.data().name || '';
          }
        } catch {}
      }
      if (!facultyName && instituteId && facultyId) {
        try {
          // Try top-level faculty
          const facTopDoc = await getDoc(doc(db, 'faculties', facultyId));
          if (facTopDoc.exists()) {
            facultyName = facTopDoc.data().name || facultyName;
          } else {
            // Fallback nested
            const facNestedDoc = await getDoc(doc(db, 'institutions', instituteId, 'faculties', facultyId));
            if (facNestedDoc.exists()) {
              facultyName = facNestedDoc.data().name || facultyName;
            }
          }
        } catch {}
      }

      // Upload supporting documents to storage in parallel and collect URLs
      let uploadedDocuments = [];
      if (Array.isArray(applicationForm.documents) && applicationForm.documents.length > 0) {
        const MAX_FILES = 5;
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const files = applicationForm.documents
          .slice(0, MAX_FILES)
          .filter((f) => {
            if (f.size > MAX_SIZE) {
              console.warn(`Skipping ${f.name}: exceeds 10MB`);
              return false;
            }
            return true;
          });

        const uploadTasks = files.map(async (file) => {
          try {
            const storageRef = ref(storage, `applications/${currentUser.uid}/${selectedCourse.course.id}/${file.name}`);
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
        studentName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || currentUser.email,
        studentEmail: currentUser.email,
        instituteId: instituteId,
        instituteName: institutionName || 'Unknown Institution',
        facultyId: facultyId,
        facultyName: facultyName || 'Unknown Faculty',
        courseId: selectedCourse.course.id,
        courseName: selectedCourse.course.name,
        courseCode: selectedCourse.course.code,
        personalStatement: applicationForm.personalStatement,
        documents: uploadedDocuments,
        status: 'pending',
        appliedDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'applications'), applicationData);
      
      // Create notification for admin
      const notificationData = {
        recipientId: 'admin', // Or specific admin IDs
        title: 'New Application Submitted',
        message: `${applicationData.studentName} applied for ${applicationData.courseName} at ${applicationData.instituteName}`,
        type: 'application',
        relatedId: applicationData.courseId,
        isRead: false,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      
      setShowApplicationModal(false);
      setSelectedCourse(null);
      setApplicationForm({ personalStatement: '', documents: [] });
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startApplicationFromCourse = async (course) => {
    try {
      // Find institution in current state
      let institution = institutions.find(inst =>
        inst.faculties?.some(f => f.id === course.facultyId && f.courses?.some(c => c.id === course.id))
      );
      // If not found, build a minimal institution object with fetched name
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
      setSelectedCourse({ institution, course });
      setShowApplicationModal(true);
    } catch (e) {
      alert('Unable to start application for this course. Please try from Browse Institutions.');
    }
  };

  const updateProfile = async (profileData) => {
    if (!profile.id) return;
    
    setLoading(true);
    try {
      const updatedProfile = {
        ...profileData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'students', profile.id), updatedProfile);
      setProfile(prev => ({ ...prev, ...updatedProfile }));
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file, type) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `documents/${currentUser.uid}/${type}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Save document metadata to Firestore
      const documentData = {
        studentId: currentUser.uid,
        studentName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || currentUser.email,
        name: file.name,
        type: type,
        size: file.size,
        url: downloadURL,
        uploadDate: serverTimestamp(),
        isVerified: false
      };
      
      const docRef = await addDoc(collection(db, 'documents'), documentData);
      const newDocument = { id: docRef.id, ...documentData };
      
      // Update state based on document type
      if (type === 'transcript') {
        setTranscripts(prev => [newDocument, ...prev]);
      } else if (type === 'certificate') {
        setCertificates(prev => [newDocument, ...prev]);
      }
      
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
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
        studentName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || currentUser.email,
        studentEmail: currentUser.email,
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        status: 'pending',
        appliedDate: serverTimestamp(),
        resume: profile.resumeUrl || '',
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
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    }
    return currentUser?.email?.charAt(0).toUpperCase() || 'S';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      {/* Mobile Toggle */}
      <button 
        className="dashboard-mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                className={`dashboard-sidebar-nav-link w-100 text-center ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
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
              Welcome back{profile.firstName ? `, ${profile.firstName}` : ''}! Track your applications and explore opportunities.
            </p>
          </div>
          <div className="dashboard-header-right">
            <NotificationBell notifications={notifications} />
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow" 
                 style={{width: '45px', height: '45px'}}>
              {getUserInitials()}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
            {activeTab === 'dashboard' && (
              <div className="tab-pane fade show active">
                <DashboardOverview 
                  applications={applications} 
                  jobs={jobs} 
                  profile={profile}
                  transcripts={transcripts}
                  certificates={certificates}
                  getStatusBadge={getStatusBadge}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="tab-pane fade show active">
                <ApplicationsManagement 
                  applications={applications}
                  getStatusBadge={getStatusBadge}
                  loading={loading}
                />
              </div>
            )}

            {activeTab === 'institutions' && (
              <div className="tab-pane fade show active">
                <InstitutionsManagement 
                  institutions={institutions}
                  applications={applications}
                  handleApplication={handleApplication}
                  canApplyToCourse={canApplyToCourse}
                  loading={loading}
                />
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="tab-pane fade show active">
                <JobsManagement 
                  jobs={jobs}
                  applyForJob={applyForJob}
                  profile={profile}
                  loading={loading}
                />
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="tab-pane fade show active">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="mb-0">All Courses</h4>
                  <button className="btn btn-outline-secondary btn-sm" onClick={fetchAllCourses} disabled={loadingAllCourses}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </button>
                </div>
                {loadingAllCourses ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : allCourses.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-book text-muted fs-1 mb-3"></i>
                    <p className="text-muted">No courses found</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {allCourses.map((course) => (
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

            {activeTab === 'profile' && (
              <div className="tab-pane fade show active">
                <ProfileManagement 
                  profile={profile}
                  updateProfile={updateProfile}
                  loading={loading}
                />
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="tab-pane fade show active">
                <DocumentsManagement 
                  transcripts={transcripts}
                  certificates={certificates}
                  uploadDocument={uploadDocument}
                  loading={loading}
                />
              </div>
            )}
        </div>
      </main>

      {/* Application Modal */}
      <ApplicationModal
        showApplicationModal={showApplicationModal}
        setShowApplicationModal={setShowApplicationModal}
        selectedCourse={selectedCourse}
        applicationForm={applicationForm}
        setApplicationForm={setApplicationForm}
        submitApplication={submitApplication}
        loading={loading}
      />
    </div>
  );
};

export default StudentDashboard;