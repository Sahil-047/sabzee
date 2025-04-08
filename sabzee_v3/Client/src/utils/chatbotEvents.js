/**
 * Chatbot event handling utilities
 * This file contains helper functions for working with Botpress events
 */

/**
 * Register a message handler for specific Botpress events
 * @param {string} eventType - The event type to listen for
 * @param {Function} callback - Callback function to execute when event is received
 * @returns {Function} - Function to remove the event listener
 */
export const registerBotpressEventHandler = (eventType, callback) => {
  if (!eventType || typeof callback !== 'function') {
    console.error('Invalid event type or callback provided to registerBotpressEventHandler');
    return () => {};
  }

  const handler = (event) => {
    if (event.data && event.data.type === eventType) {
      callback(event.data.payload || {});
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
};

/**
 * Parse Botpress webhook events
 * @param {Object} event - The event object received from Botpress
 * @returns {Object|null} - Parsed event or null if invalid
 */
export const parseBotpressEvent = (event) => {
  if (!event || !event.data || !event.data.type) {
    return null;
  }

  return {
    type: event.data.type,
    payload: event.data.payload || {}
  };
};

/**
 * Create a formatted payload for sending to Botpress
 * @param {string} type - Event type
 * @param {Object} data - Event data
 * @returns {Object} - Formatted event payload
 */
export const createBotpressPayload = (type, data = {}) => {
  return {
    type,
    payload: data
  };
};

/**
 * Standard Botpress event types
 */
export const BOTPRESS_EVENTS = {
  WEBCHAT_OPEN: 'webchatOpened',
  WEBCHAT_CLOSE: 'webchatClosed',
  URL_NAVIGATION: 'url-navigation',
  CONTEXT_UPDATE: 'context_update',
  USER_MESSAGE: 'message',
  BOT_MESSAGE: 'response'
}; 