import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePaperAirplane, HiOutlinePlusCircle, HiOutlineCheckCircle, HiOutlineDocumentText } from 'react-icons/hi2';

export default function InputBar({ onSend, onUpload, loading }) {
    const [text, setText] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim() || loading) return;
        onSend(text.trim());
        setText('');
    };

    const handleFileClick = () => {
        fileRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadedFile(null);

        try {
            await onUpload(file);
            setUploadedFile(file.name);
            // Clear success message after 4 seconds
            setTimeout(() => setUploadedFile(null), 4000);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div style={{ padding: '0 24px 4px', background: '#1a1a2e' }}>
            {/* Upload status toast */}
            <AnimatePresence>
                {(uploading || uploadedFile) && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        style={{
                            maxWidth: '680px',
                            margin: '0 auto 8px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            ...(uploadedFile
                                ? {
                                    background: 'rgba(16,185,129,0.12)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    color: '#34d399',
                                }
                                : {
                                    background: 'rgba(99,102,241,0.12)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    color: '#a5b4fc',
                                }),
                        }}
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31 31" />
                                </svg>
                                Uploading file...
                            </>
                        ) : (
                            <>
                                <HiOutlineCheckCircle style={{ width: '16px', height: '16px' }} />
                                <span style={{ fontWeight: 500 }}>{uploadedFile}</span> uploaded successfully
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.csv,.json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0',
                    maxWidth: '680px',
                    margin: '0 auto',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '28px',
                    padding: '4px 6px 4px 6px',
                    transition: 'all 0.2s',
                }}
            >
                {/* Plus icon — triggers file upload */}
                <motion.button
                    type="button"
                    onClick={handleFileClick}
                    disabled={uploading}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    title="Upload a document (PDF, DOCX, TXT)"
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px 8px 10px 12px',
                        cursor: 'pointer',
                        color: uploading ? '#818cf8' : 'rgba(255,255,255,0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s',
                    }}
                >
                    {uploading ? (
                        <svg className="animate-spin" style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="31 31" />
                        </svg>
                    ) : (
                        <HiOutlinePlusCircle style={{ width: '22px', height: '22px' }} />
                    )}
                </motion.button>

                {/* Input */}
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ask anything"
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '12px 8px',
                        fontSize: '15px',
                        color: 'rgba(255,255,255,0.9)',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        opacity: loading ? 0.5 : 1,
                    }}
                />

                {/* Send button */}
                <motion.button
                    type="submit"
                    disabled={!text.trim() || loading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                        width: '40px',
                        height: '40px',
                        minWidth: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        background: text.trim() ? '#fff' : 'rgba(255,255,255,0.12)',
                        transition: 'all 0.2s',
                    }}
                >
                    {loading ? (
                        <svg className="animate-spin" style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                                fill="none" strokeDasharray="31 31" />
                        </svg>
                    ) : (
                        <HiOutlinePaperAirplane style={{
                            width: '18px',
                            height: '18px',
                            color: text.trim() ? '#1a1a2e' : 'rgba(255,255,255,0.4)',
                        }} />
                    )}
                </motion.button>
            </form>
        </div>
    );
}
