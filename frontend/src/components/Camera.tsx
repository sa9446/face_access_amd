'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface CameraProps {
    onCapture: (descriptor: number[], image: string) => void;
    label?: string;
    streaming?: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, label = 'Capture Face', streaming = true }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);

    useEffect(() => {
        async function loadModels() {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setIsModelLoaded(true);
            } catch (err) {
                console.error('Failed to load models:', err);
                setError('Failed to load AI models.');
            }
        }
        loadModels();
    }, []);

    useEffect(() => {
        if (streaming && isModelLoaded) {
            startVideo();
        } else {
            stopVideo();
        }
        return () => stopVideo();
    }, [streaming, isModelLoaded]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            setError('Camera access denied.');
        }
    };

    const stopVideo = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
    };

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;

        setIsDetecting(true);
        try {
            const video = videoRef.current;
            const detection = await faceapi.detectSingleFace(video)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert('No face detected! Please adjust your position.');
                return;
            }

            // Capture visible frame for UI
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            const image = canvas.toDataURL('image/jpeg');

            onCapture(Array.from(detection.descriptor), image);
        } catch (err) {
            console.error('Detection error:', err);
        } finally {
            setIsDetecting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-md aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                {!isModelLoaded && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-sm font-medium">Initializing AI...</p>
                    </div>
                )}
                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center">
                        <p className="bg-red-500/20 p-4 rounded-xl backdrop-blur-sm">{error}</p>
                    </div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                )}
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
                    <div className="w-full h-full border-2 border-dashed border-white/30 rounded-[100%]"></div>
                </div>
            </div>

            <button
                onClick={handleCapture}
                disabled={!isModelLoaded || isDetecting}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
                {isDetecting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {isDetecting ? 'Analyzing Face...' : label}
            </button>
        </div>
    );
};

export default Camera;
