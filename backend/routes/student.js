module.exports = (db, auth) => {
  const express = require('express');
  const admin = require('firebase-admin');
  const router = express.Router();

  // Get student applications
  router.get('/applications', async (req, res) => {
    try {
      // Get student ID from auth token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        // Fallback to JWT verification
        const jwt = require('jsonwebtoken');
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId; // Map userId to uid for consistency
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const studentId = decodedToken.uid;

      // Get applications from top-level collection
      const applicationsSnapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .get();

      const applications = [];
      for (const doc of applicationsSnapshot.docs) {
        const applicationData = doc.data();

        // Get institute details
        const instituteDoc = await db.collection('institutions').doc(applicationData.instituteId).get();
        const instituteData = instituteDoc.exists ? instituteDoc.data() : {};

        // Get course details
        const courseDoc = await db.collection('institutions')
          .doc(applicationData.instituteId)
          .collection('faculties')
          .doc(applicationData.facultyId || 'unknown')
          .collection('courses')
          .doc(applicationData.courseId)
          .get();
        const courseData = courseDoc.exists ? courseDoc.data() : {};

        applications.push({
          id: doc.id,
          instituteName: instituteData.name || 'Unknown Institute',
          courseName: courseData.name || 'Unknown Course',
          ...applicationData
        });
      }

      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get institutions with faculties and courses
  router.get('/institutions', async (req, res) => {
    try {
      // Get all institutions (active or not)
      const institutionsSnapshot = await db.collection('institutions').get();

      const institutions = [];

      for (const doc of institutionsSnapshot.docs) {
        const institutionData = { id: doc.id, ...doc.data() };

        // Get faculties with their courses
        const facultiesSnapshot = await db.collection('institutions')
          .doc(doc.id)
          .collection('faculties')
          .get();

        institutionData.faculties = [];
        for (const facultyDoc of facultiesSnapshot.docs) {
          const facultyData = {
            id: facultyDoc.id,
            name: facultyDoc.data().name,
            description: facultyDoc.data().description || '',
            courses: []
          };

          // Get courses for each faculty
          const coursesSnapshot = await db.collection('institutions')
            .doc(doc.id)
            .collection('faculties')
            .doc(facultyDoc.id)
            .collection('courses')
            .get();

          facultyData.courses = coursesSnapshot.docs.map(courseDoc => ({
            id: courseDoc.id,
            ...courseDoc.data()
          }));

          institutionData.faculties.push(facultyData);
        }

        institutions.push(institutionData);
      }

      res.json(institutions);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get faculties for a specific institution
  router.get('/institutions/:institutionId/faculties', async (req, res) => {
    try {
      const { institutionId } = req.params;

      // Check if institution exists
      const institutionDoc = await db.collection('institutions').doc(institutionId).get();
      if (!institutionDoc.exists) {
        return res.status(404).json({ error: 'Institution not found' });
      }

      // Get faculties for the institution
      const facultiesSnapshot = await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .get();

      const faculties = [];
      for (const facultyDoc of facultiesSnapshot.docs) {
        const facultyData = { id: facultyDoc.id, ...facultyDoc.data() };

        // Get courses for each faculty
        const coursesSnapshot = await db.collection('institutions')
          .doc(institutionId)
          .collection('faculties')
          .doc(facultyDoc.id)
          .collection('courses')
          .get();

        facultyData.courses = coursesSnapshot.docs.map(courseDoc => ({
          id: courseDoc.id,
          ...courseDoc.data()
        }));

        faculties.push(facultyData);
      }

      res.json(faculties);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get jobs
  router.get('/jobs', async (req, res) => {
    try {
      const jobsSnapshot = await db.collection('jobs').get();
      const jobs = [];

      jobsSnapshot.forEach(doc => {
        jobs.push({ id: doc.id, ...doc.data() });
      });

      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Apply for course
  router.post('/applications', async (req, res) => {
    try {
      const { instituteId, facultyId, courseId, personalStatement, documents } = req.body;

      // Get student ID from auth token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        // Fallback to JWT verification
        const jwt = require('jsonwebtoken');
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId; // Map userId to uid for consistency
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const studentId = decodedToken.uid;

      // Validation 1: Check if student already has 2 applications to this institution
      const existingApplications = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('instituteId', '==', instituteId)
        .get();

      if (existingApplications.size >= 2) {
        return res.status(400).json({ 
          error: 'You can only apply for a maximum of 2 courses per institution' 
        });
      }

      // Validation 2: Check if student is already admitted to this institution
      const admittedApplications = existingApplications.docs.filter(
        doc => doc.data().status === 'admitted'
      );
      if (admittedApplications.length > 0) {
        return res.status(400).json({ 
          error: 'You are already admitted to a program at this institution' 
        });
      }

      // Validation 3: Check if course exists and get requirements
      const courseDoc = await db.collection('institutions')
        .doc(instituteId)
        .collection('faculties')
        .doc(facultyId)
        .collection('courses')
        .doc(courseId)
        .get();

      if (!courseDoc.exists) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const courseData = courseDoc.data();

      // Validation 4: Check student qualifications against course requirements
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        const qualifications = studentData.qualifications || {};
        
        // Check minimum grade requirements if specified
        if (courseData.minimumGrade && qualifications.highSchoolGrade) {
          if (parseFloat(qualifications.highSchoolGrade) < parseFloat(courseData.minimumGrade)) {
            return res.status(400).json({ 
              error: `You do not meet the minimum grade requirement of ${courseData.minimumGrade} for this course` 
            });
          }
        }

        // Check required subjects if specified
        if (courseData.requiredSubjects && Array.isArray(courseData.requiredSubjects)) {
          const studentSubjects = qualifications.subjects || [];
          const missingSubjects = courseData.requiredSubjects.filter(
            subject => !studentSubjects.includes(subject)
          );
          if (missingSubjects.length > 0) {
            return res.status(400).json({ 
              error: `You are missing required subjects: ${missingSubjects.join(', ')}` 
            });
          }
        }
      }

      // Validation 5: Check if already applied for this specific course
      const duplicateApplication = existingApplications.docs.find(
        doc => doc.data().courseId === courseId
      );
      if (duplicateApplication) {
        return res.status(400).json({ 
          error: 'You have already applied for this course' 
        });
      }

      const applicationData = {
        studentId,
        instituteId,
        facultyId,
        courseId,
        personalStatement,
        documents: documents || [],
        status: 'pending',
        appliedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date()
      };

      // Add to top-level applications collection for easy student querying
      const topLevelRef = await db.collection('applications').add(applicationData);

      // Also add to institution's subcollection for institution-specific queries
      await db.collection('institutions')
        .doc(instituteId)
        .collection('applications')
        .doc(topLevelRef.id)
        .set(applicationData);

      res.status(201).json({
        id: topLevelRef.id,
        message: 'Application submitted successfully',
        ...applicationData
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Upload transcript and certificates
  router.post('/transcript', async (req, res) => {
    try {
      const { transcriptUrl, certificates } = req.body;

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        const jwt = require('jsonwebtoken');
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId;
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const studentId = decodedToken.uid;

      await db.collection('students').doc(studentId).update({
        transcriptUrl,
        certificates: certificates || [],
        transcriptUploadedAt: new Date(),
        updatedAt: new Date()
      });

      res.json({ message: 'Transcript uploaded successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Select institution when admitted to multiple
  router.post('/select-institution', async (req, res) => {
    try {
      const { selectedInstituteId, selectedApplicationId } = req.body;

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        const jwt = require('jsonwebtoken');
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId;
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const studentId = decodedToken.uid;

      // Get all admitted applications
      const admittedApplications = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('status', '==', 'admitted')
        .get();

      if (admittedApplications.empty) {
        return res.status(400).json({ error: 'No admitted applications found' });
      }

      // Update selected application to confirmed
      await db.collection('applications').doc(selectedApplicationId).update({
        status: 'confirmed',
        confirmedAt: new Date()
      });

      // Reject all other admitted applications from other institutions
      const batch = db.batch();
      for (const doc of admittedApplications.docs) {
        if (doc.id !== selectedApplicationId) {
          const appData = doc.data();
          if (appData.instituteId !== selectedInstituteId) {
            batch.update(db.collection('applications').doc(doc.id), {
              status: 'rejected',
              reason: 'Student selected another institution',
              updatedAt: new Date()
            });

            // Also update in institution subcollection
            batch.update(
              db.collection('institutions')
                .doc(appData.instituteId)
                .collection('applications')
                .doc(doc.id),
              {
                status: 'rejected',
                reason: 'Student selected another institution',
                updatedAt: new Date()
              }
            );

            // Move first student from waiting list to main list
            const waitingListSnapshot = await db.collection('institutions')
              .doc(appData.instituteId)
              .collection('applications')
              .where('status', '==', 'waiting')
              .orderBy('createdAt', 'asc')
              .limit(1)
              .get();

            if (!waitingListSnapshot.empty) {
              const waitingApp = waitingListSnapshot.docs[0];
              batch.update(
                db.collection('applications').doc(waitingApp.id),
                { status: 'admitted', updatedAt: new Date() }
              );
              batch.update(
                db.collection('institutions')
                  .doc(appData.instituteId)
                  .collection('applications')
                  .doc(waitingApp.id),
                { status: 'admitted', updatedAt: new Date() }
              );
            }
          }
        }
      }

      await batch.commit();

      res.json({ message: 'Institution selected successfully. Other applications have been updated.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Apply for job
  router.post('/jobs/:jobId/apply', async (req, res) => {
    try {
      const { jobId } = req.params;

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        const jwt = require('jsonwebtoken');
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId;
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const studentId = decodedToken.uid;

      // Check if already applied
      const existingApplication = await db.collection('jobApplications')
        .where('studentId', '==', studentId)
        .where('jobId', '==', jobId)
        .get();

      if (!existingApplication.empty) {
        return res.status(400).json({ error: 'You have already applied for this job' });
      }

      // Create job application
      await db.collection('jobApplications').add({
        studentId,
        jobId,
        status: 'pending',
        appliedAt: new Date()
      });

      res.json({ message: 'Job application submitted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get notifications (FIXED - proper date handling)
  router.get('/notifications', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        const jwt = require('jsonwebtoken');
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId;
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      const studentId = decodedToken.uid;

      // Get notifications with proper timestamp handling
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', studentId)
        .get();

      const notifications = [];
      notificationsSnapshot.forEach(doc => {
        const data = doc.data();
        // Ensure createdAt is properly formatted for sorting
        let createdAt = null;
        if (data.createdAt) {
          if (data.createdAt.toDate) {
            // Firestore timestamp
            createdAt = data.createdAt.toDate().getTime();
          } else if (data.createdAt instanceof Date) {
            // JavaScript Date object
            createdAt = data.createdAt.getTime();
          } else if (typeof data.createdAt === 'string') {
            // ISO string
            createdAt = new Date(data.createdAt).getTime();
          } else {
            // Fallback to current time
            createdAt = new Date().getTime();
          }
        } else {
          // If no createdAt, use current time
          createdAt = new Date().getTime();
        }
        
        notifications.push({ 
          id: doc.id, 
          ...data,
          _sortTime: createdAt // Add sortable timestamp
        });
      });

      // Sort by createdAt descending and limit to 50
      notifications.sort((a, b) => b._sortTime - a._sortTime);
      
      // Remove the helper _sortTime property before sending response
      const cleanedNotifications = notifications.slice(0, 50).map(notification => {
        const { _sortTime, ...cleaned } = notification;
        return cleaned;
      });

      res.json(cleanedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error); // Added error logging
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notification as read
  router.put('/notifications/:notificationId/read', async (req, res) => {
    try {
      const { notificationId } = req.params;

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (firebaseError) {
        const jwt = require('jsonwebtoken');
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
          decodedToken.uid = decodedToken.userId;
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      await db.collection('notifications').doc(notificationId).update({
        read: true,
        readAt: new Date()
      });

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Send approval notification
  router.post('/send-approval-notification', async (req, res) => {
    try {
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ error: 'FCM token is required' });
      }

      const message = {
        token: fcmToken,
        data: {
          type: 'approval'
        },
        notification: {
          title: 'Registration Approval Required',
          body: 'Please approve your registration on your phone.'
        }
      };

      const response = await admin.messaging().send(message);

      res.json({
        success: true,
        messageId: response,
        message: 'Approval notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending approval notification:', error);
      res.status(500).json({ error: 'Failed to send notification: ' + error.message });
    }
  });

  return router;
};