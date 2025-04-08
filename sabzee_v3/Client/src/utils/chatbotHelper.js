/**
 * Helper utilities for Botpress chatbot integration
 */

// Available chatbot intents to help with navigation and common tasks
export const INTENTS = {
  // Navigation intents
  NAVIGATE_HOME: 'navigate_home',
  NAVIGATE_PRODUCTS: 'navigate_products',
  NAVIGATE_DASHBOARD: 'navigate_dashboard',
  NAVIGATE_PROFILE: 'navigate_profile',
  NAVIGATE_LOGIN: 'navigate_login',
  NAVIGATE_REGISTER: 'navigate_register',
  NAVIGATE_ADD_PRODUCT: 'navigate_add_product',
  NAVIGATE_CROP_SCAN: 'navigate_crop_scan',
  NAVIGATE_YIELD_PREDICTION: 'navigate_yield_prediction',
  
  // Farmer-specific intents
  EXPLAIN_CROP_DISEASES: 'explain_crop_diseases',
  EXPLAIN_YIELD_PREDICTION: 'explain_yield_prediction',
  HOW_TO_ADD_PRODUCT: 'how_to_add_product',
  CHECK_CROP_HEALTH: 'check_crop_health',
  VIEW_ORDERS: 'view_orders',
  
  // Consumer-specific intents
  FIND_PRODUCTS: 'find_products',
  TRACK_ORDER: 'track_order',
  PAYMENT_METHODS: 'payment_methods',
  DELIVERY_INFO: 'delivery_info',
  
  // General intents
  GET_HELP: 'get_help',
  CONTACT_SUPPORT: 'contact_support',
  ABOUT_SABZEE: 'about_sabzee'
};

// Map intents to URLs for navigation
export const INTENT_URL_MAP = {
  [INTENTS.NAVIGATE_HOME]: '/',
  [INTENTS.NAVIGATE_PRODUCTS]: '/products',
  [INTENTS.NAVIGATE_DASHBOARD]: '/dashboard',
  [INTENTS.NAVIGATE_PROFILE]: '/profile',
  [INTENTS.NAVIGATE_LOGIN]: '/login',
  [INTENTS.NAVIGATE_REGISTER]: '/register',
  [INTENTS.NAVIGATE_ADD_PRODUCT]: '/add-product',
  [INTENTS.NAVIGATE_CROP_SCAN]: '/crop-scan',
  [INTENTS.NAVIGATE_YIELD_PREDICTION]: '/yield-prediction',
  [INTENTS.VIEW_ORDERS]: '/dashboard',
  [INTENTS.TRACK_ORDER]: '/profile',
  [INTENTS.FIND_PRODUCTS]: '/products',
};

// Role-based access to intents
export const ROLE_BASED_INTENTS = {
  farmer: [
    INTENTS.NAVIGATE_HOME,
    INTENTS.NAVIGATE_DASHBOARD,
    INTENTS.NAVIGATE_PROFILE,
    INTENTS.NAVIGATE_ADD_PRODUCT,
    INTENTS.NAVIGATE_CROP_SCAN,
    INTENTS.NAVIGATE_YIELD_PREDICTION,
    INTENTS.EXPLAIN_CROP_DISEASES,
    INTENTS.EXPLAIN_YIELD_PREDICTION,
    INTENTS.HOW_TO_ADD_PRODUCT,
    INTENTS.CHECK_CROP_HEALTH,
    INTENTS.VIEW_ORDERS,
    INTENTS.GET_HELP,
    INTENTS.CONTACT_SUPPORT,
    INTENTS.ABOUT_SABZEE
  ],
  consumer: [
    INTENTS.NAVIGATE_HOME,
    INTENTS.NAVIGATE_PRODUCTS,
    INTENTS.NAVIGATE_PROFILE,
    INTENTS.FIND_PRODUCTS,
    INTENTS.TRACK_ORDER,
    INTENTS.PAYMENT_METHODS,
    INTENTS.DELIVERY_INFO,
    INTENTS.GET_HELP,
    INTENTS.CONTACT_SUPPORT,
    INTENTS.ABOUT_SABZEE
  ],
  visitor: [
    INTENTS.NAVIGATE_HOME,
    INTENTS.NAVIGATE_PRODUCTS,
    INTENTS.NAVIGATE_LOGIN,
    INTENTS.NAVIGATE_REGISTER,
    INTENTS.FIND_PRODUCTS,
    INTENTS.GET_HELP,
    INTENTS.CONTACT_SUPPORT,
    INTENTS.ABOUT_SABZEE
  ]
};

/**
 * Determine if a user with the given role has access to a specific intent
 * @param {string} role - User role ('farmer', 'consumer', or 'visitor')
 * @param {string} intent - The intent to check
 * @returns {boolean} Whether the user has access to the intent
 */
export const hasAccessToIntent = (role, intent) => {
  const allowedIntents = ROLE_BASED_INTENTS[role] || ROLE_BASED_INTENTS.visitor;
  return allowedIntents.includes(intent);
};

/**
 * Get URL for a specific intent if the user has access
 * @param {string} role - User role
 * @param {string} intent - The intent
 * @returns {string|null} URL for navigation or null if not accessible
 */
export const getUrlForIntent = (role, intent) => {
  if (!hasAccessToIntent(role, intent)) {
    return null;
  }
  return INTENT_URL_MAP[intent] || null;
};

/**
 * Get URL for suggestion payload from the bot
 * @param {string} payload - The suggestion payload
 * @returns {string|null} URL for navigation or null if not recognized
 */
export const getUrlFromSuggestionPayload = (payload) => {
  if (!payload) return null;
  
  // Handle navigation payloads
  if (payload.startsWith('navigate_')) {
    const path = payload.replace('navigate_', '/');
    if (path === '/home') return '/'; // Special case for home
    return path;
  }
  
  // Handle specific non-navigation payloads
  switch (payload) {
    case 'browse_products':
      return '/products';
    case 'check_crop_health':
      return '/crop-scan';
    case 'predict_yield':
      return '/yield-prediction';
    case 'view_orders':
      return '/dashboard';
    case 'create_account':
      return '/register';
    case 'track_order':
      return '/profile';
    default:
      return null;
  }
};

/**
 * Escape user input to prevent injections or problematic characters
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input
 */
export const sanitizeUserInput = (input) => {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Basic NLP preprocessing of user input
 * @param {string} input - User input
 * @returns {string} Processed input
 */
export const preprocessInput = (input) => {
  if (!input) return '';
  
  // Convert to lowercase
  let processed = input.toLowerCase();
  
  // Remove punctuation
  processed = processed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Remove extra whitespace
  processed = processed.replace(/\s{2,}/g, " ").trim();
  
  return processed;
}; 