import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Avatar, TextField, IconButton, List, ListItem, ListItemAvatar, ListItemText, Typography, CircularProgress, Divider, Alert } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { Icon } from '@iconify/react';
import sendIcon from '@iconify/icons-eva/paper-plane-fill';
import chatListIcon from '@iconify/icons-ion/chatbubble-outline';
import axios from 'axios';

// Replace this with your real authentication context or logic
import { useAuth } from 'src/context/AuthContext'; // or 'src/context/AuthContext'

/** Type Definitions **/
interface User {
  _id: string;
  name: string;
  profilePicture: string;
}
interface Message {
  _id: string;
  sender: string;     // user ID
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  conversation: string;
}
interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
}

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth(); // Suppose it gives { user, token }

  // State: Conversations list & selected conversation
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // State: Messages for selected conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // State: Loading & Error
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  // Socket
  const socketRef = useRef<Socket | null>(null);

  // DOM ref for auto-scrolling to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /***************************************************
   * 1. Initialize Socket.io client (once)
   ***************************************************/
  useEffect(() => {
    if (!token || !user) return;
    if (socketRef.current) return; // Prevent double-connecting

    const socket = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));

    // Listen to new incoming messages
    socket.on('newMessage', (msg: Message) => {
      console.log('Received newMessage:', msg);

      // If this message is for the conversation currently open, append it
      if (selectedConversation?._id === msg.conversation) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }

      // Update conversation’s last message
      setConversations((prev) => {
        const updated = prev.map((convo) =>
          convo._id === msg.conversation
            ? { ...convo, lastMessage: msg }
            : convo
        );
        // Move that conversation to the top (highlight)
        const highlight = updated.find((c) => c._id === msg.conversation);
        if (highlight) {
          return [highlight, ...updated.filter((c) => c._id !== msg.conversation)];
        }
        return updated;
      });
    });

    socket.on('error', (errMsg: any) => {
      setError(typeof errMsg === 'string' ? errMsg : 'Socket Error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, selectedConversation]);

  /***************************************************
   * 2. Fetch All Conversations (initially)
   ***************************************************/
  useEffect(() => {
    if (!token) return;

    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        const res = await axios.get('/api/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(res.data.conversations || []);
      } catch (err: any) {
        console.error('Fetch conversations error:', err);
        setError('Failed to load conversations');
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [token]);

  /***************************************************
   * 3. Fetch Messages of Selected Conversation
   ***************************************************/
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !token) return;
      setLoadingMessages(true);

      try {
        const res = await axios.get(
          `/api/chat/conversations/${selectedConversation._id}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(res.data.messages || []);
        scrollToBottom();

        // Join the conversation room
        socketRef.current?.emit(
          'joinConversation',
          selectedConversation._id,
          (response: any) => {
            if (response.status !== 'ok') {
              console.error('Failed to join conversation:', response.message);
              setError('Failed to join conversation');
            }
          }
        );
      } catch (err: any) {
        console.error('Fetch messages error:', err);
        setError('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, token]);

  /***************************************************
   * 4. Initialize Selected Conversation If
   *    conversationId is in the URL
   ***************************************************/
  useEffect(() => {
    const initializeConversation = async () => {
      if (!conversationId || !token) return;
      try {
        const res = await axios.get('/api/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const found = (res.data.conversations as Conversation[]).find(
          (c) => c._id === conversationId
        );
        if (found) setSelectedConversation(found);
        else setError('Conversation not found');
      } catch (err: any) {
        setError('Could not initialize conversation');
      }
    };

    initializeConversation();
  }, [conversationId, token]);

  /***************************************************
   * 5. Utility: Scroll Chat to Bottom
   ***************************************************/
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /***************************************************
   * 6. Send a New Message
   ***************************************************/
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socketRef.current) return;

    const msgContent = newMessage.trim();
    setNewMessage('');

    // Emit to server
    socketRef.current.emit('sendMessage', {
      conversationId: selectedConversation._id,
      content: msgContent,
    });
  };

  /***************************************************
   * 7. Select a Conversation from the Sidebar
   ***************************************************/
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    navigate(`/chat/${conv._id}`); // Or your route of choice
  };

  /***************************************************
   * RENDER
   ***************************************************/
  if (loadingConversations) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Grid container spacing={2}>
        {/* Sidebar - Conversation List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '80vh', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Icon icon={chatListIcon} width={24} height={24} />
              <Typography variant="h6" sx={{ ml: 1 }}>
                Conversations
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}

            <List>
              {conversations.map((conv) => {
                // Get the "other" user to display
                const other = conv.participants.find((p) => p._id !== user?._id);
                const lastMsg = conv.lastMessage?.content || 'No messages yet';

                return (
                  <React.Fragment key={conv._id}>
                    <ListItem
                      button
                      onClick={() => handleSelectConversation(conv)}
                      selected={selectedConversation?._id === conv._id}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={other?.profilePicture || ''}
                          alt={other?.name || 'No Name'}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={other?.name}
                        secondary={lastMsg}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* Main Chat Window */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {/** The "other" user in the conversation */}
                  <Avatar
                    src={
                      selectedConversation.participants.find((p) => p._id !== user?._id)
                        ?.profilePicture || ''
                    }
                    alt="User Avatar"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="h6">
                    {
                      selectedConversation.participants.find((p) => p._id !== user?._id)
                        ?.name
                    }
                  </Typography>
                </Box>

                {/* Messages List */}
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                  {loadingMessages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List>
                      {messages.map((m) => {
                        const isMe = m.sender === user?._id;
                        return (
                          <ListItem
                            key={m._id}
                            sx={{
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <Box
                              sx={{
                                backgroundColor: isMe ? '#3f51b5' : '#e0e0e0',
                                color: isMe ? '#fff' : '#000',
                                p: 1,
                                borderRadius: 2,
                                maxWidth: '70%',
                              }}
                            >
                              <Typography>{m.content}</Typography>
                              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                                {new Date(m.timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          </ListItem>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </List>
                  )}
                </Box>

                {/* Send Message Input */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <IconButton onClick={handleSendMessage} sx={{ ml: 1 }}>
                    <Icon icon={sendIcon} width={24} height={24} />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box
                sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'text.secondary' }}
              >
                <Icon icon={chatListIcon} width={48} height={48} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Select a conversation to start chatting
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatPage;
