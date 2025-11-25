import React from 'react';

const NotificationsPanel = ({ notifications, onClose, onMarkAsRead, onMarkAllAsRead, onRefresh }) => {
  // Ensure notifications is an array
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  
  const unreadNotifications = notificationsArray.filter(n => !n.read);
  const readNotifications = notificationsArray.filter(n => n.read);

  const getNotificationIcon = (type) => {
    const icons = {
      admission: '🎓',
      job_accepted: '✅',
      job_opportunity: '💼',
      job_vacancy: '📢'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      admission: 'success',
      job_accepted: 'success',
      job_opportunity: 'info',
      job_vacancy: 'primary'
    };
    return colors[type] || 'secondary';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    let date;
    try {
      // Handle different timestamp formats
      if (timestamp.seconds) {
        // Firestore timestamp
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp object
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // JavaScript Date object
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        // String date
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        // Unix timestamp
        date = new Date(timestamp);
      } else {
        // Default to now for unknown formats
        date = new Date();
      }
    } catch (e) {
      // Fallback to current date if parsing fails
      date = new Date();
    }
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="position-fixed"
      style={{
        width: '400px',
        maxHeight: '600px',
        zIndex: 1050,
        top: '70px',
        right: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="card shadow-lg border-0">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="bi bi-bell me-2"></i>
            Notifications
            {unreadNotifications.length > 0 && (
              <span className="badge bg-danger ms-2">{unreadNotifications.length}</span>
            )}
          </h6>
          <div className="d-flex gap-2">
            {unreadNotifications.length > 0 && (
              <button
                className="btn btn-sm btn-light"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                <i className="bi bi-check-all"></i>
              </button>
            )}
            <button
              className="btn btn-sm btn-light"
              onClick={onRefresh}
              title="Refresh"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            <button
              className="btn btn-sm btn-light"
              onClick={onClose}
              title="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {notificationsArray.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash text-muted fs-1 mb-3"></i>
              <p className="text-muted mb-0">No notifications</p>
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <div className="px-3 pt-3 pb-2">
                  <small className="text-muted fw-bold">NEW</small>
                </div>
              )}
              {unreadNotifications.map((notification) => (
                <div
                  key={notification.id || `unread-${notification.createdAt}`}
                  className={`border-bottom p-3 notification-item ${!notification.read ? 'bg-light' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => !notification.read && onMarkAsRead(notification.id)}
                >
                  <div className="d-flex align-items-start">
                    <div className="me-3" style={{ fontSize: '1.5rem' }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="mb-0 fw-bold">{notification.title || 'Notification'}</h6>
                        {!notification.read && (
                          <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.5rem' }}></span>
                        )}
                      </div>
                      <p className="text-muted small mb-2">{notification.message || 'No message'}</p>
                      <small className="text-muted">{formatDate(notification.createdAt)}</small>
                    </div>
                  </div>
                </div>
              ))}

              {readNotifications.length > 0 && (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="px-3 pt-3 pb-2">
                      <small className="text-muted fw-bold">EARLIER</small>
                    </div>
                  )}
                  {readNotifications.map((notification) => (
                    <div
                      key={notification.id || `read-${notification.createdAt}`}
                      className="border-bottom p-3 notification-item"
                      style={{ cursor: 'pointer', opacity: 0.7 }}
                    >
                      <div className="d-flex align-items-start">
                        <div className="me-3" style={{ fontSize: '1.5rem' }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{notification.title || 'Notification'}</h6>
                          <p className="text-muted small mb-2">{notification.message || 'No message'}</p>
                          <small className="text-muted">{formatDate(notification.createdAt)}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
        {notificationsArray.length > 0 && (
          <div className="card-footer bg-light text-center">
            <small className="text-muted">Click on unread notifications to mark as read</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;