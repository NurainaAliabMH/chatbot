import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { Send, Loader, MessageSquare, Trash2, Upload } from 'lucide-react';
import FileUpload from './FileUpload';
import './Chat.css';

const Chat = ({ user, onLogout }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const response = await chatAPI.getConversation(id);
      setCurrentConversation(response.data);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        conversationId: currentConversation?._id,
        message: inputMessage,
      });

      setMessages((prev) => [...prev, response.data.message]);
      
      if (!currentConversation) {
        setCurrentConversation({ _id: response.data.conversationId });
        loadConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversation(null);
    setMessages([]);
    setInputMessage('');
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await chatAPI.deleteConversation(id);
      if (currentConversation?._id === id) {
        startNewChat();
      }
      loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>EduChat AI</h2>
          <button className="btn-new-chat" onClick={startNewChat}>
            + New Chat
          </button>
        </div>

        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className={`conversation-item ${
                currentConversation?._id === conv._id ? 'active' : ''
              }`}
              onClick={() => loadConversation(conv._id)}
            >
              <MessageSquare size={18} />
              <span className="conversation-title">{conv.title}</span>
              <button
                className="btn-delete"
                onClick={(e) => deleteConversation(conv._id, e)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="btn-upload" onClick={() => setShowUpload(true)}>
            <Upload size={18} />
            Upload Document
          </button>
          <div className="user-info">
            <span>{user.name}</span>
            <button onClick={onLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <h3>
            {currentConversation
              ? conversations.find((c) => c._id === currentConversation._id)
                  ?.title || 'Chat'
              : 'New Conversation'}
          </h3>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>👋 Welcome to EduChat AI!</h2>
              <p>Your intelligent learning assistant powered by Gemini AI</p>
              <div className="suggestions">
                <button onClick={() => setInputMessage('Explain quantum physics')}>
                  Explain quantum physics
                </button>
                <button onClick={() => setInputMessage('Help me with calculus')}>
                  Help me with calculus
                </button>
                <button onClick={() => setInputMessage('What is machine learning?')}>
                  What is machine learning?
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message bot-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <Loader className="spinner" size={20} />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about your studies..."
            className="chat-input"
            disabled={loading}
          />
          <button type="submit" className="btn-send" disabled={loading || !inputMessage.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* File Upload Modal */}
      {showUpload && (
        <FileUpload onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
};

export default Chat;