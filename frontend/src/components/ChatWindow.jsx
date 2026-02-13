import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';

export default function ChatWindow({ messages, onSend, onUpload, loading }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: '#1a1a2e',
            }}
        >
            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {messages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <MessageBubble key={i} message={msg} />
                            ))}
                        </AnimatePresence>

                        {loading && <TypingIndicator />}

                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <InputBar onSend={onSend} onUpload={onUpload} loading={loading} />

            {/* Developer credit */}
            <div style={{
                textAlign: 'center',
                padding: '8px 0 14px',
                background: '#1a1a2e',
            }}>
                <p style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.25)',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                }}>
                    Developed by <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Kiran Kumar Petlu</span>
                </p>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '0 16px',
            }}
        >
            <h2 style={{
                fontSize: '28px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                marginBottom: '12px',
                letterSpacing: '-0.01em',
            }}>
                Ready when you are.
            </h2>
            <p style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '15px',
                maxWidth: '420px',
                lineHeight: '1.6',
            }}>
                Upload a document and ask anything about it.
            </p>
        </motion.div>
    );
}

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}
        >
            <div
                style={{
                    padding: '14px 20px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div style={{ display: 'flex', gap: '6px' }}>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8' }}
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: i * 0.15,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
