/**
 * Chatbot Configuration
 * 
 * This file contains predefined responses and topic suggestions for the Botpress chatbot
 * based on user roles and context.
 */

// Fallback responses when the bot doesn't understand
export const FALLBACK_RESPONSES = [
  "I'm not sure I understand. Could you please rephrase your question?",
  "I didn't quite catch that. Could you try asking in a different way?",
  "I'm still learning! Could you be more specific with your question?"
];

// Greeting messages based on user role
export const GREETING_MESSAGES = {
  farmer: "Welcome to Sabzee! As a farmer, I can help you with crop management, disease detection, yield predictions, and more. How can I assist you today?",
  consumer: "Welcome to Sabzee! I can help you find fresh produce, track orders, and learn more about where your food comes from. What would you like to know?",
  visitor: "Welcome to Sabzee! I'm here to help you explore our farm-to-consumer marketplace. Would you like to learn more about buying or selling on our platform?"
};

// Topic suggestions based on user role
export const TOPIC_SUGGESTIONS = {
  farmer: [
    {
      text: "How to add a new product",
      value: "how_to_add_product"
    },
    {
      text: "Check crop health",
      value: "check_crop_health"
    },
    {
      text: "Predict crop yield",
      value: "predict_yield"
    },
    {
      text: "View order status",
      value: "view_orders"
    },
    {
      text: "Update farm profile",
      value: "update_profile"
    }
  ],
  consumer: [
    {
      text: "Browse products",
      value: "browse_products"
    },
    {
      text: "Track my order",
      value: "track_order"
    },
    {
      text: "Learn about farmers",
      value: "learn_about_farmers"
    },
    {
      text: "Payment methods",
      value: "payment_methods"
    },
    {
      text: "Return policy",
      value: "return_policy"
    }
  ],
  visitor: [
    {
      text: "Create an account",
      value: "create_account"
    },
    {
      text: "How Sabzee works",
      value: "how_it_works"
    },
    {
      text: "Seller information",
      value: "seller_info"
    },
    {
      text: "Customer reviews",
      value: "customer_reviews"
    },
    {
      text: "Browse products",
      value: "browse_products"
    }
  ]
};

// Navigation help based on current path
export const NAVIGATION_HELP = {
  "/": "You're on the homepage. Here you can explore featured products, learn about our platform, or navigate to specific sections using the menu at the top.",
  "/login": "You're on the login page. Enter your email and password to access your account. If you don't have an account yet, you can register using the link below.",
  "/register": "You're on the registration page. Fill out the form to create your account. You can choose to register as a farmer or a consumer.",
  "/products": "You're browsing our product catalog. You can filter products by category, sort by price or rating, and click on any item to view details.",
  "/dashboard": "This is your dashboard where you can manage your account, view statistics, and access all your farming tools.",
  "/yield-prediction": "Here you can predict your crop yield by entering details about your farm and crops. The AI will analyze the data and provide an estimate.",
  "/crop-scan": "Use this tool to scan your crops for diseases. Upload a photo, and our AI will identify any potential issues and suggest treatments.",
  "/profile": "This is your profile page where you can update your personal information, change your password, and manage your account settings."
};

// Farming-specific knowledge base topics
export const FARMING_TOPICS = [
  "crop rotation",
  "soil health",
  "pest management",
  "organic farming",
  "water conservation",
  "sustainable agriculture",
  "yield optimization",
  "farm equipment",
  "weather patterns",
  "harvest timing",
  "seed selection",
  "fertilizer usage",
  "crop diseases",
  "irrigation techniques",
  "market pricing"
];

// Consumer-specific knowledge base topics
export const CONSUMER_TOPICS = [
  "organic produce",
  "seasonal vegetables",
  "local farming",
  "food safety",
  "nutritional information",
  "storage tips",
  "recipe ideas",
  "food miles",
  "sustainable consumption",
  "farm-to-table process",
  "product freshness",
  "pricing factors",
  "order tracking",
  "payment options",
  "delivery information"
];

// Help with contextual actions based on current path and role
export const getContextualHelp = (path, role) => {
  // Base navigation help
  const baseHelp = NAVIGATION_HELP[path] || "You can navigate to different sections using the menu at the top.";
  
  // Role-specific contextual help
  if (role === 'farmer') {
    if (path === '/dashboard') {
      return `${baseHelp} As a farmer, you can view your product statistics, check crop health, and predict yields from here.`;
    }
    if (path === '/add-product') {
      return `${baseHelp} Here you can add your products to sell on the marketplace. Be sure to include high-quality images and detailed descriptions.`;
    }
    if (path === '/crop-scan') {
      return `${baseHelp} Upload clear photos of your crops to detect diseases. For best results, make sure the affected area is clearly visible.`;
    }
    if (path === '/yield-prediction') {
      return `${baseHelp} Enter accurate details about your farm, soil type, and crops to get the most precise yield predictions.`;
    }
  } else if (role === 'consumer') {
    if (path === '/products') {
      return `${baseHelp} You can filter products by category, sort by price or rating, and contact farmers directly about their produce.`;
    }
    if (path.includes('/products/')) {
      return `${baseHelp} You're viewing product details. You can see information about the farmer, read reviews, and add the item to your cart.`;
    }
    if (path === '/profile') {
      return `${baseHelp} Here you can update your delivery address, payment methods, and view your order history.`;
    }
  }
  
  return baseHelp;
};

// URL navigation suggestions based on user intent
export const NAVIGATION_SUGGESTIONS = {
  add_product: {
    url: '/add-product',
    description: 'Add a new product to sell'
  },
  browse_products: {
    url: '/products',
    description: 'Browse all available products'
  },
  farmer_dashboard: {
    url: '/dashboard',
    description: 'View your farmer dashboard'
  },
  scan_crop: {
    url: '/crop-scan',
    description: 'Scan your crops for diseases'
  },
  predict_yield: {
    url: '/yield-prediction',
    description: 'Predict your crop yields'
  },
  profile: {
    url: '/profile',
    description: 'View or edit your profile'
  },
  register: {
    url: '/register',
    description: 'Create a new account'
  },
  login: {
    url: '/login',
    description: 'Login to your account'
  }
}; 