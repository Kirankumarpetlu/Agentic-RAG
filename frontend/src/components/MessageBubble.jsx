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
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.55), rgba(124,58,237,0.5))',
                                color: '#fff',
                                borderBottomRightRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                boxShadow: '0 4px 20px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                            }
                            : {
                                background: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.85)',
                                borderBottomLeftRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
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
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.3)',
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(8px)',
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
                                        borderRadius: '10px',
                                        background: 'rgba(99,102,241,0.12)',
                                        color: '#a5b4fc',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        border: '1px solid rgba(99,102,241,0.15)',
                                        backdropFilter: 'blur(8px)',
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
                                    border: '1px solid rgba(255,255,255,0.04)',
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
                                                    ? 'linear-gradient(90deg, rgba(16,185,129,0.7), rgba(52,211,153,0.8))'
                                                    : message.confidence >= 0.5
                                                        ? 'linear-gradient(90deg, rgba(245,158,11,0.7), rgba(251,191,36,0.8))'
                                                        : 'linear-gradient(90deg, rgba(239,68,68,0.7), rgba(248,113,113,0.8))',
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
