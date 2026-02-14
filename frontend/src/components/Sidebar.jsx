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
            style={{
                width: '250px',
                background: 'rgba(15, 15, 30, 0.6)',
                backdropFilter: 'blur(24px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Logo */}
            <div className="px-6 pt-6 pb-5">
                <div className="flex items-center">

                    <div>
                        <h1 className="text-white font-semibold leading-tight" style={{ fontSize: '15px' }}>
                            Agentic RAG
                        </h1>
                        <p className="font-medium uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)' }}>
                            Assistant
                        </p>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div style={{ margin: '0 20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

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
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                marginBottom: '4px',
                                transition: 'all 0.3s ease',
                                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                                background: isActive
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'transparent',
                                backdropFilter: isActive ? 'blur(12px)' : 'none',
                                boxShadow: isActive
                                    ? '0 2px 12px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)'
                                    : 'none',
                            }}
                        >
                            <Icon style={{ width: '20px', height: '20px', color: isActive ? '#a5b4fc' : 'inherit' }} />
                            <span>{item.label}</span>
                            {isActive && (
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#818cf8',
                                        boxShadow: '0 0 8px rgba(129,140,248,0.5)',
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom section */}

        </aside>
    );
}
