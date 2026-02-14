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

    // Frosted glass card styles
    const userBubbleStyle = {
        position: 'relative',
        padding: '16px 22px',
        borderRadius: '20px',
        borderBottomRightRadius: '6px',
        fontSize: '14.5px',
        lineHeight: '1.7',
        color: '#fff',
        background: 'linear-gradient(135deg, rgba(255, 50, 150, 0.3), rgba(200, 50, 255, 0.25), rgba(255, 120, 50, 0.2))',
        border: '1px solid rgba(255, 150, 200, 0.2)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        boxShadow: `
            0 8px 32px rgba(255, 50, 150, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05)
        `,
    };

    const aiBubbleStyle = {
        position: 'relative',
        padding: '16px 22px',
        borderRadius: '20px',
        borderBottomLeftRadius: '6px',
        fontSize: '14.5px',
        lineHeight: '1.7',
        color: 'rgba(255, 255, 255, 0.9)',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(28px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
        boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.25),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(255, 255, 255, 0.03)
        `,
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
                {/* Frosted glass bubble */}
                <div style={isUser ? userBubbleStyle : aiBubbleStyle}>
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
                                top: '12px',
                                right: '12px',
                                padding: '6px',
                                borderRadius: '10px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer',
                                color: 'rgba(255, 255, 255, 0.3)',
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
                                        borderRadius: '12px',
                                        background: 'rgba(255, 100, 200, 0.1)',
                                        color: '#ffb3e0',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        border: '1px solid rgba(255, 100, 200, 0.15)',
                                        backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    📄 {src}
                                </span>
                            ))}
                        </div>


                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
