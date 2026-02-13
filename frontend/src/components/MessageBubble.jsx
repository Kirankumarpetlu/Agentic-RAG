import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HiOutlineClipboard, HiOutlineCheck } from 'react-icons/hi2';

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: '16px',
            }}
        >
            <div style={{ maxWidth: '75%' }}>
                {/* Bubble */}
                <div
                    style={{
                        position: 'relative',
                        padding: '14px 20px',
                        borderRadius: '16px',
                        fontSize: '14.5px',
                        lineHeight: '1.6',
                        ...(isUser
                            ? {
                                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                color: '#fff',
                                borderBottomRightRadius: '4px',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                            }
                            : {
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.85)',
                                borderBottomLeftRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }
                        ),
                    }}
                >
                    {isUser ? (
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
                    ) : (
                        <div className="markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}

                    {/* Copy button for AI messages */}
                    {!isUser && (
                        <button
                            onClick={handleCopy}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                padding: '6px',
                                borderRadius: '8px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.25)',
                                transition: 'all 0.2s',
                            }}
                            title="Copy response"
                        >
                            {copied ? (
                                <HiOutlineCheck style={{ width: '14px', height: '14px', color: '#34d399' }} />
                            ) : (
                                <HiOutlineClipboard style={{ width: '14px', height: '14px' }} />
                            )}
                        </button>
                    )}
                </div>

                {/* Sources & Confidence */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ marginTop: '10px' }}
                    >
                        {/* Sources */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {message.sources.map((src, i) => (
                                <span
                                    key={i}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        background: 'rgba(99,102,241,0.15)',
                                        color: '#a5b4fc',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        border: '1px solid rgba(99,102,241,0.2)',
                                    }}
                                >
                                    📄 {src}
                                </span>
                            ))}
                        </div>

                        {/* Confidence */}
                        {message.confidence !== undefined && message.confidence !== null && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '0 4px',
                                marginTop: '8px',
                            }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                                    Confidence
                                </span>
                                <div style={{
                                    flex: 1,
                                    height: '6px',
                                    background: 'rgba(255,255,255,0.06)',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.round(message.confidence * 100)}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                                        style={{
                                            height: '100%',
                                            borderRadius: '3px',
                                            background:
                                                message.confidence >= 0.8
                                                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                    : message.confidence >= 0.5
                                                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                                    {Math.round(message.confidence * 100)}%
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
