import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineChatBubbleLeftRight,
    HiOutlineClock,
    HiOutlineCog6Tooth,
} from 'react-icons/hi2';

const navItems = [
    { id: 'chat', label: 'Chat', icon: HiOutlineChatBubbleLeftRight },
    { id: 'history', label: 'History', icon: HiOutlineClock },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog6Tooth },
];

export default function Sidebar({ activeTab, onTabChange }) {
    return (
        <aside
            className="fixed left-0 top-0 bottom-0 flex flex-col z-50"
            style={{ width: '250px', background: '#0f0f1a' }}
        >
            {/* Logo */}
            <div className="px-5 pt-6 pb-5">
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center text-white font-bold text-sm"
                        style={{
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}
                    >
                        AI
                    </div>
                    <div>
                        <h1 className="text-white font-semibold leading-tight" style={{ fontSize: '15px' }}>
                            Agentic RAG
                        </h1>
                        <p className="text-gray-500 font-medium uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                            Assistant
                        </p>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div style={{ margin: '0 20px', height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            {/* Navigation */}
            <nav className="flex-1" style={{ padding: '12px' }}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                border: 'none',
                                marginBottom: '4px',
                                transition: 'all 0.2s',
                                color: isActive ? '#ffffff' : '#9ca3af',
                                background: isActive
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))'
                                    : 'transparent',
                                boxShadow: isActive ? 'inset 0 0 0 1px rgba(99,102,241,0.25)' : 'none',
                            }}
                        >
                            <Icon style={{ width: '20px', height: '20px', color: isActive ? '#818cf8' : 'inherit' }} />
                            <span>{item.label}</span>
                            {isActive && (
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#818cf8',
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div style={{ padding: '0 20px 24px' }}>
                <div
                    style={{
                        borderRadius: '12px',
                        padding: '14px 16px',
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.15)',
                    }}
                >
                    <p style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        RAG System v1.0
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '11px', lineHeight: '1.5' }}>
                        Upload documents & ask questions powered by AI.
                    </p>
                </div>
            </div>
        </aside>
    );
}
