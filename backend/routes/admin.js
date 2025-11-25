module.exports = (db, auth) => {
  const express = require('express');
  const jwt = require('jsonwebtoken');
  const router = express.Router();

  // Middleware to verify admin access
  const verifyAdminAccess = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId;
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists || userDoc.data().userType !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized access. Admin only.' });
      }

      req.user = userDoc.data();
      req.userId = decodedToken.uid;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // ========== INSTITUTION MANAGEMENT ==========
  
  // Get all institutions
  router.get('/institutions', verifyAdminAccess, async (req, res) => {
    try {
      const institutionsSnapshot = await db.collection('institutions').get();
      const institutions = [];
      
      institutionsSnapshot.forEach(doc => {
        institutions.push({ id: doc.id, ...doc.data() });
      });
      
      res.json(institutions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add new institution
  router.post('/institutions', verifyAdminAccess, async (req, res) => {
    try {
      const institutionData = req.body;
      const docRef = await db.collection('institutions').add({
        ...institutionData,
        createdAt: new Date(),
        isActive: true
      });
      
      res.status(201).json({ id: docRef.id, message: 'Institution added successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update institution
  router.put('/institutions/:institutionId', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const updateData = req.body;

      await db.collection('institutions').doc(institutionId).update({
        ...updateData,
        updatedAt: new Date()
      });

      res.json({ message: 'Institution updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete institution
  router.delete('/institutions/:institutionId', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId } = req.params;
      await db.collection('institutions').doc(institutionId).delete();
      res.json({ message: 'Institution deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== FACULTY MANAGEMENT ==========

  // Get all faculties for an institution
  router.get('/institutions/:institutionId/faculties', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const facultiesSnapshot = await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .get();

      const faculties = [];
      facultiesSnapshot.forEach(doc => {
        faculties.push({ id: doc.id, ...doc.data() });
      });

      res.json(faculties);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add faculty to institution
  router.post('/institutions/:institutionId/faculties', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const facultyData = req.body;

      const facultyRef = await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .add({
          ...facultyData,
          createdAt: new Date()
        });

      res.status(201).json({ id: facultyRef.id, message: 'Faculty added successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update faculty
  router.put('/institutions/:institutionId/faculties/:facultyId', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId, facultyId } = req.params;
      const updateData = req.body;

      await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .doc(facultyId)
        .update({
          ...updateData,
          updatedAt: new Date()
        });

      res.json({ message: 'Faculty updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete faculty
  router.delete('/institutions/:institutionId/faculties/:facultyId', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId, facultyId } = req.params;
      await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .doc(facultyId)
        .delete();
      res.json({ message: 'Faculty deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== COURSE MANAGEMENT ==========

  // Get all courses for a faculty
  router.get('/institutions/:institutionId/faculties/:facultyId/courses', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId, facultyId } = req.params;
      const coursesSnapshot = await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .doc(facultyId)
        .collection('courses')
        .get();

      const courses = [];
      coursesSnapshot.forEach(doc => {
        courses.push({ id: doc.id, ...doc.data() });
      });

      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add course to faculty
  router.post('/institutions/:institutionId/faculties/:facultyId/courses', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId, facultyId } = req.params;
      const courseData = req.body;

      const courseRef = await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .doc(facultyId)
        .collection('courses')
        .add({
          ...courseData,
          createdAt: new Date()
        });

      res.status(201).json({ id: courseRef.id, message: 'Course added successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update course
  router.put('/institutions/:institutionId/faculties/:facultyId/courses/:courseId', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId, facultyId, courseId } = req.params;
      const updateData = req.body;

      await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .doc(facultyId)
        .collection('courses')
        .doc(courseId)
        .update({
          ...updateData,
          updatedAt: new Date()
        });

      res.json({ message: 'Course updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete course
  router.delete('/institutions/:institutionId/faculties/:facultyId/courses/:courseId', verifyAdminAccess, async (req, res) => {
    try {
      const { institutionId, facultyId, courseId } = req.params;
      await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .doc(facultyId)
        .collection('courses')
        .doc(courseId)
        .delete();
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== COMPANY MANAGEMENT ==========

  // Get all companies
  router.get('/companies', verifyAdminAccess, async (req, res) => {
    try {
      const companiesSnapshot = await db.collection('companies').get();
      const companies = [];
      
      companiesSnapshot.forEach(doc => {
        companies.push({ id: doc.id, ...doc.data() });
      });
      
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve company
  router.put('/companies/:companyId/approve', verifyAdminAccess, async (req, res) => {
    try {
      const { companyId } = req.params;
      await db.collection('companies').doc(companyId).update({
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });
      res.json({ message: 'Company approved successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Suspend company
  router.put('/companies/:companyId/suspend', verifyAdminAccess, async (req, res) => {
    try {
      const { companyId } = req.params;
      await db.collection('companies').doc(companyId).update({
        status: 'suspended',
        suspendedAt: new Date(),
        updatedAt: new Date()
      });
      res.json({ message: 'Company suspended successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete company
  router.delete('/companies/:companyId', verifyAdminAccess, async (req, res) => {
    try {
      const { companyId } = req.params;
      await db.collection('companies').doc(companyId).delete();
      // Also delete user account
      await auth.deleteUser(companyId);
      res.json({ message: 'Company deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== ADMISSIONS MANAGEMENT ==========

  // Get all admissions
  router.get('/admissions', verifyAdminAccess, async (req, res) => {
    try {
      const admissionsSnapshot = await db.collection('admissions').get();
      const admissions = [];

      for (const doc of admissionsSnapshot.docs) {
        const admissionData = doc.data();
        const instituteDoc = await db.collection('institutions').doc(admissionData.instituteId).get();
        
        admissions.push({
          id: doc.id,
          ...admissionData,
          instituteName: instituteDoc.exists ? instituteDoc.data().name : 'Unknown'
        });
      }

      res.json(admissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Publish admissions
  router.post('/admissions/publish', verifyAdminAccess, async (req, res) => {
    try {
      const { admissionData } = req.body;

      const admissionRef = await db.collection('admissions').add({
        ...admissionData,
        publishedAt: new Date(),
        publishedBy: req.userId
      });

      res.status(201).json({ id: admissionRef.id, message: 'Admissions published successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all applications
  router.get('/applications', verifyAdminAccess, async (req, res) => {
    try {
      const applicationsSnapshot = await db.collection('applications').get();
      const applications = [];

      for (const doc of applicationsSnapshot.docs) {
        const appData = doc.data();
        const [instituteDoc, studentDoc] = await Promise.all([
          db.collection('institutions').doc(appData.instituteId).get(),
          db.collection('students').doc(appData.studentId).get()
        ]);

        applications.push({
          id: doc.id,
          ...appData,
          instituteName: instituteDoc.exists ? instituteDoc.data().name : 'Unknown',
          studentName: studentDoc.exists ? `${studentDoc.data().personalInfo?.firstName || ''} ${studentDoc.data().personalInfo?.lastName || ''}`.trim() : 'Unknown',
          studentEmail: studentDoc.exists ? studentDoc.data().personalInfo?.email || 'Unknown' : 'Unknown'
        });
      }

      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== SYSTEM REPORTS ==========

  // Get system statistics
  router.get('/reports/statistics', verifyAdminAccess, async (req, res) => {
    try {
      const [students, institutions, companies, applications, jobs] = await Promise.all([
        db.collection('students').get(),
        db.collection('institutions').get(),
        db.collection('companies').get(),
        db.collection('applications').get(),
        db.collection('jobs').get()
      ]);

      const stats = {
        totalStudents: students.size,
        totalInstitutions: institutions.size,
        totalCompanies: companies.size,
        totalApplications: applications.size,
        totalJobs: jobs.size,
        pendingApplications: applications.docs.filter(doc => doc.data().status === 'pending').length,
        admittedApplications: applications.docs.filter(doc => doc.data().status === 'admitted').length,
        rejectedApplications: applications.docs.filter(doc => doc.data().status === 'rejected').length
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get registered users report
  router.get('/reports/users', verifyAdminAccess, async (req, res) => {
    try {
      const usersSnapshot = await db.collection('users').get();
      const users = [];

      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        users.push({
          id: doc.id,
          email: userData.email,
          userType: userData.userType,
          createdAt: userData.createdAt,
          isActive: userData.isActive
        });
      }

      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get admissions report
  router.get('/reports/admissions', verifyAdminAccess, async (req, res) => {
    try {
      const applicationsSnapshot = await db.collection('applications').get();
      const admissions = [];

      for (const doc of applicationsSnapshot.docs) {
        const appData = doc.data();
        if (appData.status === 'admitted' || appData.status === 'confirmed') {
          const [instituteDoc, studentDoc] = await Promise.all([
            db.collection('institutions').doc(appData.instituteId).get(),
            db.collection('students').doc(appData.studentId).get()
          ]);

          admissions.push({
            id: doc.id,
            studentName: studentDoc.exists ? studentDoc.data().personalInfo?.name : 'Unknown',
            studentEmail: studentDoc.exists ? studentDoc.data().personalInfo?.email : 'Unknown',
            instituteName: instituteDoc.exists ? instituteDoc.data().name : 'Unknown',
            status: appData.status,
            appliedDate: appData.appliedDate
          });
        }
      }

      res.json(admissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};