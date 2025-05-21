(function() {
  // Config defaults
  const defaultConfig = {
    apiKey: null,
    chatbotId: null, // Must be provided by user
    theme: 'light',
    position: 'bottom-right',
    greeting: 'Hello! How can I help you today?',
    apiEndpoint: 'https://vocata-ai-backend.up.railway.app', // Default to production
    useQueryExpansion: true,
    model: 'gpt-4o', // Default model
    temperature: 0.7,
    topK: 3,
    primary_color: '#0070f3',
    bubbleSize: '60px',
    logo_url: null, // Add logo URL to default config
    widget_logo: null, // Add widget logo for the chat bubble logo
    enableMarkdown: true, // Enable markdown support by default
  };

  // Create global widget namespace
  window.AIChatWidget = window.AIChatWidget || {};

  // Initialize widget
  window.AIChatWidget.init = function(userConfig = {}) {
    // Merge user config with defaults - we'll update with server config later
    const config = { ...defaultConfig, ...userConfig };
    
    if (!config.chatbotId) {
      console.error('AI Chat Widget: No chatbot ID provided. Widget cannot initialize.');
      return;
    }

    // Create a container to hold the UI elements
    const container = document.createElement('div');
    container.id = 'ai-chat-widget-container';
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    
    // Add container to the DOM before loading config to show a loading state
    document.body.appendChild(container);
    
    // Show a loading indicator while fetching config
    const loadingBubble = document.createElement('div');
    loadingBubble.id = 'ai-chat-loading-bubble';
    loadingBubble.style.width = config.bubbleSize;
    loadingBubble.style.height = config.bubbleSize;
    loadingBubble.style.borderRadius = '50%';
    loadingBubble.style.backgroundColor = config.primary_color;
    loadingBubble.style.color = 'white';
    loadingBubble.style.display = 'flex';
    loadingBubble.style.alignItems = 'center';
    loadingBubble.style.justifyContent = 'center';
    loadingBubble.style.position = 'fixed';
    
    // Set position
    if (config.position === 'bottom-right') {
      loadingBubble.style.right = '20px';
      loadingBubble.style.bottom = '20px';
    } else if (config.position === 'bottom-left') {
      loadingBubble.style.left = '20px';
      loadingBubble.style.bottom = '20px';
    }
    
    loadingBubble.innerHTML = '<div class="loading-spinner"></div>';
    
    // Add spinner styles
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleEl);
    
    container.appendChild(loadingBubble);
    
    // Fetch the full configuration from the server
    const configUrl = `${config.apiEndpoint}/chatbots/${config.chatbotId}/widget-config`;
    
    fetch(configUrl, {
      headers: {
        'X-Client-Key': config.clientApiKey || ''
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load chatbot config: ${response.status}`);
        }
        return response.json();
      })
      
      .then(serverConfig => {
        // Remove loading indicator
        container.removeChild(loadingBubble);
        
        // Merge configurations with priority: 
        // 1. User provided config (highest priority)
        // 2. Server config
        // 3. Default config (lowest priority)
        // Start with defaults, add server config, then override with user config
        const mergedConfig = { 
          ...defaultConfig, 
          ...serverConfig,
          apiEndpoint: config.apiEndpoint, // Always use the API endpoint from user config
          chatbotId: config.chatbotId  // Always use the chatbot ID from user config
        };
        
        // Override with any user-provided options
        Object.keys(userConfig).forEach(key => {
          if (userConfig[key] !== undefined) {
            mergedConfig[key] = userConfig[key];
          }
        });
        
        // Now initialize the widget with the merged config
        initializeWidget(mergedConfig);
      })
      .catch(error => {
        console.error('AI Chat Widget:', error);
        
        // In case of error, remove loading indicator and initialize with default + user config
        if (container.contains(loadingBubble)) {
          container.removeChild(loadingBubble);
        }
        
        // Fallback to user config + defaults
        initializeWidget(config);
      });
    
    function initializeWidget(finalConfig) {
      // Insert CSS
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes blink {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        
        .ai-chat-widget-bubble {
          animation: fadeIn 0.3s ease-out;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .ai-chat-widget-bubble:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
        
        .ai-chat-widget-window {
          animation: slideUp 0.3s ease-out;
        }
        
        .ai-chat-widget-message {
          animation: fadeIn 0.3s ease-out;
        }
        
        .ai-chat-thinking-dot {
          animation: blink 1.4s infinite both;
        }
        
        .ai-chat-thinking-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .ai-chat-thinking-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        .ai-chat-send-btn {
          transition: all 0.2s ease;
        }
        
        .ai-chat-send-btn:hover {
          transform: scale(1.1);
        }
        
        .ai-chat-widget-header {
          position: relative;
          overflow: hidden;
        }
        
        .ai-chat-widget-header::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          100% {
            left: 100%;
          }
        }

        /* Markdown Styles */
        .ai-chat-markdown {
          line-height: 1.6;
        }

        .ai-chat-markdown p {
          margin: 0 0 1em 0;
        }

        .ai-chat-markdown p:last-child {
          margin-bottom: 0;
        }

        .ai-chat-markdown h1,
        .ai-chat-markdown h2,
        .ai-chat-markdown h3,
        .ai-chat-markdown h4,
        .ai-chat-markdown h5,
        .ai-chat-markdown h6 {
          margin: 1em 0 0.5em 0;
          font-weight: 600;
          line-height: 1.25;
        }

        .ai-chat-markdown h1 { font-size: 1.5em; }
        .ai-chat-markdown h2 { font-size: 1.3em; }
        .ai-chat-markdown h3 { font-size: 1.2em; }
        .ai-chat-markdown h4 { font-size: 1.1em; }
        .ai-chat-markdown h5 { font-size: 1em; }
        .ai-chat-markdown h6 { font-size: 0.9em; }

        .ai-chat-markdown code {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .ai-chat-markdown pre {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
          margin: 1em 0;
        }

        .ai-chat-markdown pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
        }

        .ai-chat-markdown blockquote {
          border-left: 4px solid rgba(0, 0, 0, 0.1);
          margin: 1em 0;
          padding: 0.5em 0 0.5em 1em;
          color: rgba(0, 0, 0, 0.7);
        }

        .ai-chat-markdown ul,
        .ai-chat-markdown ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        .ai-chat-markdown li {
          margin: 0.5em 0;
        }

        .ai-chat-markdown a {
          color: ${finalConfig.primary_color};
          text-decoration: none;
        }

        .ai-chat-markdown a:hover {
          text-decoration: underline;
        }

        .ai-chat-markdown img {
          max-width: 100%;
          height: auto;
          border-radius: 5px;
          margin: 1em 0;
        }

        .ai-chat-markdown table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }

        .ai-chat-markdown th,
        .ai-chat-markdown td {
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0.5em;
          text-align: left;
        }

        .ai-chat-markdown th {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .ai-chat-markdown hr {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          margin: 1em 0;
        }
      `;
      document.head.appendChild(styleEl);

      // Create widget container
      const container = document.createElement('div');
      container.id = 'ai-chat-widget-container';
      container.style.position = 'fixed';
      container.style.zIndex = '9999';
      
      // Set position
      if (finalConfig.position === 'bottom-right') {
        container.style.right = '20px';
        container.style.bottom = '20px';
      } else if (finalConfig.position === 'bottom-left') {
        container.style.left = '20px';
        container.style.bottom = '20px';
      }
      
      // Create chat bubble
      const bubble = document.createElement('div');
      bubble.id = 'ai-chat-bubble';
      bubble.className = 'ai-chat-widget-bubble';
      
      // Use widget_logo for the bubble logo if available, otherwise use default chat icon
      if (finalConfig.widget_logo) {
        bubble.innerHTML = `<img src="${finalConfig.widget_logo}" alt="Chat" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      }
      
      // Style chat bubble
      bubble.style.width = finalConfig.bubbleSize;
      bubble.style.height = finalConfig.bubbleSize;
      bubble.style.borderRadius = '50%';
      bubble.style.backgroundColor = finalConfig.primary_color;
      bubble.style.color = 'white';
      bubble.style.display = 'flex';
      bubble.style.alignItems = 'center';
      bubble.style.justifyContent = 'center';
      bubble.style.cursor = 'pointer';
      bubble.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      bubble.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      
      // Chat window
      const chatWindow = document.createElement('div');
      chatWindow.id = 'ai-chat-window';
      chatWindow.className = 'ai-chat-widget-window';
      chatWindow.style.display = 'none';
      chatWindow.style.position = 'absolute';
      chatWindow.style.bottom = '80px';
      chatWindow.style.right = '0';
      chatWindow.style.width = '370px';
      chatWindow.style.height = '600px';
      chatWindow.style.backgroundColor = 'white';
      chatWindow.style.borderRadius = '12px';
      chatWindow.style.overflow = 'hidden';
      chatWindow.style.boxShadow = '0 5px 25px rgba(0, 0, 0, 0.2)';
      chatWindow.style.transition = 'all 0.3s ease';
      chatWindow.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      chatWindow.style.display = 'none';
      chatWindow.style.flexDirection = 'column';
      
      // Create chat header
      const chatHeader = document.createElement('div');
      chatHeader.className = 'ai-chat-widget-header';
      chatHeader.style.backgroundColor = finalConfig.primary_color;
      chatHeader.style.color = 'white';
      chatHeader.style.padding = '12px 16px';
      chatHeader.style.display = 'flex';
      chatHeader.style.justifyContent = 'center';
      chatHeader.style.alignItems = 'center';
      
      // Create logo and title container
      const headerLeft = document.createElement('div');
      headerLeft.style.display = 'flex';
      headerLeft.style.alignItems = 'center';
      headerLeft.style.gap = '8px';
      
      // Create logo
      const logo = document.createElement('div');
      logo.style.width = '24px';
      logo.style.height = '24px';
      logo.style.borderRadius = '50%';
      logo.style.backgroundColor = '#fff';
      logo.style.display = 'flex';
      logo.style.alignItems = 'center';
      logo.style.justifyContent = 'center';
      
      // Use custom logo if provided in config
      if (finalConfig.logo_url) {
        logo.innerHTML = `<img src="${finalConfig.logo_url}" alt="Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        logo.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      }
      
      // Create header title
      const headerTitle = document.createElement('h3');
      headerTitle.style.margin = '0';
      headerTitle.style.fontWeight = '500';
      headerTitle.style.fontSize = '16px';
      headerTitle.textContent = finalConfig.name || 'Chat Support';
      
      // Assemble header
      headerLeft.appendChild(logo);
      headerLeft.appendChild(headerTitle);
      chatHeader.appendChild(headerLeft);
      
      // Create agent profile section
      const profileSection = document.createElement('div');
      profileSection.style.display = 'flex';
      profileSection.style.flexDirection = 'column';
      profileSection.style.alignItems = 'center';
      profileSection.style.padding = '5px 0';
      profileSection.style.textAlign = 'center';
      
      // Create "Today" label
      const todayLabel = document.createElement('div');
      todayLabel.style.fontSize = '12px';
      todayLabel.style.color = '#9ca3af';
      todayLabel.style.marginTop = '5px';
      todayLabel.style.marginBottom = '4px';
      todayLabel.textContent = 'Today';
      
      // Assemble profile section
      profileSection.appendChild(todayLabel);
      
      // Create chat messages container
      const messagesContainer = document.createElement('div');
      messagesContainer.style.flex = '1';
      messagesContainer.style.overflowY = 'auto';
      messagesContainer.style.padding = '12px 16px';
      messagesContainer.style.scrollBehavior = 'smooth';
      messagesContainer.style.backgroundColor = '#fff';
      messagesContainer.style.overflowX = 'hidden'; // Prevent horizontal scrolling
      
      // Add initial greeting message
      const greetingMessage = document.createElement('div');
      greetingMessage.className = 'ai-chat-widget-message';
      greetingMessage.style.display = 'flex';
      greetingMessage.style.alignItems = 'flex-start';
      greetingMessage.style.maxWidth = '80%';
      greetingMessage.style.marginBottom = '12px';
      greetingMessage.style.clear = 'both';
      greetingMessage.style.float = 'left';
      
      // Create greeting content
      const greetingContent = document.createElement('div');
      greetingContent.style.padding = '10px 16px';
      greetingContent.style.borderRadius = '16px';
      greetingContent.style.backgroundColor = '#f1f5f9';
      greetingContent.style.color = '#1f2937';
      greetingContent.style.borderBottomLeftRadius = '4px';
      greetingContent.style.fontSize = '14px';
      greetingContent.style.lineHeight = '1.5';
      greetingContent.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
      greetingContent.textContent = finalConfig.greeting;
      
      greetingMessage.appendChild(greetingContent);
      
      // Create feedback section
      const feedbackSection = document.createElement('div');
      feedbackSection.style.display = 'none'; // Hide the feedback section instead of 'flex'
      feedbackSection.style.alignItems = 'center';
      feedbackSection.style.gap = '8px';
      feedbackSection.style.padding = '6px 16px';
      feedbackSection.style.marginLeft = '32px';
      feedbackSection.style.marginBottom = '8px';
      
      const feedbackLabel = document.createElement('span');
      feedbackLabel.style.fontSize = '12px';
      feedbackLabel.style.color = '#9ca3af';
      feedbackLabel.textContent = 'Was this helpful?';
      
      const thumbsUpBtn = document.createElement('button');
      thumbsUpBtn.style.background = 'none';
      thumbsUpBtn.style.border = 'none';
      thumbsUpBtn.style.padding = '4px';
      thumbsUpBtn.style.cursor = 'pointer';
      thumbsUpBtn.style.color = '#9ca3af';
      thumbsUpBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
      
      const thumbsDownBtn = document.createElement('button');
      thumbsDownBtn.style.background = 'none';
      thumbsDownBtn.style.border = 'none';
      thumbsDownBtn.style.padding = '4px';
      thumbsDownBtn.style.cursor = 'pointer';
      thumbsDownBtn.style.color = '#9ca3af';
      thumbsDownBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>';
      
      feedbackSection.appendChild(feedbackLabel);
      feedbackSection.appendChild(thumbsUpBtn);
      feedbackSection.appendChild(thumbsDownBtn);
      
      // Create input container
      const inputContainer = document.createElement('div');
      inputContainer.style.padding = '12px 16px';
      inputContainer.style.borderTop = '1px solid #e5e7eb';
      inputContainer.style.backgroundColor = 'white';
      inputContainer.style.marginTop = 'auto';
      inputContainer.style.position = 'relative';
      inputContainer.style.overflow = 'visible';
      inputContainer.style.display = 'flex';
      inputContainer.style.flexDirection = 'column';
      
      // Create input field
      const inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.placeholder = 'Skriv din besked...';
      inputField.style.flex = '1';
      inputField.style.padding = '10px 16px';
      inputField.style.border = 'none';
      inputField.style.borderRadius = '24px';
      inputField.style.outline = 'none';
      inputField.style.fontSize = '14px';
      inputField.style.transition = 'border-color 0.2s ease';
      
      // Add focus effect
      inputField.addEventListener('focus', function() {
        inputField.style.borderColor = '#9ca3af';
        inputField.style.boxShadow = `0 0 0 2px rgba(${hexToRgb(finalConfig.primary_color)}, 0.2)`;
      });
      
      inputField.addEventListener('blur', function() {
        inputField.style.borderColor = '#d1d5db';
        inputField.style.boxShadow = 'none';
      });
      
      // Create send button
      const sendButton = document.createElement('button');
      sendButton.className = 'ai-chat-send-btn';
      sendButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
      sendButton.style.backgroundColor = finalConfig.primary_color;
      sendButton.style.color = 'white';
      sendButton.style.border = 'none';
      sendButton.style.borderRadius = '50%';
      sendButton.style.width = '36px';
      sendButton.style.height = '36px';
      sendButton.style.marginLeft = '0';
      sendButton.style.padding = '0';
      sendButton.style.cursor = 'pointer';
      sendButton.style.display = 'flex';
      sendButton.style.alignItems = 'center';
      sendButton.style.justifyContent = 'center';
      sendButton.style.flexShrink = '0';
      sendButton.style.position = 'absolute';
      sendButton.style.right = '0';
      sendButton.style.top = '50%';
      sendButton.style.transform = 'translateY(-50%)';
      sendButton.style.zIndex = '1';
      
      // Function to scroll messages to bottom smoothly
      function scrollToBottom() {
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
      
      // Add message to chat with improved scrolling and markdown support
      function addMessage(text, sender, sources = []) {
        const messageElement = document.createElement('div');
        messageElement.className = 'ai-chat-widget-message';
        messageElement.style.display = 'flex';
        messageElement.style.alignItems = 'flex-start';
        messageElement.style.maxWidth = '80%';
        messageElement.style.marginBottom = '12px';
        messageElement.style.clear = 'both';
        messageElement.style.wordWrap = 'break-word';
        messageElement.style.transition = 'all 0.2s ease';
        messageElement.style.animation = 'fadeIn 0.3s ease-out';
        
        if (sender === 'user') {
          messageElement.style.marginLeft = 'auto';
          messageElement.style.float = 'right';
        } else {
          messageElement.style.float = 'left';
        }
        
        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.style.padding = '10px 16px';
        messageContent.style.borderRadius = '16px';
        messageContent.style.fontSize = '14px';
        messageContent.style.lineHeight = '1.5';
        messageContent.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
        
        if (sender === 'user') {
          messageContent.style.backgroundColor = finalConfig.primary_color;
          messageContent.style.color = 'white';
          messageContent.style.borderBottomRightRadius = '4px';
        } else {
          messageContent.style.backgroundColor = '#f1f5f9';
          messageContent.style.color = '#1f2937';
          messageContent.style.borderBottomLeftRadius = '4px';
        }

        // Add markdown support for bot messages
        if (sender === 'bot' && finalConfig.enableMarkdown) {
          // Load marked library if not already loaded
          if (!window.marked) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
            script.onload = () => {
              messageContent.innerHTML = marked.parse(text);
              messageContent.classList.add('ai-chat-markdown');
            };
            document.head.appendChild(script);
          } else {
            messageContent.innerHTML = marked.parse(text);
            messageContent.classList.add('ai-chat-markdown');
          }
        } else {
          messageContent.textContent = text;
        }
        
        messageElement.appendChild(messageContent);
        
        // Add message and scroll to bottom
        messagesContainer.appendChild(messageElement);
        scrollToBottom();
      }
      
      // Function to show thinking indicator
      function showThinking() {
        thinkingIndicator.style.display = 'flex';
        messagesContainer.appendChild(thinkingIndicator);
        scrollToBottom();
      }
      
      // Function to hide thinking indicator
      function hideThinking() {
        thinkingIndicator.style.display = 'none';
        if (messagesContainer.contains(thinkingIndicator)) {
          messagesContainer.removeChild(thinkingIndicator);
        }
      }
      
      // Function to process user input and call the API
      function processUserInput() {
        const userInput = inputField.value.trim();
        if (!userInput) return;
        
        // Add user message
        addMessage(userInput, 'user');
        inputField.value = '';
        
        // Show thinking indicator
        showThinking();
        
        // Prepare the API request
        const apiUrl = `${finalConfig.apiEndpoint}/rag/chat`;
        
        const requestData = {
          chatbot_id: finalConfig.chatbotId,
          query: userInput,
          top_k: finalConfig.topK,
          model: finalConfig.model,
          temperature: finalConfig.temperature,
          use_query_expansion: finalConfig.useQueryExpansion
        };
        
        // Send API request
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Key': finalConfig.clientApiKey || ''
          },
          body: JSON.stringify(requestData)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Hide thinking indicator
          hideThinking();
          
          // Add bot message with sources
          addMessage(data.answer, 'bot', data.sources);
        })
        .catch(error => {
          console.error('Error:', error);
          hideThinking();
          addMessage('Sorry, there was an error processing your request. Please try again later.', 'bot');
        });
      }
      
      // Add a resize observer to handle any layout shifts during animation
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === chatWindow && chatWindow.style.display !== 'none') {
            scrollToBottom();
          }
        }
      });
      
      // Observe the chat window for size changes
      resizeObserver.observe(chatWindow);
      
      // Animated open/close functions with fixed positioning
      function openChatWindow() {
        // First make it visible with fixed position
        chatWindow.style.opacity = '0';
        chatWindow.style.display = 'flex';
        chatWindow.style.flexDirection = 'column';
        chatWindow.style.transform = 'translateY(20px) scale(0.98)';
        
        // Ensure proper initial scroll position
        setTimeout(scrollToBottom, 0);
        
        // Trigger animation
        setTimeout(() => {
          chatWindow.style.opacity = '1';
          chatWindow.style.transform = 'translateY(0) scale(1)';
          
          // Scroll to bottom again after animation
          setTimeout(scrollToBottom, 300);
        }, 50);
        
        // Change bubble to X icon with animation
        bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        bubble.style.transform = 'rotate(0deg)';
      }
      
      function closeChatWindow() {
        // Animate out
        chatWindow.style.opacity = '0';
        chatWindow.style.transform = 'translateY(20px) scale(0.98)';
        
        // After animation completes, hide the element
        setTimeout(() => {
          chatWindow.style.display = 'none';
        }, 300);
        
        // Change X icon back to chat bubble or custom logo with animation
        if (finalConfig.widget_logo) {
          bubble.innerHTML = `<img src="${finalConfig.widget_logo}" alt="Chat" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        }
        bubble.style.transform = 'rotate(0deg)';
      }
      
      // Event listeners
      bubble.addEventListener('click', function() {
        if (chatWindow.style.display === 'none') {
          openChatWindow();
        } else {
          closeChatWindow();
        }
      });
      
      sendButton.addEventListener('click', processUserInput);
      
      inputField.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          processUserInput();
        }
      });
      
      // Fun animation on hover
      bubble.addEventListener('mouseover', function() {
        bubble.style.transform = 'scale(1.05)';
      });
      
      bubble.addEventListener('mouseout', function() {
        bubble.style.transform = 'scale(1)';
      });
      
      // Add pulse animation on page load
      setTimeout(() => {
        bubble.style.animation = 'pulse 2s infinite';
        
        // Remove animation after a while
        setTimeout(() => {
          bubble.style.animation = '';
        }, 10000);
      }, 3000);
      
      // Create footer text
      const footerText = document.createElement('div');
      footerText.style.display = 'flex';
      footerText.style.alignItems = 'center';
      footerText.style.justifyContent = 'center';
      footerText.style.marginTop = '8px';
      footerText.style.fontSize = '12px';
      footerText.style.color = '#9ca3af';
      footerText.textContent = 'AI Assistant';
      
      // Create thinking indicator
      const thinkingIndicator = document.createElement('div');
      thinkingIndicator.style.display = 'none';
      thinkingIndicator.style.marginBottom = '12px';
      thinkingIndicator.style.float = 'left';
      thinkingIndicator.style.clear = 'both';
      thinkingIndicator.style.maxWidth = '80%';
      thinkingIndicator.style.display = 'flex';
      thinkingIndicator.style.alignItems = 'flex-start';
      
      // Create thinking dots container
      const thinkingContent = document.createElement('div');
      thinkingContent.style.padding = '10px 16px';
      thinkingContent.style.borderRadius = '16px';
      thinkingContent.style.backgroundColor = '#f1f5f9';
      thinkingContent.style.borderBottomLeftRadius = '4px';
      thinkingContent.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
      
      // Add thinking dots
      const thinkingDots = document.createElement('div');
      thinkingDots.style.display = 'flex';
      thinkingDots.style.gap = '4px';
      
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'ai-chat-thinking-dot';
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = '#9ca3af';
        thinkingDots.appendChild(dot);
      }
      
      thinkingContent.appendChild(thinkingDots);
      thinkingIndicator.appendChild(thinkingContent);
      
      // Assemble the component
      const inputWrapper = document.createElement('div');
      inputWrapper.style.display = 'flex';
      inputWrapper.style.borderRadius = '24px';
      inputWrapper.style.overflow = 'visible';
      inputWrapper.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
      inputWrapper.style.position = 'relative';
      inputWrapper.style.paddingRight = '56px';
      inputWrapper.appendChild(inputField);
      
      // Create a wrapper for the input area and button
      const inputAreaWrapper = document.createElement('div');
      inputAreaWrapper.style.position = 'relative';
      inputAreaWrapper.style.width = '100%';
      inputAreaWrapper.style.marginBottom = '8px';
      inputAreaWrapper.style.overflow = 'visible';
      
      // Add the input wrapper to the area wrapper
      inputAreaWrapper.appendChild(inputWrapper);
      
      // Add the send button directly to the input area wrapper
      inputAreaWrapper.appendChild(sendButton);
      
      // Add the input area wrapper to the input container
      inputContainer.appendChild(inputAreaWrapper);
      
      // Create "Powered by vocata" label
      const poweredByLabel = document.createElement('div');
      poweredByLabel.style.textAlign = 'center';
      poweredByLabel.style.fontSize = '12px';
      poweredByLabel.style.color = '#9ca3af';
      poweredByLabel.style.opacity = '0.7';
      poweredByLabel.style.paddingBottom = '4px';
      poweredByLabel.textContent = '⚡ Drevet af vocata.ai';
      
      // Add the powered by label to the input container
      inputContainer.appendChild(poweredByLabel);
      
      // Assemble the chat window components in a consistent order with flex layout
      chatWindow.appendChild(chatHeader);
      chatWindow.appendChild(profileSection);
      
      // Create a scrollable content container to hold all messages
      const contentContainer = document.createElement('div');
      contentContainer.style.flex = '1';
      contentContainer.style.display = 'flex';
      contentContainer.style.flexDirection = 'column';
      contentContainer.style.overflow = 'hidden';
      
      // Add messages container to content container
      contentContainer.appendChild(messagesContainer);
      messagesContainer.appendChild(greetingMessage);
      
      // Add feedback section to content container
      // Commenting out this line to remove the feedback section from the DOM
      // contentContainer.appendChild(feedbackSection);
      
      // Add content container to chat window
      chatWindow.appendChild(contentContainer);
      
      // Add input container at the bottom
      chatWindow.appendChild(inputContainer);
      
      container.appendChild(chatWindow);
      container.appendChild(bubble);
      
      // Add to document
      document.body.appendChild(container);
      
      // Set up public API methods
      window.AIChatWidget.show = function() {
        openChatWindow();
      };
      
      window.AIChatWidget.hide = function() {
        closeChatWindow();
      };
      
      window.AIChatWidget.sendMessage = function(text) {
        if (text && text.trim()) {
          // Add user message
          addMessage(text, 'user');
          
          // Process message
          inputField.value = text;
          processUserInput();
        }
      };
      
      // Initialize the chat window completely before first show
      // This ensures all calculations are done before animation
      function prepareWindowLayout() {
        // Temporarily make the chatWindow visible but with 0 opacity for layout calculation
        chatWindow.style.opacity = '0';
        chatWindow.style.display = 'flex';
        chatWindow.style.position = 'absolute';
        
        // Force layout calculation
        const height = chatWindow.offsetHeight;
        scrollToBottom();
        
        // Hide again
        chatWindow.style.display = 'none';
        chatWindow.style.opacity = '1';
      }
      
      // Run layout preparation after DOM is ready
      setTimeout(prepareWindowLayout, 100);
      
      // Return public API methods
      return {
        show: window.AIChatWidget.show,
        hide: window.AIChatWidget.hide,
        sendMessage: window.AIChatWidget.sendMessage
      };
    }

    // These are placeholder stubs that will be replaced
    return {
      show: function() {
        console.warn('Chat widget not fully initialized yet.');
      },
      hide: function() {
        console.warn('Chat widget not fully initialized yet.');
      },
      sendMessage: function(text) {
        console.warn('Chat widget not fully initialized yet.');
      }
    };
  };

  // Helper function to convert hex to RGB
  function hexToRgb(hex) {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse the hex values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Return the RGB values as a string
    return `${r}, ${g}, ${b}`;
  }
})(); 