// College Chatbot Frontend JavaScript

class CollegeChatbot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.initializeEventListeners();
        this.updateTime();
    }

    initializeEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input and enable/disable send button
        this.messageInput.addEventListener('input', () => {
            this.toggleSendButton();
        });

        // Initial button state
        this.toggleSendButton();
    }

    toggleSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and disable send button
        this.messageInput.value = '';
        this.toggleSendButton();
        
        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send message to backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            // Hide typing indicator
            this.hideTypingIndicator();

            if (data.success) {
                // Add bot response to chat
                this.addMessage(data.response, 'bot');
            } else {
                // Handle error
                this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                console.error('Chat error:', data.error);
            }
        } catch (error) {
            // Hide typing indicator and show error
            this.hideTypingIndicator();
            this.addMessage('Sorry, I\'m having trouble connecting. Please check your internet connection and try again.', 'bot');
            console.error('Network error:', error);
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (sender === 'bot') {
            avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        } else {
            avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = this.formatMessage(text);

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();

        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Convert markdown-like formatting to HTML
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
            .replace(/`(.*?)`/g, '<code>$1</code>')            // Code
            .replace(/\n/g, '<br>');                           // Line breaks

        return formatted;
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    updateTime() {
        // Update the time in the initial bot message
        const initialTime = document.querySelector('.bot-message .message-time');
        if (initialTime && !initialTime.textContent) {
            initialTime.textContent = this.getCurrentTime();
        }
    }
}

// Quick message functions
function sendQuickMessage(message) {
    const chatbot = window.chatbotInstance;
    chatbot.messageInput.value = message;
    chatbot.sendMessage();
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        const chatMessages = document.getElementById('chatMessages');
        
        // Keep only the initial bot message
        const initialMessage = chatMessages.querySelector('.bot-message');
        chatMessages.innerHTML = '';
        if (initialMessage) {
            chatMessages.appendChild(initialMessage);
        }
        
        // Update time in initial message
        const timeDiv = chatMessages.querySelector('.message-time');
        if (timeDiv) {
            timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
}

// Utility functions for enhanced UX
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px'
    });

    // Set background color based on type
    const colors = {
        'info': '#667eea',
        'success': '#4CAF50',
        'error': '#ff4757',
        'warning': '#ffa502'
    };
    notification.style.background = colors[type] || colors.info;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Check connection status
async function checkConnection() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            document.querySelector('.status-indicator').className = 'status-indicator online';
            document.querySelector('.status span:last-child').textContent = 'Online';
        }
    } catch (error) {
        document.querySelector('.status-indicator').className = 'status-indicator offline';
        document.querySelector('.status span:last-child').textContent = 'Offline';
        console.error('Connection check failed:', error);
    }
}

// Add offline status styles
const style = document.createElement('style');
style.textContent = `
    .status-indicator.offline {
        background: #ff4757;
    }
    
    .notification {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbotInstance = new CollegeChatbot();
    
    // Check connection status periodically
    checkConnection();
    setInterval(checkConnection, 30000); // Check every 30 seconds
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('Welcome to College Chatbot! 🎓', 'success');
    }, 1000);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        checkConnection();
    }
});

// Add some easter eggs and fun interactions
const easterEggs = {
    'hello bot': 'Hello there! 🤖 Thanks for the friendly greeting!',
    'how are you': 'I\'m doing great! Ready to help you with all your college questions! 😊',
    'thank you': 'You\'re very welcome! Happy to help! 🌟',
    'good job': 'Thank you! I try my best to be helpful! 💪',
    'awesome': 'Glad you think so! Let me know if you need anything else! ✨'
};

// Intercept messages for easter eggs
const originalSendMessage = CollegeChatbot.prototype.sendMessage;
CollegeChatbot.prototype.sendMessage = function() {
    const message = this.messageInput.value.trim().toLowerCase();
    
    // Check for easter eggs
    if (easterEggs[message]) {
        this.addMessage(this.messageInput.value.trim(), 'user');
        this.messageInput.value = '';
        this.toggleSendButton();
        
        setTimeout(() => {
            this.addMessage(easterEggs[message], 'bot');
        }, 500);
        
        return;
    }
    
    // Call original method
    originalSendMessage.call(this);
};
