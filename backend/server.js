const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Initialize Firebase Admin using environment variables or service account file
const fs = require('fs');
const path = require('path');
let serviceAccount;

// Path to potential service account file
const serviceAccountPath = path.join(__dirname, 'config', 'firebase-service-account.json');
const fileExists = fs.existsSync(serviceAccountPath);

if (fileExists) {
  try {
    serviceAccount = require(serviceAccountPath);
    console.log('📁 Loaded Firebase service account from file');
  } catch (fileError) {
    console.warn('⚠️ Failed to load service account file, will attempt env vars as fallback');
    console.warn(fileError && fileError.message ? fileError.message : fileError);
  }
}

// Normalize FIREBASE_PRIVATE_KEY from env (if present)
const rawEnvPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
let envServiceAccount = null;
if (rawEnvPrivateKey && typeof rawEnvPrivateKey === 'string' && rawEnvPrivateKey.trim() !== '') {
  // Remove wrapping quotes if present (some .env tools keep them)
  let keyCandidate = rawEnvPrivateKey.trim();
  if ((keyCandidate.startsWith('"') && keyCandidate.endsWith('"')) || (keyCandidate.startsWith("'") && keyCandidate.endsWith("'"))) {
    keyCandidate = keyCandidate.slice(1, -1);
  }
  // Convert literal \n into real newlines
  keyCandidate = keyCandidate.replace(/\\n/g, '\n');

  envServiceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID || 'group2-e1233',
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || undefined,
    private_key: keyCandidate,
    client_email: process.env.FIREBASE_CLIENT_EMAIL || undefined,
    client_id: process.env.FIREBASE_CLIENT_ID || undefined,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || undefined
  };
}

// If file present prefer file-based credentials, otherwise use env-based credentials
if (!serviceAccount && envServiceAccount) {
  serviceAccount = envServiceAccount;
  console.log('📝 Using Firebase credentials from environment variables');
}

// If we have both sources, compare and warn if IDs differ to help debugging
if (serviceAccount && envServiceAccount && serviceAccount.private_key_id && envServiceAccount.private_key_id) {
  if (serviceAccount.private_key_id !== envServiceAccount.private_key_id) {
    console.warn('🔁 Mismatched Firebase key IDs detected:');
    console.warn(` - file key id: ${serviceAccount.private_key_id}`);
    console.warn(` - env  key id: ${envServiceAccount.private_key_id}`);
    console.warn('This can cause Invalid JWT Signature errors if the used key was revoked. Consider aligning keys or removing the unused credential source.');
  }
}

// Validate we actually have a private key
if (!serviceAccount || !serviceAccount.private_key || serviceAccount.private_key.trim() === '') {
  console.error('❌ Firebase private key is missing or empty!');
  console.error('Provide a valid `backend/config/firebase-service-account.json` or set `FIREBASE_PRIVATE_KEY` in your environment.');
  process.exit(1);
}

// Validate service account
if (!serviceAccount.private_key || serviceAccount.private_key.trim() === "") {
  console.error('❌ Firebase private key is missing or empty!');
  console.error('Please check your Firebase credentials configuration.');
  process.exit(1);
}

// Initialize Firebase Admin
let db, auth;

try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://group2-e1233-default-rtdb.firebaseio.com",
      storageBucket: "group2-e1233.firebasestorage.app"
    });
  }

  db = admin.firestore();
  auth = admin.auth();

  console.log('✅ Firebase Admin initialized successfully');
  console.log('💡 Note: Network errors may occur if there\'s no internet connection');
  console.log('   The server will continue running, but Firebase features require internet access');

} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);

  if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
    console.error('\n🌐 Network Error: Cannot reach Google servers');
    console.error('   This could be due to:');
    console.error('   1. No internet connection');
    console.error('   2. Firewall blocking Google services');
    console.error('   3. DNS resolution issues');
    console.error('   4. Proxy/VPN configuration');
    console.error('\n💡 Solutions:');
    console.error('   - Check your internet connection');
    console.error('   - Verify you can access https://accounts.google.com in a browser');
    console.error('   - Check firewall/proxy settings');
    console.error('   - Try using a different network');
    console.error('   - For offline development, Firebase will work once connection is restored');
    console.error('\n⚠️  Server will start, but Firebase features require internet connection');
  } else if (error.message.includes('private_key') || error.message.includes('credential')) {
    console.error('🔑 Credential Error: Invalid Firebase credentials');
    console.error('   Please verify your service account credentials are correct');
    process.exit(1);
  } else {
    console.error('   Server will continue, but Firebase may not work properly');
  }

  // Try to initialize anyway - the error might be transient
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://group2-e1233-default-rtdb.firebaseio.com",
        storageBucket: "group2-e1233.firebasestorage.app"
      });
    }
    db = admin.firestore();
    auth = admin.auth();
    console.log('⚠️  Firebase initialized (may have connection issues)');
  } catch (retryError) {
    console.error('❌ Failed to initialize Firebase even with fallback');
    process.exit(1);
  }
}

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://final-group-9.onrender.com',  // Frontend URL
    'https://final-group-11.onrender.com'  // Alternative frontend URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes (require after initialization) - only if Firebase is properly initialized
if (db && auth) {
  const authRoutes = require('./routes/auth')(db, auth);
  const adminRoutes = require('./routes/admin')(db, auth);
  const instituteRoutes = require('./routes/institute')(db, auth);
  const studentRoutes = require('./routes/student')(db, auth);
  const companyRoutes = require('./routes/company')(db, auth);

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/institute', instituteRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/company', companyRoutes);
} else {
  console.error('❌ Firebase not initialized - auth routes will not be available');
  // Add fallback route for auth endpoints
  app.use('/api/auth', (req, res) => {
    res.status(503).json({ error: 'Authentication service unavailable - Firebase not initialized' });
  });
  app.use('/api/admin', (req, res) => {
    res.status(503).json({ error: 'Admin service unavailable - Firebase not initialized' });
  });
  app.use('/api/institute', (req, res) => {
    res.status(503).json({ error: 'Institute service unavailable - Firebase not initialized' });
  });
  app.use('/api/student', (req, res) => {
    res.status(503).json({ error: 'Student service unavailable - Firebase not initialized' });
  });
  app.use('/api/company', (req, res) => {
    res.status(503).json({ error: 'Company service unavailable - Firebase not initialized' });
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Career Guidance Platform API is running!',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Root route for Render and sanity check
app.get("/", (req, res) => {
  res.status(200).send("Career Guidance Backend is running 🚀");
});

// 404 handler (must be before error handler)
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last, with 4 parameters)
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT)
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
      server.listen(PORT + 1);
    }
  })
  .on('listening', () => {
    console.log(`Server is running on port ${server.address().port}`);
  });
