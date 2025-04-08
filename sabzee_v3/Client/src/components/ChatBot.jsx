import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { GREETING_MESSAGES, TOPIC_SUGGESTIONS, getContextualHelp } from '../utils/chatbotConfig';
import { preprocessInput, sanitizeUserInput, getUrlFromSuggestionPayload } from '../utils/chatbotHelper';
import { registerBotpressEventHandler, BOTPRESS_EVENTS } from '../utils/chatbotEvents';
import '../styles/chatbot.css';

const ChatBot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const botpressWidgetRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [botInitialized, setBotInitialized] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  // Replace with your actual Botpress bot ID from Botpress Cloud
  // This is a placeholder - when testing, either get a valid Bot ID from Botpress or
  // the chatbot will use the fallback UI
  const BOTPRESS_BOT_ID = import.meta.env.VITE_BOTPRESS_BOT_ID || ""; // Get your Bot ID from Botpress Cloud

  useEffect(() => {
    // Load Botpress script when component mounts
    const loadBotpressWidget = () => {
      if (document.getElementById('botpress-webchat-script')) {
        setIsLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'botpress-webchat-script';
      script.src = 'https://cdn.botpress.cloud/webchat/v1/inject.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Botpress script");
        setLoadError(true);
      };
      
      // Set a timeout in case the script hangs
      const timeoutId = setTimeout(() => {
        if (!isLoaded) {
          setLoadError(true);
        }
      }, 10000); // 10 second timeout
      
      document.body.appendChild(script);
      
      return () => clearTimeout(timeoutId);
    };
    
    loadBotpressWidget();
    
    return () => {
      // Clean up if needed
      if (window.botpressWebChat && botpressWidgetRef.current) {
        try {
          window.botpressWebChat.sendEvent({ type: 'hide' });
        } catch (e) {
          console.error("Error hiding webchat:", e);
        }
      }
    };
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && !botInitialized && window.botpressWebChat) {
      try {
        // Initialize the bot with user context
        const userRole = user?.role || 'visitor';
        const userEmail = user?.email || '';
        const userName = user?.name || '';
        
        // Check if Bot ID is empty or invalid
        if (!BOTPRESS_BOT_ID || BOTPRESS_BOT_ID === 'your_botpress_bot_id_here') {
          console.warn('Botpress Bot ID is not configured. Set VITE_BOTPRESS_BOT_ID in your .env file.');
          setLoadError(true);
          return;
        }
        
        // Initialize Botpress chat widget
        window.botpressWebChat.init({
          botId: BOTPRESS_BOT_ID,
          hostUrl: "https://cdn.botpress.cloud/webchat/v1",
          messagingUrl: "https://messaging.botpress.cloud",
          clientId: BOTPRESS_BOT_ID,
          webhookId: BOTPRESS_BOT_ID,
          enableConversationDeletion: true,
          composerPlaceholder: "Chat with Sabzee Assistant...",
          stylesheet: "https://webchat-styler-css.botpress.app/prod/code/4cb66a6e-1d6e-4c48-8d93-4b7d2691b35c/v92614/style.css",
          showPoweredBy: false,
          theme: "light",
          disableAnimations: false,
          avatarUrl: "https://via.placeholder.com/40x40.png?text=S", // Sabzee logo or placeholder
          botName: "Sabzee Assistant",
          emailSubject: "Chat transcript",
          className: "sabzee-chatbot",
          containerWidth: '360px',
          layoutWidth: '360px',
          hideWidget: true, // We'll control visibility with our custom button
          useSessionStorage: true,
          frontendVersion: "v1",
          enableTranscriptDownload: true,
          closeOnEscape: true,
          disableNotificationSound: false,
          allowBotInfoUpdateFromPayload: true,
          enableConversationReset: true,
          userInterfaceLanguage: "en",
          metadata: {
            // Pass user context to the bot
            userRole: userRole,
            userName: userName,
            userEmail: userEmail,
            currentPath: location.pathname
          }
        });
        
        // Store reference to the webchat
        botpressWidgetRef.current = window.botpressWebChat;
        setBotInitialized(true);
        
        // Register event handlers
        const removeOpenCloseHandler = registerBotpressEventHandler(
          BOTPRESS_EVENTS.WEBCHAT_OPEN, 
          () => setIsOpen(true)
        );
        
        const removeWebchatCloseHandler = registerBotpressEventHandler(
          BOTPRESS_EVENTS.WEBCHAT_CLOSE, 
          () => setIsOpen(false)
        );
        
        const removeNavigationHandler = registerBotpressEventHandler(
          BOTPRESS_EVENTS.URL_NAVIGATION, 
          (payload) => {
            if (payload.url) {
              navigate(payload.url);
            }
          }
        );
        
        return () => {
          // Remove event listeners when component unmounts
          removeOpenCloseHandler();
          removeWebchatCloseHandler();
          removeNavigationHandler();
        };
      } catch (error) {
        console.error("Error initializing Botpress:", error);
        setLoadError(true);
      }
    }
  }, [isLoaded, user, location.pathname, botInitialized, navigate]);

  // Update bot context when user or path changes
  useEffect(() => {
    if (botInitialized && botpressWidgetRef.current) {
      const userRole = user?.role || 'visitor';
      const currentPath = location.pathname;
      
      try {
        // Merge the metadata to update the bot's context
        botpressWidgetRef.current.mergeConfig({
          metadata: {
            userRole: userRole,
            userName: user?.name || '',
            userEmail: user?.email || '',
            currentPath: currentPath
          }
        });
        
        // Send context update event to the bot
        sendContextUpdateToBotpress(userRole, currentPath);
      } catch (error) {
        console.error("Error updating bot context:", error);
      }
    }
  }, [user, location.pathname]);

  const sendContextUpdateToBotpress = (userRole, currentPath) => {
    if (botpressWidgetRef.current) {
      try {
        // Get contextual help based on current path and role
        const contextualHelp = getContextualHelp(currentPath, userRole);
        
        // Get appropriate greeting for the user role
        const greeting = GREETING_MESSAGES[userRole] || GREETING_MESSAGES.visitor;
        
        // Get appropriate topic suggestions for the user role
        const suggestions = TOPIC_SUGGESTIONS[userRole] || TOPIC_SUGGESTIONS.visitor;
        
        // Send a custom event to the bot with context information
        botpressWidgetRef.current.sendEvent({
          type: BOTPRESS_EVENTS.CONTEXT_UPDATE,
          payload: {
            userRole,
            currentPath,
            contextualHelp,
            greeting,
            suggestions,
            // Add any other context that might be useful
            isAuthenticated: !!user,
            isFarmer: userRole === 'farmer',
            isConsumer: userRole === 'consumer',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error("Error sending context update:", error);
      }
    }
  };

  const toggleBot = () => {
    if (loadError) {
      setIsOpen(!isOpen);
      return;
    }
    
    if (botpressWidgetRef.current) {
      try {
        if (isOpen) {
          botpressWidgetRef.current.hideChat();
        } else {
          botpressWidgetRef.current.showChat();
        }
        setIsOpen(!isOpen);
      } catch (error) {
        console.error("Error toggling bot:", error);
        setIsOpen(!isOpen); // Fallback to manual toggle
      }
    }
  };

  // Handle sending a message programmatically
  const sendMessage = (message) => {
    if (botpressWidgetRef.current && message) {
      try {
        const sanitizedMessage = sanitizeUserInput(message);
        botpressWidgetRef.current.sendPayload({
          type: 'text',
          text: sanitizedMessage
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };
  
  // Handle suggestion clicks in fallback UI
  const handleSuggestionClick = (value) => {
    const url = getUrlFromSuggestionPayload(value);
    if (url) {
      navigate(url);
      setIsOpen(false);
    }
  };

  // Render fallback chat UI if Botpress fails to load
  const renderFallbackChat = () => {
    if (!isOpen) return null;
    
    const userRole = user?.role || 'visitor';
    const suggestions = TOPIC_SUGGESTIONS[userRole] || TOPIC_SUGGESTIONS.visitor;
    
    // Handle click on a common action
    const handleCommonAction = (action) => {
      switch(action) {
        case 'help':
          alert('For assistance, please contact support at support@sabzee.com');
          break;
        case 'reload':
          window.location.reload();
          break;
        case 'setup_botpress':
          window.open('https://app.botpress.cloud/sign-up', '_blank');
          break;
        default:
          // Use the existing navigation handler for other actions
          handleSuggestionClick(action);
      }
    };
    
    return (
      <div className="fixed bottom-20 right-6 bg-white rounded-lg shadow-xl w-80 overflow-hidden border border-gray-200 z-50">
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h3 className="font-medium">Sabzee Assistant</h3>
          <button onClick={toggleBot} className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-700 mb-4">{GREETING_MESSAGES[userRole]}</p>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">I can help you with:</p>
            {suggestions.map((suggestion, index) => (
              <button 
                key={index}
                onClick={() => handleSuggestionClick(suggestion.value)}
                className="block w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">
              Our chatbot is currently unavailable. This happens when you haven't set up a Botpress Bot ID.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                onClick={() => handleCommonAction('help')}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-center"
              >
                Contact Support
              </button>
              <button 
                onClick={() => handleCommonAction('setup_botpress')}
                className="px-3 py-2 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md text-center"
              >
                Set Up Botpress
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {loadError && isOpen && renderFallbackChat()}
      
      {!isOpen && (
        <button
          onClick={toggleBot}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all"
          aria-label="Open chat assistant"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-6 h-6"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatBot; 