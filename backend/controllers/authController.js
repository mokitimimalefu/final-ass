// backend/controllers/authController.js
const registerUser = async (userData) => {
  const { email, password, userType, profileData } = userData;
  
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false
    });

    // Auto-create user document in Firestore
    const userDoc = {
      email,
      userType,
      profileData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc);

    // Auto-create user-type specific document
    if (userType === 'student') {
      await db.collection('students').doc(userRecord.uid).set({
        personalInfo: profileData,
        qualifications: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isProfileComplete: false
      });
    } else if (userType === 'company') {
      await db.collection('companies').doc(userRecord.uid).set({
        ...profileData,
        status: 'pending', // Companies need admin approval
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else if (userType === 'institute') {
      await db.collection('institutions').doc(userRecord.uid).set({
        ...profileData,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return userRecord.uid;
  } catch (error) {
    throw new Error(`User registration failed: ${error.message}`);
  }
};
