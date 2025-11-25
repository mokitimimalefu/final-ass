// backend/controllers/applicationController.js
const submitApplication = async (applicationData) => {
  const { studentId, instituteId, courseId, documents } = applicationData;
  
  try {
    // Auto-create application document
    const applicationRef = await db.collection('applications').add({
      studentId,
      instituteId,
      courseId,
      documents,
      status: 'pending',
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update student's applications count
    await db.collection('students').doc(studentId).update({
      applicationCount: admin.firestore.FieldValue.increment(1),
      lastApplicationAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return applicationRef.id;
  } catch (error) {
    throw new Error(`Application submission failed: ${error.message}`);
  }
};