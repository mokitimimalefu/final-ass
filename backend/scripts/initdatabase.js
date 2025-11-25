// backend/scripts/initDatabase.js
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to initialize sample data
const initializeSampleData = async () => {
  try {
    console.log('Initializing database with sample data...');

    // Create admin user
    const adminUser = {
      email: 'admin@careerplatform.ls',
      userType: 'admin',
      profileData: {
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+266 1234 5678'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    const adminRef = await db.collection('users').add(adminUser);
    console.log('Admin user created:', adminRef.id);

    // Create sample institutions
    const institutions = [
      {
        name: 'Limkokwing University of Creative Technology',
        location: 'Maseru, Lesotho',
        contact: {
          email: 'info@limkokwing.ac.ls',
          phone: '+266 2231 3751',
          address: 'Maseru, Lesotho'
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'National University of Lesotho',
        location: 'Roma, Lesotho',
        contact: {
          email: 'info@nul.ls',
          phone: '+266 5221 3421',
          address: 'Roma, Lesotho'
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const institutionData of institutions) {
      const institutionRef = await db.collection('institutions').add(institutionData);
      
      // Add sample faculties and courses
      await initializeFacultiesAndCourses(institutionRef.id);
      console.log('Institution created:', institutionRef.id);
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

const initializeFacultiesAndCourses = async (institutionId) => {
  const faculties = [
    {
      name: 'Faculty of Information & Communication Technology',
      description: 'Offering cutting-edge ICT programs',
      courses: [
        {
          name: 'BSc. In Software Engineering with Multimedia',
          duration: '4 years',
          requirements: {
            minGrade: 'C',
            subjects: ['Mathematics', 'English', 'Science'],
            points: 28
          },
          isActive: true
        },
        {
          name: 'BSc. In Computer Systems & Networks',
          duration: '4 years',
          requirements: {
            minGrade: 'C',
            subjects: ['Mathematics', 'English', 'Science'],
            points: 26
          },
          isActive: true
        }
      ]
    },
    {
      name: 'Faculty of Business',
      description: 'Business and management programs',
      courses: [
        {
          name: 'Bachelor of Business Administration',
          duration: '3 years',
          requirements: {
            minGrade: 'D',
            subjects: ['Mathematics', 'English'],
            points: 24
          },
          isActive: true
        }
      ]
    }
  ];

  for (const facultyData of faculties) {
    const facultyRef = await db.collection('institutions')
      .doc(institutionId)
      .collection('faculties')
      .add({
        name: facultyData.name,
        description: facultyData.description,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    for (const courseData of facultyData.courses) {
      await db.collection('institutions')
        .doc(institutionId)
        .collection('faculties')
        .doc(facultyRef.id)
        .collection('courses')
        .add({
          ...courseData,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
  }
};

// Run initialization
initializeSampleData();