// backend/controllers/jobController.js
const createJobPosting = async (jobData) => {
  const { companyId, title, description, requirements, qualifications } = jobData;
  
  try {
    // Auto-create job document
    const jobRef = await db.collection('jobs').add({
      companyId,
      title,
      description,
      requirements,
      qualifications,
      isActive: true,
      postedAt: admin.firestore.FieldValue.serverTimestamp(),
      applicationCount: 0
    });

    return jobRef.id;
  } catch (error) {
    throw new Error(`Job posting failed: ${error.message}`);
  }
};