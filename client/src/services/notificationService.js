// Notification Service - Event Emitter for real-time data updates
class NotificationService {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to a specific event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function when event is triggered
   * @returns {Function} - Unsubscribe function
   */
  subscribe(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[eventName] = this.listeners[eventName].filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Name of the event
   * @param {*} data - Data to pass to callback
   */
  emit(eventName, data = null) {
    console.log(`🔔 Event emitted: ${eventName}`, data);
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Name of the event
   */
  unsubscribeAll(eventName) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

// Event types
export const NOTIFICATION_EVENTS = {
  // Job events
  JOB_CREATED: 'JOB_CREATED',
  JOB_APPROVED: 'JOB_APPROVED',
  JOB_REJECTED: 'JOB_REJECTED',
  JOB_DELETED: 'JOB_DELETED',
  JOB_UPDATED: 'JOB_UPDATED',

  // Company events
  COMPANY_VERIFIED: 'COMPANY_VERIFIED',

  // Application events
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  APPLICATION_STATUS_UPDATED: 'APPLICATION_STATUS_UPDATED',

  // User events
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
};

export default notificationService;
