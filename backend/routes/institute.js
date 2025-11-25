module.exports = (db, auth) => {
  const express = require('express');
  const jwt = require('jsonwebtoken');
  const router = express.Router();

  // Middleware to verify institute access
  const verifyInstituteAccess = async (req, res, next) => {
    try {
      const { instituteId } = req.params;
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Try Firebase Auth first, fallback to JWT
      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        // Fallback to JWT verification
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId; // Map userId to uid for consistency
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const userDoc = await db.collection('users').doc(decodedToken.uid).get();

      if (!userDoc.exists || userDoc.data().userType !== 'institute') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      // For institutes, the instituteId should match the user's UID
      if (decodedToken.uid !== instituteId) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      req.user = userDoc.data();
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Faculty CRUD operations
  router.post('/:instituteId/faculties', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId } = req.params;
      const facultyData = req.body;

      const facultyRef = await db.collection('institutions')
        .doc(instituteId)
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

  router.get('/:instituteId/faculties', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId } = req.params;
      const facultiesSnapshot = await db.collection('institutions')
        .doc(instituteId)
        .collection('faculties')
        .get();

      const faculties = [];
      facultiesSnapshot.forEach(doc => {
        faculties.push({ id: doc.id, ...doc.data() });
      });

      res.json(faculties);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/:instituteId/faculties/:facultyId', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId, facultyId } = req.params;
      const updateData = req.body;

      await db.collection('institutions')
        .doc(instituteId)
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

  router.delete('/:instituteId/faculties/:facultyId', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId, facultyId } = req.params;

      await db.collection('institutions')
        .doc(instituteId)
        .collection('faculties')
        .doc(facultyId)
        .delete();

      res.json({ message: 'Faculty deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Course CRUD operations (under faculties)
  router.post('/:instituteId/faculties/:facultyId/courses', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId, facultyId } = req.params;
      const courseData = req.body;

      const courseRef = await db.collection('institutions')
        .doc(instituteId)
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

  router.get('/:instituteId/faculties/:facultyId/courses', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId, facultyId } = req.params;
      const coursesSnapshot = await db.collection('institutions')
        .doc(instituteId)
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
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/:instituteId/faculties/:facultyId/courses/:courseId', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId, facultyId, courseId } = req.params;
      const updateData = req.body;

      await db.collection('institutions')
        .doc(instituteId)
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

  router.delete('/:instituteId/faculties/:facultyId/courses/:courseId', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId, facultyId, courseId } = req.params;

      await db.collection('institutions')
        .doc(instituteId)
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

  // Student Applications (from top-level applications collection)
  router.get('/:instituteId/applications', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId } = req.params;
      const applicationsSnapshot = await db.collection('applications')
        .where('instituteId', '==', instituteId)
        .get();

      const applications = [];
      for (const doc of applicationsSnapshot.docs) {
        const applicationData = doc.data();
        // Get student details
        const studentDoc = await db.collection('users').doc(applicationData.studentId).get();
        const studentData = studentDoc.exists ? studentDoc.data() : {};

        applications.push({
          id: doc.id,
          ...applicationData,
          student: {
            name: studentData.name || 'Unknown',
            email: studentData.email || 'Unknown'
          }
        });
      }

      res.json(applications);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/:instituteId/applications/:applicationId/status', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId, applicationId } = req.params;
      const { status } = req.body; // 'admitted', 'rejected', 'pending', 'waiting'

      // Validate status
      const validStatuses = ['admitted', 'rejected', 'pending', 'waiting'];
      if (!status) {
        return res.status(400).json({ error: 'Status is required in request body' });
      }
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Get application data
      const applicationDoc = await db.collection('applications').doc(applicationId).get();
      if (!applicationDoc.exists) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const applicationData = applicationDoc.data();

      // Verify the application belongs to this institution
      if (applicationData.instituteId !== instituteId) {
        return res.status(403).json({ error: 'Application does not belong to this institution' });
      }

      // If admitting a student, check if they're already admitted to another program at this institution
      if (status === 'admitted') {
        const existingAdmissions = await db.collection('applications')
          .where('studentId', '==', applicationData.studentId)
          .where('instituteId', '==', instituteId)
          .where('status', '==', 'admitted')
          .get();

        if (!existingAdmissions.empty && existingAdmissions.docs[0].id !== applicationId) {
          return res.status(400).json({ 
            error: 'This student is already admitted to another program at this institution' 
          });
        }
      }

      // Update top-level applications collection
      await db.collection('applications')
        .doc(applicationId)
        .update({
          status,
          updatedAt: new Date()
        });

      // Update or create in institution subcollection
      const institutionAppRef = db.collection('institutions')
        .doc(instituteId)
        .collection('applications')
        .doc(applicationId);
      
      const institutionAppDoc = await institutionAppRef.get();
      if (institutionAppDoc.exists) {
        await institutionAppRef.update({
          status,
          updatedAt: new Date()
        });
      } else {
        // If it doesn't exist, create it with the application data
        await institutionAppRef.set({
          ...applicationData,
          status,
          updatedAt: new Date()
        });
      }

      // Create notification if student is admitted
      if (status === 'admitted') {
        try {
          const instituteDoc = await db.collection('institutions').doc(instituteId).get();
          const instituteData = instituteDoc.exists ? instituteDoc.data() : {};
          
          // Get course details
          const courseDoc = await db.collection('institutions')
            .doc(instituteId)
            .collection('faculties')
            .doc(applicationData.facultyId || 'unknown')
            .collection('courses')
            .doc(applicationData.courseId)
            .get();
          const courseData = courseDoc.exists ? courseDoc.data() : {};

          await db.collection('notifications').add({
            userId: applicationData.studentId,
            type: 'admission',
            title: `Congratulations! You've been admitted`,
            message: `You have been admitted to ${courseData.name || 'the course'} at ${instituteData.name || 'the institution'}. Please check your applications for more details.`,
            applicationId: applicationId,
            instituteId: instituteId,
            courseId: applicationData.courseId,
            read: false,
            createdAt: new Date()
          });
        } catch (notifError) {
          console.error('Error creating admission notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      res.json({ 
        message: 'Application status updated successfully',
        applicationId,
        status 
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to update application status',
        details: error.code || 'Unknown error'
      });
    }
  });

  // Publish Admissions
  router.post('/:instituteId/admissions/publish', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId } = req.params;
      const { admissionData } = req.body;

      const admissionRef = await db.collection('admissions').add({
        instituteId,
        ...admissionData,
        publishedAt: new Date()
      });

      res.status(201).json({ id: admissionRef.id, message: 'Admissions published successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update Institution Profile
  router.put('/:instituteId/profile', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId } = req.params;
      const profileData = req.body;

      await db.collection('institutions')
        .doc(instituteId)
        .update({
          ...profileData,
          updatedAt: new Date()
        });

      res.json({ message: 'Institution profile updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get Institution Profile
  router.get('/:instituteId/profile', verifyInstituteAccess, async (req, res) => {
    try {
      const { instituteId } = req.params;
      const instituteDoc = await db.collection('institutions').doc(instituteId).get();

      if (!instituteDoc.exists) {
        return res.status(404).json({ error: 'Institution not found' });
      }

      res.json({ id: instituteDoc.id, ...instituteDoc.data() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};
