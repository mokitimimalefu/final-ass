import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from '../firebase';
import api from './api';

const messaging = getMessaging(app);

export const notificationService = {
  // Request permission for notifications
  requestPermission: async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        return true;
      } else {
        console.log('Notification permission denied.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  // Get FCM token
  getFCMToken: async () => {
    try {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_HERE' // Replace with your VAPID key
      });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Send notification (this would typically be done from the backend)
  sendNotification: async (token, title, body) => {
    // This is a placeholder. In a real implementation, you'd send this from your backend
    console.log('Sending notification:', { token, title, body });
    // Simulate sending notification
    return { success: true };
  },

  // Listen for messages
  onMessageListener: () =>
    new Promise((resolve) => {
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        resolve(payload);
      });
    }),

  // Send approval notification
  sendApprovalNotification: async (userToken) => {
    try {
      const response = await api.post('/api/student/send-approval-notification', {
        fcmToken: userToken
      });
      return response.data;
    } catch (error) {
      console.error('Error sending approval notification:', error);
      throw error;
    }
  }
};

export default notificationService;
