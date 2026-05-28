import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { chatApi } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const defaultConvId = sp.get('conversation');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [typing, setTyping]               = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login?redirect=/chat'); return; }
    chatApi.conversations().then(({ data }) => {
      const convs = data.conversations || [];
      setConversations(convs);
      const conv = defaultConvId
        ? convs.find(c => c.id === defaultConvId) || null
        : convs[0] || null;
      if (conv) selectConversation(conv);
      setLoading(false);
    });
  }, [isLoggedIn]);

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    const socket = getSocket();
    if (socket && conv) {
      socket.emit('join_conversation', { conversationId: conv.id });
    }
    const { data } = await chatApi.messages(conv.id);
    setMessages(data.messages || []);
  };

  // Socket.io real-time
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', (msg) => {
      if (msg.conversationId === activeConv?.id) {
        setMessages(prev => {
          // Avoid duplicate if we sent it
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Update conversation list unread
      setConversations(prev => prev.map(c =>
        c.id === msg.conversationId
          ? { ...c, messages: [{ content: msg.content, sender: { name: '' } }] }
          : c
      ));
    });

    socket.on('user_typing', ({ userId, typing: isTyping }) => {
      if (userId !== user?.id) setTyping(isTyping);
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [activeConv, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI
    const optimisticMsg = {
      id: 'opt-' + Date.now(),
      content,
      senderId: user.id,
      sender: { id: user.id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data } = await chatApi.send(activeConv.id, content);
      // Replace optimistic message
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
    setSending(false);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (socket && activeConv) {
      socket.emit('typing_start', { conversationId: activeConv.id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { conversationId: activeConv.id });
      }, 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find(p => p.id !== user?.id) || {};
  };

  if (!isLoggedIn) return null;
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div style={s.container}>
      {/* Conversation list */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <h2 style={s.sidebarTitle}>Messages</h2>
        </div>
        {conversations.length === 0 ? (
          <div style={s.noConvs}>
            <p style={{ color:'#5c5852', fontSize:14, textAlign:'center' }}>
              No conversations yet.<br />
              <Link to="/vendors" style={{ color:'#c9a96e' }}>Find a designer</Link> to get started.
            </p>
          </div>
        ) : (
          conversations.map(conv => {
            const other = getOtherParticipant(conv);
            const lastMsg = conv.messages?.[0];
            const isActive = activeConv?.id === conv.id;
            return (
              <button key={conv.id} onClick={() => selectConversation(conv)} style={{ ...s.convItem, ...(isActive ? s.convItemActive : {}) }}>
                <div style={s.convAvatar}>
                  {other.avatar
                    ? <img src={other.avatar} alt={other.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={s.convAvatarFallback}>{other.name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div style={s.convInfo}>
                  <div style={s.convName}>{other.name || 'User'}</div>
                  <div style={s.convRole}>{other.role?.toLowerCase()}</div>
                  {lastMsg && <div style={s.convPreview}>{lastMsg.content}</div>}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Message area */}
      {activeConv ? (
        <div style={s.chatArea}>
          {/* Chat header */}
          <div style={s.chatHeader}>
            {(() => {
              const other = getOtherParticipant(activeConv);
              return (
                <div style={s.chatHeaderInfo}>
                  <div style={s.chatAvatar}>
                    {other.avatar
                      ? <img src={other.avatar} alt={other.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#c9a96e' }}>{other.name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <div style={s.chatHeaderName}>{other.name}</div>
                    <div style={s.chatHeaderRole}>{other.role?.toLowerCase()} {typing && '· typing...'}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Messages */}
          <div style={s.messages}>
            {messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} style={{ ...s.msgRow, ...(isMine ? s.msgRowMine : {}) }}>
                  {!isMine && (
                    <div style={s.msgAvatar}>
                      {msg.sender?.avatar
                        ? <img src={msg.sender.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:'#c9a96e' }}>{msg.sender?.name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                  )}
                  <div style={{ maxWidth:'70%' }}>
                    <div style={{ ...s.bubble, ...(isMine ? s.bubbleMine : s.bubbleTheirs), ...(msg.optimistic ? { opacity:0.7 } : {}) }}>
                      {msg.content}
                    </div>
                    <div style={{ ...s.msgTime, textAlign: isMine?'right':'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={s.inputArea}>
            <textarea
              style={s.input}
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send)"
              rows={1}
            />
            <button style={s.sendBtn} onClick={sendMessage} disabled={!input.trim() || sending}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={s.noChat}>
          <div style={{ fontSize:48, color:'#2a2a2a', marginBottom:16 }}>💬</div>
          <p style={{ color:'#5c5852', fontSize:15 }}>Select a conversation or start a new one.</p>
          <Link to="/vendors" className="btn btn-outline" style={{ marginTop:20 }}>Browse Designers</Link>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { display:'flex', height:'calc(100vh - 64px)', background:'#0a0a0a' },
  sidebar:   { width:320, borderRight:'1px solid #1a1a1a', display:'flex', flexDirection:'column', overflow:'hidden' },
  sidebarHeader: { padding:'20px 20px 16px', borderBottom:'1px solid #1a1a1a' },
  sidebarTitle:  { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb' },
  noConvs:   { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 },

  convItem:  { display:'flex', gap:14, padding:'16px 20px', background:'none', border:'none', width:'100%', textAlign:'left', cursor:'pointer', borderBottom:'1px solid #0f0f0f', transition:'background 0.15s' },
  convItemActive: { background:'#111' },
  convAvatar:{ width:44, height:44, borderRadius:'50%', overflow:'hidden', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  convAvatarFallback: { fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#c9a96e' },
  convInfo:  { flex:1, minWidth:0 },
  convName:  { fontSize:14, color:'#f5f0eb', marginBottom:2 },
  convRole:  { fontSize:11, color:'#c9a96e', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 },
  convPreview: { fontSize:12, color:'#5c5852', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },

  chatArea:  { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  chatHeader:{ padding:'16px 24px', borderBottom:'1px solid #1a1a1a', background:'#0d0d0d' },
  chatHeaderInfo: { display:'flex', alignItems:'center', gap:14 },
  chatAvatar:{ width:40, height:40, borderRadius:'50%', overflow:'hidden', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center' },
  chatHeaderName: { fontSize:15, color:'#f5f0eb', fontWeight:500 },
  chatHeaderRole: { fontSize:11, color:'#5c5852', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2 },

  messages:  { flex:1, overflow:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:16 },
  msgRow:    { display:'flex', gap:10, alignItems:'flex-end' },
  msgRowMine:{ flexDirection:'row-reverse' },
  msgAvatar: { width:32, height:32, borderRadius:'50%', overflow:'hidden', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  bubble:    { padding:'10px 16px', borderRadius:16, fontSize:14, lineHeight:1.5, wordBreak:'break-word' },
  bubbleMine:{ background:'#c9a96e', color:'#0a0a0a', borderBottomRightRadius:4 },
  bubbleTheirs: { background:'#1a1a1a', color:'#f5f0eb', borderBottomLeftRadius:4 },
  msgTime:   { fontSize:10, color:'#3a3a3a', marginTop:4, paddingLeft:4, paddingRight:4 },

  inputArea: { padding:'16px 20px', borderTop:'1px solid #1a1a1a', display:'flex', gap:12, alignItems:'flex-end', background:'#0d0d0d' },
  input:     { flex:1, background:'#111', border:'1px solid #2a2a2a', borderRadius:12, padding:'12px 16px', color:'#f5f0eb', fontSize:14, resize:'none', outline:'none', lineHeight:1.5, maxHeight:120, overflow:'auto', fontFamily:"'DM Sans',sans-serif" },
  sendBtn:   { width:44, height:44, background:'#c9a96e', border:'none', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#0a0a0a', flexShrink:0, transition:'background 0.2s' },

  noChat:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
};
