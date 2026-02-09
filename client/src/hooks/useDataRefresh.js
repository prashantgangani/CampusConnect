import { useEffect } from 'react';
import notificationService, { NOTIFICATION_EVENTS } from '../services/notificationService';

/**
 * Custom hook to automatically refresh data when specific events occur
 * @param {Function} refreshFunction - Function to call when data should be refreshed
 * @param {string|Array<string>} events - Event name(s) to listen for
 * @param {number} debounceDelay - Delay in ms before triggering refresh (default: 500)
 */
export const useDataRefresh = (
  refreshFunction,
  events = [],
  debounceDelay = 500
) => {
  useEffect(() => {
    if (!refreshFunction || !events || events.length === 0) {
      return;
    }

    // Normalize events to array
    const eventsList = Array.isArray(events) ? events : [events];
    let timeoutId;

    // Create debounced refresh function
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log(`♻️ Refreshing data due to events: ${eventsList.join(', ')}`);
        refreshFunction();
      }, debounceDelay);
    };

    // Subscribe to all relevant events
    const unsubscribers = eventsList.map((eventName) =>
      notificationService.subscribe(eventName, debouncedRefresh)
    );

    // Cleanup: unsubscribe from all events on unmount
    return () => {
      clearTimeout(timeoutId);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [refreshFunction, events, debounceDelay]);
};

export default useDataRefresh;
