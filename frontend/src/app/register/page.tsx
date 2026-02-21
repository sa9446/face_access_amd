'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { registerUser } from '@/lib/api';

const Camera = dynamic(() => import('@/components/Camera'), { ssr: false });

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [descriptor, setDescriptor] = useState<number[] | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleCapture = (capturedDescriptor: number[], capturedImage: string) => {
        setDescriptor(capturedDescriptor);
        setImagePreview(capturedImage);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!descriptor) {
            setError('Please capture your photo first');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await registerUser({ ...formData, descriptor });
            if (result.success) {
                setSuccess(true);
                setTimeout(() => router.push('/access'), 3000);
            } else {
                setError(result.error || 'Registration failed');
            }
        } catch (err) {
            setError('Connection error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg animate-bounce">✓</div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4">You're All Set!</h1>
                <p className="text-xl text-slate-600 mb-8">
                    Registration successful. Redirecting you to the access point...
                </p>
                <div className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl">
                    Welcome to the Future
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900">Join FaceAccess</h1>
                <p className="text-slate-500">Register once, enter anywhere with just your face</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-6 text-slate-800">1. Personal Details</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !descriptor}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold mb-6 text-slate-800 self-start">2. Face Enrollment</h2>
                    {imagePreview ? (
                        <div className="relative group overflow-hidden rounded-3xl shadow-2xl border-4 border-white aspect-video bg-slate-100">
                            <img src={imagePreview} className="w-full h-full object-cover -scale-x-100" alt="Captured" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => setImagePreview(null)}
                                    className="px-6 py-2 bg-white text-slate-900 font-bold rounded-full"
                                >
                                    Retake Photo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Camera onCapture={handleCapture} label="Snap My Face" />
                    )}
                    <p className="mt-4 text-sm text-slate-400 text-center max-w-[280px]">
                        {descriptor ? 'Face data secure.' : 'Make sure your face is clearly visible and well-lit.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
