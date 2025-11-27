module.exports = (db, auth) => {
  const express = require('express');
  const router = express.Router();
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  const { sendVerificationEmail } = require('../utils/emailService');

  // User registration
  router.post('/register', async (req, res) => {
    try {
      console.log('📨 Received registration request:', req.body);
      
      const { email, password, userType, profileData } = req.body;
      
      // Validate required fields
      if (!email || !password || !userType) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: email, password, userType' 
        });
      }

      console.log('🔧 Creating user in Firebase Auth...');
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false
      });

      console.log('✅ Firebase Auth user created:', userRecord.uid);

      // Store user data in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email,
        userType,
        profileData: profileData || {},
        createdAt: new Date(),
        isActive: true
      });

      console.log('✅ User document created in Firestore');

      // Auto-create user-type specific document
      if (userType === 'student') {
        await db.collection('students').doc(userRecord.uid).set({
          personalInfo: profileData || {},
          qualifications: {},
          createdAt: new Date(),
          isProfileComplete: false,
          isEmailVerified: false
        });
        console.log('✅ Student document created');
      } else if (userType === 'company') {
        await db.collection('companies').doc(userRecord.uid).set({
          ...(profileData || {}),
          status: 'pending',
          createdAt: new Date(),
          isEmailVerified: false
        });
        console.log('✅ Company document created');
      } else if (userType === 'institute') {
        await db.collection('institutions').doc(userRecord.uid).set({
          ...(profileData || {}),
          isActive: true,
          createdAt: new Date(),
          isEmailVerified: false
        });
        console.log('✅ Institution document created');
      } else if (userType === 'admin') {
        await db.collection('admins').doc(userRecord.uid).set({
          ...(profileData || {}),
          isActive: true,
          createdAt: new Date(),
          isEmailVerified: false
        });
        console.log('✅ Admin document created');
      }

      // Send verification email for all user types
      try {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await db.collection('emailVerifications').doc(verificationToken).set({
          userId: userRecord.uid,
          email,
          userType,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await sendVerificationEmail(email, verificationToken, userType);
        console.log(`✅ Verification email sent to ${userType}`);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        userId: userRecord.uid
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(400).json({ 
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  // User login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('🔐 Login attempt for:', email);

      // Get user from Firebase Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
      } catch (error) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();

      if (!userDoc.exists) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      const userData = userDoc.data();

      // Email verification and company approval checks removed for development

      // Generate JWT token
      const token = jwt.sign(
        { userId: userRecord.uid, userType: userData.userType },
        process.env.JWT_SECRET || 'development-secret-key',
        { expiresIn: '24h' }
      );

      console.log('✅ Login successful for:', userRecord.uid);

      res.json({ 
        success: true,
        token, 
        userType: userData.userType, 
        userId: userRecord.uid,
        email: userData.email
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(401).json({ 
        success: false,
        error: 'Login failed' 
      });
    }
  });

  // Email verification
  router.get('/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const verificationDoc = await db.collection('emailVerifications').doc(token).get();

      if (!verificationDoc.exists) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      const verificationData = verificationDoc.data();

      // Check if token is expired
      if (verificationData.expiresAt.toDate() < new Date()) {
        return res.status(400).json({ error: 'Verification token has expired' });
      }

      // Update user verification status
      await db.collection('users').doc(verificationData.userId).update({
        emailVerified: true
      });

      // Update user-type specific document
      if (verificationData.userType === 'student') {
        await db.collection('students').doc(verificationData.userId).update({
          isEmailVerified: true
        });
      } else if (verificationData.userType === 'company') {
        await db.collection('companies').doc(verificationData.userId).update({
          isEmailVerified: true
        });
      } else if (verificationData.userType === 'institute') {
        await db.collection('institutions').doc(verificationData.userId).update({
          isEmailVerified: true
        });
      } else if (verificationData.userType === 'admin') {
        await db.collection('admins').doc(verificationData.userId).update({
          isEmailVerified: true
        });
      }

      // Delete the verification token
      await db.collection('emailVerifications').doc(token).delete();

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};
