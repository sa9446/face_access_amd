'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { processAccess } from '@/lib/api';

const Camera = dynamic(() => import('@/components/Camera'), { ssr: false });

export default function AccessPage() {
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'denied'>('idle');
    const [message, setMessage] = useState('');
    const [userData, setUserData] = useState<any>(null);

    const handleCapture = async (descriptor: number[]) => {
        setStatus('processing');
        try {
            const result = await processAccess(descriptor);
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                setUserData(result.user);

                // Reset after 5 seconds
                setTimeout(() => {
                    setStatus('idle');
                    setUserData(null);
                }, 5000);
            } else {
                setStatus('denied');
                setMessage(result.message || 'Access Denied');
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (err) {
            console.error('Access error:', err);
            setStatus('denied');
            setMessage('Server error. Please try again.');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900">Building Access</h1>
                <p className="text-slate-500">Position your face in the frame to enter</p>
            </div>

            <div className="flex flex-col items-center gap-8">
                {status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-xl w-full max-w-md animate-pulse border border-slate-100">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-semibold text-slate-700">Verifying Identity...</p>
                    </div>
                ) : status === 'success' ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-green-50 rounded-3xl shadow-xl border-2 border-green-200 w-full max-w-xl text-center">
                        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg">✓</div>
                        <h2 className="text-4xl font-extrabold text-green-800 mb-2">Welcome to the Future</h2>
                        <p className="text-xl text-green-700 mb-6">{message}</p>

                        {userData && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center gap-2">
                                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Loyalty Rewards</span>
                                <p className="text-2xl font-bold text-slate-800">{userData.name}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl">🏆</span>
                                        <span className="text-xs font-bold text-slate-500">{userData.tier}</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-200"></div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-bold text-blue-600">{userData.loyaltyPoints}</span>
                                        <span className="text-xs font-bold text-slate-500">POINTS</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : status === 'denied' ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-3xl shadow-xl border-2 border-red-200 w-full max-w-md text-center">
                        <div className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg">✕</div>
                        <h2 className="text-3xl font-bold text-red-800 mb-2">Access Denied</h2>
                        <p className="text-lg text-red-700">{message}</p>
                    </div>
                ) : (
                    <Camera onCapture={handleCapture} label="Verify and Enter" />
                )}
            </div>
        </div>
    );
}
