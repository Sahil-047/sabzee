# Sabzee AI Chatbot Setup Guide

This guide will help you set up the Botpress-powered AI chatbot for the Sabzee platform, providing role-based assistance to farmers and consumers.

## 1. Create a Botpress Account

1. Go to [Botpress Cloud](https://app.botpress.cloud/sign-up) and create a free account
2. After signing up, create a new bot by clicking "Create Bot"
3. Choose a name for your bot (e.g., "Sabzee Assistant") and select a language

## 2. Configure Your Bot

### Basic Configuration

1. In your Botpress dashboard, go to the bot you created
2. Navigate to "Configuration" in the sidebar
3. Update the following settings:
   - **Bot name**: Sabzee Assistant
   - **Bot description**: A helpful assistant for Sabzee's farmers and consumers
   - **Default language**: English (or your preferred language)

### Appearance

1. Go to "Appearance" in the sidebar
2. Customize the bot's appearance to match Sabzee's branding:
   - **Primary color**: `#22c55e` (green)
   - **Secondary color**: `#064e3b` (dark green)
   - **Bot avatar**: Upload the Sabzee logo or a farming-related icon

## 3. Create Intents and Flows

### Essential Intents

Create the following intents in the Botpress dashboard:

1. **Greeting Intent**
   - Training phrases: "hello", "hi", "hey", "good morning", "good afternoon"

2. **Navigation Intents**
   - For browsing products: "show products", "browse items", "what can I buy"
   - For farmer dashboard: "go to dashboard", "show my dashboard", "my farm"
   - For crop scanning: "scan crops", "check disease", "plant health"
   - For yield prediction: "predict yield", "forecast harvest", "yield estimate"

3. **Farmer-Specific Intents**
   - Adding products: "how to add product", "sell my crops", "list items for sale"
   - Crop health: "check crop health", "plant disease", "pest control"
   - Yield information: "improve yield", "better harvest", "crop productivity"

4. **Consumer-Specific Intents**
   - Finding products: "find vegetables", "search for fruits", "organic produce"
   - Order tracking: "track my order", "where is my order", "delivery status"
   - Payment questions: "payment methods", "how to pay", "secure payment"

### Create Flows

Create the following conversation flows:

1. **Welcome Flow**
   - Detect user role (farmer/consumer/visitor)
   - Provide appropriate greeting and suggested topics
   - Offer quick navigation buttons based on role

2. **Role-Based Assistance**
   - Farmer assistance flow with crop management, disease detection, and yield topics
   - Consumer assistance flow with product discovery, order tracking, and payment topics
   - Visitor flow with registration benefits and product browsing information

3. **Navigation Helper**
   - Create a flow that helps users navigate to different sections of the website
   - Include direct links to key pages based on user role

## 4. Update the Botpress Bot ID

After setting up your bot, you need to update the Bot ID in the application:

1. In your Botpress dashboard, go to "Channels" > "Web" 
2. Copy the Bot ID
3. Open the file `Client/src/components/ChatBot.jsx` in your project
4. Update the `BOTPRESS_BOT_ID` constant with your Bot ID:

```javascript
const BOTPRESS_BOT_ID = "your-bot-id-here"; 
```

## 5. Testing Your Bot

1. Start your Sabzee application
2. Interact with the chatbot by clicking the chat icon
3. Test scenarios for both farmer and consumer roles
4. Verify that the bot provides role-appropriate responses and navigation

## 6. Advanced Configuration (Optional)

### Implementing NLP

For better natural language understanding:

1. Go to "NLP" in the Botpress dashboard
2. Enable the NLP engine
3. Train your bot with additional examples for each intent
4. Test and refine based on user interactions

### Adding Knowledge Base

To help with farming and product questions:

1. Go to "Knowledge Base" in the dashboard
2. Create categories for farming advice, product information, etc.
3. Add Q&A pairs for common questions
4. Enable the knowledge base in your flows

## 7. Maintenance

Regularly update your bot by:

1. Reviewing conversation logs to identify common questions
2. Adding new intents and training phrases as needed
3. Updating flows to handle edge cases
4. Keeping the knowledge base current with seasonal farming information

## Troubleshooting

If you encounter issues:

- **Bot not loading**: Check that the Bot ID is correct in `ChatBot.jsx` - replace "YOUR_BOTPRESS_BOT_ID" with a valid Bot ID from your Botpress dashboard.

- **EventHandler error**: If you see the error `"EventHandler is not a function, please provide a function"`, this is usually related to the `onEvent` method in the Botpress API. Our implementation handles this by using window event listeners instead of direct `onEvent` calls.

- **Botpress script not loading**: The ChatBot component includes a fallback UI that will be shown if the Botpress script fails to load or initialize. This ensures users always have some level of assistance.

- **Integration errors**: If you encounter other integration errors, check that you're using the latest version of the Botpress webchat SDK. Our implementation also wraps the ChatBot component in an ErrorBoundary to catch and gracefully handle runtime errors.

- **Navigation not working**: Ensure intent-to-URL mapping is correct in `chatbotHelper.js`. The `getUrlFromSuggestionPayload` function handles mapping between bot payloads and application URLs.

- **Style issues**: If the chatbot styling doesn't match your application, you can customize the CSS in `src/styles/chatbot.css` or update the Botpress stylesheet URL in the `init` method.

For more help, visit the [Botpress Documentation](https://botpress.com/docs). 