import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCloudArrowUp,
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineXMark,
} from 'react-icons/hi2';

export default function UploadBox({ onUpload }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const onDrop = useCallback((acceptedFiles) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
        },
        multiple: true,
    });

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        try {
            for (const file of files) {
                await onUpload(file);
                setUploadedFiles((prev) => [...prev, file.name]);
            }
            setFiles([]);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Drop zone */}
            <motion.div
                {...getRootProps()}
                whileHover={{ scale: 1.005 }}
                className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                    }
        `}
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
                <input {...getInputProps()} />
                <motion.div
                    animate={isDragActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <HiOutlineCloudArrowUp className="w-12 h-12 mx-auto mb-3 text-indigo-400" />
                </motion.div>
                <p className="text-gray-700 font-medium text-[15px]">
                    {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                    or <span className="text-indigo-500 font-medium">click to browse</span>
                </p>
                <p className="text-gray-300 text-xs mt-3">
                    Supported: PDF, DOCX, TXT
                </p>
            </motion.div>

            {/* Pending files */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {files.map((file, i) => (
                            <motion.div
                                key={file.name + i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100"
                                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                            >
                                <HiOutlineDocumentText className="w-5 h-5 text-indigo-500 shrink-0" />
                                <span className="text-sm text-gray-700 font-medium truncate flex-1">
                                    {file.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {(file.size / 1024).toFixed(0)} KB
                                </span>
                                <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                                    <HiOutlineXMark className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full py-3 rounded-xl text-white font-semibold text-sm
                         disabled:opacity-60 cursor-pointer transition-all"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31 31" />
                                    </svg>
                                    Uploading...
                                </span>
                            ) : (
                                `Upload ${files.length} file${files.length > 1 ? 's' : ''}`
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Uploaded files */}
            <AnimatePresence>
                {uploadedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                    >
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                            Uploaded
                        </p>
                        {uploadedFiles.map((name, i) => (
                            <motion.div
                                key={name + i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100"
                            >
                                <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span className="text-sm text-emerald-700 font-medium truncate">{name}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
