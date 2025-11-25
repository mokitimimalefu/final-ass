import { db, auth } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Student Services
export const studentService = {
  // Get student applications
  getApplications: async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const q = query(
        collection(db, 'applications'),
        where('studentId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);

      const applications = [];
      for (const docSnap of querySnapshot.docs) {
        const applicationData = { id: docSnap.id, ...docSnap.data() };

        // Get institute and course details
        const instituteDoc = await getDoc(doc(db, 'institutions', applicationData.instituteId));
        const instituteData = instituteDoc.exists() ? instituteDoc.data() : {};

        // Get course details from subcollection
        const courseDoc = await getDoc(doc(db, 'institutions', applicationData.instituteId, 'courses', applicationData.courseId));
        const courseData = courseDoc.exists() ? courseDoc.data() : {};

        applications.push({
          ...applicationData,
          instituteName: instituteData.name || 'Unknown Institute',
          courseName: courseData.name || 'Unknown Course'
        });
      }

      return applications;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  // Get institutions with faculties and courses
  getInstitutions: async () => {
    try {
      const institutionsSnapshot = await getDocs(collection(db, 'institutions'));
      const institutions = [];

      for (const docSnap of institutionsSnapshot.docs) {
        const institutionData = { id: docSnap.id, ...docSnap.data() };

        // Get faculties with their courses
        const facultiesSnapshot = await getDocs(collection(db, 'institutions', docSnap.id, 'faculties'));
        institutionData.faculties = [];

        for (const facultyDoc of facultiesSnapshot.docs) {
          const facultyData = {
            id: facultyDoc.id,
            name: facultyDoc.data().name,
            description: facultyDoc.data().description || '',
            courses: []
          };

          // Get courses for each faculty
          const coursesSnapshot = await getDocs(collection(db, 'institutions', docSnap.id, 'faculties', facultyDoc.id, 'courses'));
          facultyData.courses = coursesSnapshot.docs.map(courseDoc => ({
            id: courseDoc.id,
            ...courseDoc.data()
          }));

          institutionData.faculties.push(facultyData);
        }

        institutions.push(institutionData);
      }

      return institutions;
    } catch (error) {
      console.error('Error fetching institutions:', error);
      throw error;
    }
  },

  // Get jobs
  getJobs: async () => {
    try {
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  // Apply for course
  applyForCourse: async (instituteId, courseId, personalStatement, documents = []) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const applicationData = {
        studentId: user.uid,
        instituteId,
        courseId,
        personalStatement,
        documents,
        status: 'pending',
        appliedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'applications'), applicationData);
      return { id: docRef.id, ...applicationData };
    } catch (error) {
      console.error('Error applying for course:', error);
      throw error;
    }
  }
};

// Institute Services
export const instituteService = {
  // Faculty operations
  getFaculties: async (instituteId) => {
    try {
      const facultiesSnapshot = await getDocs(collection(db, 'institutions', instituteId, 'faculties'));
      return facultiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching faculties:', error);
      throw error;
    }
  },

  addFaculty: async (instituteId, facultyData) => {
    try {
      const docRef = await addDoc(collection(db, 'institutions', instituteId, 'faculties'), {
        ...facultyData,
        createdAt: new Date()
      });
      return { id: docRef.id, ...facultyData };
    } catch (error) {
      console.error('Error adding faculty:', error);
      throw error;
    }
  },

  updateFaculty: async (instituteId, facultyId, updateData) => {
    try {
      await updateDoc(doc(db, 'institutions', instituteId, 'faculties', facultyId), {
        ...updateData,
        updatedAt: new Date()
      });
      return { message: 'Faculty updated successfully' };
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  },

  deleteFaculty: async (instituteId, facultyId) => {
    try {
      await deleteDoc(doc(db, 'institutions', instituteId, 'faculties', facultyId));
      return { message: 'Faculty deleted successfully' };
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  },

  // Course operations
  getCourses: async (instituteId) => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'institutions', instituteId, 'courses'));
      return coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  addCourse: async (instituteId, courseData) => {
    try {
      const docRef = await addDoc(collection(db, 'institutions', instituteId, 'courses'), {
        ...courseData,
        createdAt: new Date()
      });
      return { id: docRef.id, ...courseData };
    } catch (error) {
      console.error('Error adding course:', error);
      throw error;
    }
  },

  updateCourse: async (instituteId, courseId, updateData) => {
    try {
      await updateDoc(doc(db, 'institutions', instituteId, 'courses', courseId), {
        ...updateData,
        updatedAt: new Date()
      });
      return { message: 'Course updated successfully' };
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  deleteCourse: async (instituteId, courseId) => {
    try {
      await deleteDoc(doc(db, 'institutions', instituteId, 'courses', courseId));
      return { message: 'Course deleted successfully' };
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Application operations
  getApplications: async (instituteId) => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('instituteId', '==', instituteId)
      );
      const querySnapshot = await getDocs(q);

      const applications = [];
      for (const docSnap of querySnapshot.docs) {
        const applicationData = { id: docSnap.id, ...docSnap.data() };

        // Get student details
        const studentDoc = await getDoc(doc(db, 'users', applicationData.studentId));
        const studentData = studentDoc.exists() ? studentDoc.data() : {};

        applications.push({
          ...applicationData,
          student: {
            name: studentData.name || 'Unknown',
            email: studentData.email || 'Unknown'
          }
        });
      }

      return applications;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  updateApplicationStatus: async (instituteId, applicationId, status) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status,
        updatedAt: new Date()
      });
      return { message: 'Application status updated successfully' };
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  },

  // Profile operations
  getProfile: async (instituteId) => {
    try {
      const docSnap = await getDoc(doc(db, 'institutions', instituteId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Institution not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (instituteId, profileData) => {
    try {
      await updateDoc(doc(db, 'institutions', instituteId), {
        ...profileData,
        updatedAt: new Date()
      });
      return { message: 'Profile updated successfully' };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

// Admin Services
export const adminService = {
  getInstitutions: async () => {
    try {
      const institutionsSnapshot = await getDocs(collection(db, 'institutions'));
      return institutionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching institutions:', error);
      throw error;
    }
  },

  addInstitution: async (institutionData) => {
    try {
      const docRef = await addDoc(collection(db, 'institutions'), institutionData);
      return { id: docRef.id, ...institutionData };
    } catch (error) {
      console.error('Error adding institution:', error);
      throw error;
    }
  },

  getCompanies: async () => {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      return companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }
};

// Auth Services
export const authService = {
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      return {
        user: {
          uid: user.uid,
          email: user.email,
          ...userData
        },
        userType: userData.userType
      };
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      // Save user data to Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        email: userData.email,
        name: userData.name,
        userType: userData.userType,
        createdAt: new Date(),
        ...userData
      });

      return {
        user: {
          uid: user.uid,
          email: user.email,
          name: userData.name,
          userType: userData.userType
        }
      };
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
};

// Export db for direct usage if needed
export { db };
