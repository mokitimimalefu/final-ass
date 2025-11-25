import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebaseService';

const NotificationBell = ({ notifications }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(notif => !notif.isRead);
  
  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = unreadNotifications.map(notif => notif.id);
      const updatePromises = unreadIds.map(id => 
        updateDoc(doc(db, 'notifications', id), { isRead: true })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-primary position-relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <i className="bi bi-bell"></i>
        {unreadNotifications.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="dropdown-menu show" style={{ width: '350px', right: 0, left: 'auto' }}>
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0">Notifications</h6>
            {unreadNotifications.length > 0 && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center p-3">
                <i className="bi bi-bell-slash text-muted fs-1 mb-2"></i>
                <p className="text-muted mb-0">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 border-bottom ${!notification.isRead ? 'bg-light' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{notification.title}</h6>
                      <p className="small text-muted mb-1">{notification.message}</p>
                      <small className="text-muted">
                        {notification.createdAt?.toDate?.() 
                          ? new Date(notification.createdAt.toDate()).toLocaleDateString()
                          : new Date(notification.createdAt).toLocaleDateString()
                        }
                      </small>
                    </div>
                    {!notification.isRead && (
                      <span className="badge bg-primary ms-2">New</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 10 && (
            <div className="text-center p-2 border-top">
              <small className="text-muted">
                Showing 10 of {notifications.length} notifications
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;