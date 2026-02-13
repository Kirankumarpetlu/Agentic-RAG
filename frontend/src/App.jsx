import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

import { uploadFile, queryDocuments } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file) => {
    try {
      await uploadFile(file);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await queryDocuments(text);
      const aiMsg = {
        role: 'assistant',
        content: data.answer || 'No answer found.',
        sources: data.sources || [],
        confidence: data.confidence ?? null,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content - offset by sidebar width */}
      <main
        style={{
          marginLeft: '250px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <ChatWindow
                messages={messages}
                onSend={handleSend}
                onUpload={handleUpload}
                loading={loading}
              />
            </motion.div>
          )}



          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{ flex: 1, overflowY: 'auto' }}
            >
              <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>History</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>
                  Your past conversations
                </p>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '14px' }}>No conversations yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages
                      .filter((m) => m.role === 'user')
                      .map((m, i) => (
                        <div
                          key={i}
                          style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                          }}
                        >
                          <p style={{ fontSize: '14px', color: '#334155' }}>{m.content}</p>
                          <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px' }}>
                            Query #{i + 1}
                          </p>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{ flex: 1, overflowY: 'auto' }}
            >
              <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Settings</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>
                  Configure your assistant
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'API Endpoint', type: 'text', defaultValue: 'http://localhost:8000' },
                    { label: 'Top K Results', type: 'number', defaultValue: 5, min: 1, max: 20 },
                  ].map((field) => (
                    <div
                      key={field.label}
                      style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      }}
                    >
                      <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        defaultValue={field.defaultValue}
                        min={field.min}
                        max={field.max}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          color: '#334155',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ))}

                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '20px 24px',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Model</label>
                    <select
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        color: '#334155',
                        outline: 'none',
                        background: '#fff',
                      }}
                    >
                      <option>llama-3.1-8b-instant</option>
                      <option>llama-3.1-70b-versatile</option>
                      <option>mixtral-8x7b-32768</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
