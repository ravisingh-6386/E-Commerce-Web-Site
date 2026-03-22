import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Loader } from '../components/common/Loader';
import toast from 'react-hot-toast';

let socket;

export default function Messages() {
  const { userId: recipientId } = useParams(); // optional: open a specific conversation
  const { user, token } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null); // { partner, messages }
  const [newMessage, setNewMessage] = useState('');
  const [convLoading, setConvLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  // Init socket
  useEffect(() => {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on('receive_message', (msg) => {
      setActiveConversation((prev) => {
        if (!prev) return prev;
        if (msg.sender === prev.partner._id || msg.receiver === prev.partner._id) {
          return { ...prev, messages: [...prev.messages, msg] };
        }
        return prev;
      });
      // Refresh inbox
      fetchInbox();
    });

    socket.on('user_typing', ({ userId }) => {
      if (activeConversation?.partner?._id === userId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => socket?.disconnect();
  }, [token]);

  useEffect(() => {
    fetchInbox();
  }, []);

  useEffect(() => {
    if (recipientId && inbox.length > 0) {
      const convo = inbox.find((c) => c.partner._id === recipientId);
      if (convo) openConversation(convo.partner);
      else {
        // Load partner from API to start new conversation
        api.get(`/users/${recipientId}/public`).then(({ data }) => {
          openConversation(data.user);
        }).catch(() => {});
      }
    }
  }, [recipientId, inbox.length]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const fetchInbox = async () => {
    try {
      const { data } = await api.get('/messages/inbox');
      setInbox(data.conversations || []);
    } catch {
      // silently fail
    } finally {
      setInboxLoading(false);
    }
  };

  const openConversation = async (partner) => {
    setConvLoading(true);
    setActiveConversation({ partner, messages: [] });
    try {
      const { data } = await api.get(`/messages/${partner._id}`);
      const roomId = [user._id, partner._id].sort().join('_');
      socket?.emit('join_room', roomId);
      setActiveConversation({ partner, messages: data.messages || [] });
    } catch {
      toast.error('Could not load conversation');
    } finally {
      setConvLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const { data } = await api.post('/messages', { receiver: activeConversation.partner._id, content: text });
      setActiveConversation((prev) => ({ ...prev, messages: [...prev.messages, data.message] }));
      const roomId = [user._id, activeConversation.partner._id].sort().join('_');
      socket?.emit('send_message', { roomId, message: data.message });
      fetchInbox();
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!activeConversation) return;
    const roomId = [user._id, activeConversation.partner._id].sort().join('_');
    socket?.emit('typing', { roomId, userId: user._id });
  };

  const avatarUrl = (u) => u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}&background=dc2626&color=fff`;

  return (
    <div className="container-app py-8 animate-fade-in">
      <h1 className="section-title mb-6">Messages</h1>

      <div className="card overflow-hidden flex h-[70vh]">
        {/* Inbox list */}
        <div className={`w-full sm:w-72 flex-shrink-0 border-r border-gray-200 dark:border-dark-700 flex flex-col ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-3 font-semibold text-sm border-b border-gray-100 dark:border-dark-700">Conversations</div>
          {inboxLoading ? (
            <div className="flex-1 flex items-center justify-center"><Loader /></div>
          ) : inbox.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageCircle size={40} className="mb-2 opacity-30" />
              <p className="text-sm">No conversations yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {inbox.map((c) => (
                <button
                  key={c.partner._id}
                  onClick={() => openConversation(c.partner)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-left ${activeConversation?.partner?._id === c.partner._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                >
                  <img src={avatarUrl(c.partner)} alt={c.partner.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{c.partner.name}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{c.lastMessage?.content || ''}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden sm:flex' : 'flex'}`}>
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-400">
              <div>
                <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="p-3 border-b border-gray-200 dark:border-dark-700 flex items-center gap-3">
                <button onClick={() => setActiveConversation(null)} className="sm:hidden text-gray-400 hover:text-gray-700">
                  <ArrowLeft size={20} />
                </button>
                <img src={avatarUrl(activeConversation.partner)} alt={activeConversation.partner.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm">{activeConversation.partner.name}</p>
                  {isTyping && <p className="text-xs text-primary-500 animate-pulse">typing...</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {convLoading ? (
                  <div className="flex-1 flex items-center justify-center"><Loader /></div>
                ) : activeConversation.messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  activeConversation.messages.map((msg, i) => {
                    const isOwn = msg.sender === user._id || msg.sender?._id === user._id;
                    return (
                      <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-dark-700 flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                  placeholder="Type a message..."
                  className="input flex-1 py-2"
                  autoComplete="off"
                />
                <button type="submit" disabled={!newMessage.trim()} className="btn-primary px-4 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
