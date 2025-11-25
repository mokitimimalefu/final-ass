module.exports = (db, auth) => {
  const express = require('express');
  const jwt = require('jsonwebtoken');
  const router = express.Router();

  // Middleware to verify company access
  const verifyCompanyAccess = async (req, res, next) => {
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
      if (!userDoc.exists || userDoc.data().userType !== 'company') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      const companyDoc = await db.collection('companies').doc(decodedToken.uid).get();
      if (!companyDoc.exists || companyDoc.data().status !== 'approved') {
        return res.status(403).json({ error: 'Company account not approved' });
      }

      req.user = userDoc.data();
      req.companyId = decodedToken.uid;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Get company profile
  router.get('/profile', verifyCompanyAccess, async (req, res) => {
    try {
      const companyDoc = await db.collection('companies').doc(req.companyId).get();
      if (!companyDoc.exists) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json({ id: companyDoc.id, ...companyDoc.data() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update company profile
  router.put('/profile', verifyCompanyAccess, async (req, res) => {
    try {
      const profileData = req.body;
      await db.collection('companies').doc(req.companyId).update({
        ...profileData,
        updatedAt: new Date()
      });
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== JOB POSTING ==========

  // Create job posting
  router.post('/jobs', verifyCompanyAccess, async (req, res) => {
    try {
      const { title, description, requirements, qualifications, location, salaryRange } = req.body;

      const jobRef = await db.collection('jobs').add({
        companyId: req.companyId,
        title,
        description,
        requirements: requirements || [],
        qualifications: qualifications || {},
        location,
        salaryRange,
        isActive: true,
        postedAt: new Date(),
        applicationCount: 0
      });

      // Notify qualified students
      await notifyQualifiedStudents(jobRef.id, {
        title,
        description,
        requirements,
        qualifications
      }, db);

      res.status(201).json({ id: jobRef.id, message: 'Job posted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get company's job postings
  router.get('/jobs', verifyCompanyAccess, async (req, res) => {
    try {
      const jobsSnapshot = await db.collection('jobs')
        .where('companyId', '==', req.companyId)
        .get();

      const jobs = [];
      jobsSnapshot.forEach(doc => {
        jobs.push({ id: doc.id, ...doc.data() });
      });

      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update job posting
  router.put('/jobs/:jobId', verifyCompanyAccess, async (req, res) => {
    try {
      const { jobId } = req.params;
      const updateData = req.body;

      // Verify job belongs to company
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      if (!jobDoc.exists || jobDoc.data().companyId !== req.companyId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await db.collection('jobs').doc(jobId).update({
        ...updateData,
        updatedAt: new Date()
      });

      res.json({ message: 'Job updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete job posting
  router.delete('/jobs/:jobId', verifyCompanyAccess, async (req, res) => {
    try {
      const { jobId } = req.params;

      // Verify job belongs to company
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      if (!jobDoc.exists || jobDoc.data().companyId !== req.companyId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await db.collection('jobs').doc(jobId).delete();
      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== APPLICANT MANAGEMENT ==========

  // Get filtered and qualified applicants for a job
  router.get('/jobs/:jobId/applicants', verifyCompanyAccess, async (req, res) => {
    try {
      const { jobId } = req.params;

      // Verify job belongs to company
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      if (!jobDoc.exists || jobDoc.data().companyId !== req.companyId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const jobData = jobDoc.data();

      // Get all job applications for this job
      const applicationsSnapshot = await db.collection('jobApplications')
        .where('jobId', '==', jobId)
        .where('status', '==', 'pending')
        .get();

      const qualifiedApplicants = [];

      for (const appDoc of applicationsSnapshot.docs) {
        const appData = appDoc.data();
        const studentDoc = await db.collection('students').doc(appData.studentId).get();

        if (studentDoc.exists) {
          const studentData = studentDoc.data();
          const qualifications = studentData.qualifications || {};
          const transcript = studentData.transcriptUrl ? 'uploaded' : 'not uploaded';
          const certificates = studentData.certificates || [];

          // Calculate qualification score
          let score = 0;
          let matches = [];

          // Check academic performance
          if (qualifications.highSchoolGrade) {
            const grade = parseFloat(qualifications.highSchoolGrade);
            if (jobData.qualifications?.minimumGrade) {
              if (grade >= parseFloat(jobData.qualifications.minimumGrade)) {
                score += 30;
                matches.push('Meets minimum grade');
              }
            } else {
              score += 20; // Bonus if no minimum specified
            }
          }

          // Check required subjects/courses
          if (jobData.qualifications?.requiredSubjects) {
            const studentSubjects = qualifications.subjects || [];
            const requiredSubjects = jobData.qualifications.requiredSubjects;
            const matchingSubjects = requiredSubjects.filter(s => studentSubjects.includes(s));
            if (matchingSubjects.length === requiredSubjects.length) {
              score += 30;
              matches.push('All required subjects met');
            } else if (matchingSubjects.length > 0) {
              score += 15;
              matches.push(`Partial subjects: ${matchingSubjects.join(', ')}`);
            }
          }

          // Check for transcript
          if (transcript === 'uploaded') {
            score += 20;
            matches.push('Transcript uploaded');
          }

          // Check for additional certificates
          if (certificates.length > 0) {
            score += 10 * Math.min(certificates.length, 2); // Max 20 points
            matches.push(`${certificates.length} certificate(s) uploaded`);
          }

          // Check work experience if specified
          if (jobData.qualifications?.workExperience) {
            const experience = qualifications.workExperience || [];
            if (experience.length > 0) {
              score += 20;
              matches.push('Has work experience');
            }
          }

          // Only include applicants with score >= 50 (qualified threshold)
          if (score >= 50) {
            const userDoc = await db.collection('users').doc(appData.studentId).get();
            qualifiedApplicants.push({
              applicationId: appDoc.id,
              studentId: appData.studentId,
              studentName: studentData.personalInfo?.name || 'Unknown',
              studentEmail: userDoc.exists ? userDoc.data().email : 'Unknown',
              qualifications: {
                grade: qualifications.highSchoolGrade,
                subjects: qualifications.subjects || [],
                transcript,
                certificates: certificates.length,
                workExperience: qualifications.workExperience || []
              },
              score,
              matches,
              appliedAt: appData.appliedAt
            });
          }
        }
      }

      // Sort by score (highest first)
      qualifiedApplicants.sort((a, b) => b.score - a.score);

      res.json(qualifiedApplicants);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update applicant status (ready for interview)
  router.put('/jobs/:jobId/applicants/:applicationId', verifyCompanyAccess, async (req, res) => {
    try {
      const { jobId, applicationId } = req.params;
      const { status } = req.body; // 'ready_for_interview', 'rejected', 'hired', 'accepted'

      // Verify job belongs to company
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      if (!jobDoc.exists || jobDoc.data().companyId !== req.companyId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const jobData = jobDoc.data();

      // Get application data
      const applicationDoc = await db.collection('jobApplications').doc(applicationId).get();
      if (!applicationDoc.exists) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const applicationData = applicationDoc.data();

      await db.collection('jobApplications').doc(applicationId).update({
        status,
        updatedAt: new Date()
      });

      // Create notification if student is accepted/hired
      if (status === 'accepted' || status === 'hired') {
        try {
          await db.collection('notifications').add({
            userId: applicationData.studentId,
            type: 'job_accepted',
            title: `Congratulations! Your job application has been accepted`,
            message: `Your application for ${jobData.title || 'the position'} at ${jobData.companyName || 'the company'} has been accepted. Please check your job applications for more details.`,
            jobId: jobId,
            applicationId: applicationId,
            read: false,
            createdAt: new Date()
          });
        } catch (notifError) {
          console.error('Error creating job acceptance notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      res.json({ message: 'Applicant status updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};

// Helper function to notify qualified students and all students about job vacancies
async function notifyQualifiedStudents(jobId, jobData, db) {
  try {
    // Get all students
    const studentsSnapshot = await db.collection('students').get();

    const qualifiedStudents = [];
    const allStudents = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      allStudents.push(studentDoc.id);

      // Only check qualifications for students who have uploaded transcripts (graduates)
      if (!studentData.transcriptUrl) {
        continue;
      }

      const qualifications = studentData.qualifications || {};

      let isQualified = true;

      // Check minimum grade
      if (jobData.qualifications?.minimumGrade && qualifications.highSchoolGrade) {
        if (parseFloat(qualifications.highSchoolGrade) < parseFloat(jobData.qualifications.minimumGrade)) {
          isQualified = false;
        }
      }

      // Check required subjects
      if (isQualified && jobData.qualifications?.requiredSubjects) {
        const studentSubjects = qualifications.subjects || [];
        const requiredSubjects = jobData.qualifications.requiredSubjects;
        const hasAllSubjects = requiredSubjects.every(s => studentSubjects.includes(s));
        if (!hasAllSubjects) {
          isQualified = false;
        }
      }

      if (isQualified) {
        qualifiedStudents.push(studentDoc.id);
      }
    }

    // Create notifications for qualified students (detailed notification)
    const batch = db.batch();
    for (const studentId of qualifiedStudents) {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: studentId,
        type: 'job_opportunity',
        title: `New Job Opportunity: ${jobData.title}`,
        message: `A new job posting matches your qualifications: ${jobData.title}. Check it out!`,
        jobId,
        read: false,
        createdAt: new Date()
      });
    }

    // Also notify all students about the job vacancy (general notification)
    for (const studentId of allStudents) {
      // Skip if already notified as qualified
      if (!qualifiedStudents.includes(studentId)) {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: studentId,
          type: 'job_vacancy',
          title: `New Job Vacancy Available`,
          message: `A new job posting is now available: ${jobData.title}. Check it out!`,
          jobId,
          read: false,
          createdAt: new Date()
        });
      }
    }

    await batch.commit();
    console.log(`✅ Notified ${qualifiedStudents.length} qualified students and ${allStudents.length} total students about job ${jobId}`);
  } catch (error) {
    console.error('Error notifying students:', error);
  }
}