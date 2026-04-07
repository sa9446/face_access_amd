'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

type Point = { x: number; y: number };

// ── Geometry helpers ──────────────────────────────────────────────────────────

function dist(a: Point, b: Point) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function midpoint(a: Point, b: Point): Point {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function mean(pts: Point[]): Point {
    return {
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
}

// ── EAR (blink) ───────────────────────────────────────────────────────────────

function eyeAspectRatio(pts: Point[]): number {
    const a = dist(pts[1], pts[5]);
    const b = dist(pts[2], pts[4]);
    const c = dist(pts[0], pts[3]);
    return (a + b) / (2 * c);
}

function calcEAR(p: Point[]): number {
    return (eyeAspectRatio(p.slice(36, 42)) + eyeAspectRatio(p.slice(42, 48))) / 2;
}

const EAR_CLOSED = 0.25;

// ── Head yaw (look left / right) ──────────────────────────────────────────────
// Returns nose lateral offset normalised by face width.
// Positive  → nose right of centre in camera space → user looked to THEIR LEFT  (mirrored display)
// Negative  → nose left  of centre                 → user looked to THEIR RIGHT

function calcYaw(p: Point[]): number {
    const leftOuter  = p[36];   // eye outer corners
    const rightOuter = p[45];
    const noseTip    = p[30];
    const cx = (leftOuter.x + rightOuter.x) / 2;
    const fw = dist(leftOuter, rightOuter);
    return (noseTip.x - cx) / fw;
}

// ── Head pitch (nod) ──────────────────────────────────────────────────────────
// Returns (noseTip.y − eyeCenter.y) / faceHeight.
// Increases when nodding down, decreases when tilting back up.

function calcPitch(p: Point[]): number {
    const eyeCenter = mean([p[36], p[39], p[42], p[45]]);
    const chin      = p[8];
    const faceH     = Math.max(1, chin.y - eyeCenter.y);
    return (p[30].y - eyeCenter.y) / faceH;
}

// ── Smile ─────────────────────────────────────────────────────────────────────
// Corners raised relative to lip centre + mouth width/face width ratio.

function calcSmile(p: Point[]): number {
    const lCorner    = p[48];
    const rCorner    = p[54];
    const upperCentre = p[51];
    const lowerCentre = p[57];
    const mouthCy    = (upperCentre.y + lowerCentre.y) / 2;
    const cornerAvgY = (lCorner.y + rCorner.y) / 2;
    const faceW      = dist(p[36], p[45]);
    // Positive when corners are above mouth centre (i.e. smiling)
    return (mouthCy - cornerAvgY) / faceW;
}

// ── Challenges ────────────────────────────────────────────────────────────────

export type ChallengeType = 'blink1' | 'blink2' | 'look_left' | 'look_right' | 'nod' | 'smile';

const CHALLENGE_META: Record<ChallengeType, { emoji: string; label: string }> = {
    blink1:     { emoji: '👁',  label: 'Blink once' },
    blink2:     { emoji: '👁👁', label: 'Blink twice' },
    look_left:  { emoji: '👈',  label: 'Look LEFT' },
    look_right: { emoji: '👉',  label: 'Look RIGHT' },
    nod:        { emoji: '↕',   label: 'Nod your head' },
    smile:      { emoji: '😊',  label: 'Smile!' },
};

const ALL_CHALLENGES: ChallengeType[] = ['blink1', 'blink2', 'look_left', 'look_right', 'nod', 'smile'];

function randomChallenge(): ChallengeType {
    return ALL_CHALLENGES[Math.floor(Math.random() * ALL_CHALLENGES.length)];
}

// Per-challenge mutable state (stored in a ref)
interface ChallengeState {
    // blink tracking
    blinkCount: number;       // complete blinks so far
    eyesOpen:   boolean;      // were eyes open last frame?
    eyesClosed: boolean;      // have eyes been closed this cycle?
    // look tracking
    lookFrames: number;       // consecutive frames in target direction
    // nod tracking
    nodPhase:   0 | 1 | 2;   // 0=waiting, 1=went down, 2=came back up(done)
    pitchBase:  number | null;// baseline pitch
    // smile tracking
    smileFrames: number;
}

function freshState(): ChallengeState {
    return {
        blinkCount: 0, eyesOpen: false, eyesClosed: false,
        lookFrames: 0,
        nodPhase: 0, pitchBase: null,
        smileFrames: 0,
    };
}

// Returns true when challenge is completed
function checkChallenge(type: ChallengeType, p: Point[], s: ChallengeState): boolean {
    const ear   = calcEAR(p);
    const yaw   = calcYaw(p);
    const pitch = calcPitch(p);
    const smile = calcSmile(p);

    switch (type) {
        case 'blink1': {
            if (ear >= EAR_CLOSED) {
                if (s.eyesClosed) { s.blinkCount++; s.eyesClosed = false; }
                s.eyesOpen = true;
            } else if (s.eyesOpen) {
                s.eyesClosed = true;
            }
            return s.blinkCount >= 1;
        }
        case 'blink2': {
            if (ear >= EAR_CLOSED) {
                if (s.eyesClosed) { s.blinkCount++; s.eyesClosed = false; }
                s.eyesOpen = true;
            } else if (s.eyesOpen) {
                s.eyesClosed = true;
            }
            return s.blinkCount >= 2;
        }
        case 'look_left': {
            // yaw > 0.15 → nose right of centre in camera space = user's left (mirrored display)
            s.lookFrames = yaw > 0.15 ? s.lookFrames + 1 : 0;
            return s.lookFrames >= 4;
        }
        case 'look_right': {
            s.lookFrames = yaw < -0.15 ? s.lookFrames + 1 : 0;
            return s.lookFrames >= 4;
        }
        case 'nod': {
            if (s.pitchBase === null) {
                s.pitchBase = pitch;
            }
            const delta = pitch - s.pitchBase;
            if (s.nodPhase === 0 && delta > 0.12)  { s.nodPhase = 1; }
            if (s.nodPhase === 1 && delta < 0.04)   { s.nodPhase = 2; }
            return s.nodPhase === 2;
        }
        case 'smile': {
            s.smileFrames = smile > 0.04 ? s.smileFrames + 1 : 0;
            return s.smileFrames >= 5;
        }
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CameraProps {
    onCapture: (descriptor: number[], image: string) => void;
    label?: string;
    livenessMode?: boolean;
}

type LivenessPhase = 'waiting' | 'face_found' | 'challenge_done' | 'capturing' | 'done';

const Camera: React.FC<CameraProps> = ({ onCapture, label = 'Capture Face', livenessMode = false }) => {
    const videoRef    = useRef<HTMLVideoElement>(null);
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onCaptureRef = useRef(onCapture);
    onCaptureRef.current = onCapture;

    const doneRef      = useRef(false);
    const challengeRef = useRef<ChallengeType>(randomChallenge());
    const stateRef     = useRef<ChallengeState>(freshState());

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [isDetecting, setIsDetecting]   = useState(false);
    const [phase, setPhase]               = useState<LivenessPhase>('waiting');
    const [challenge, setChallenge]       = useState<ChallengeType>(challengeRef.current);
    // Calibration display
    const [debugInfo, setDebugInfo]       = useState('');

    // ── Models ────────────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ]);
                setModelsLoaded(true);
            } catch {
                setError('Failed to load AI models.');
            }
        })();
    }, []);

    // ── Camera ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!modelsLoaded) return;
        let stream: MediaStream;
        navigator.mediaDevices
            .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
            .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
            .catch(() => setError('Camera access denied.'));
        return () => { stream?.getTracks().forEach(t => t.stop()); };
    }, [modelsLoaded]);

    // ── Liveness loop ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!livenessMode || !modelsLoaded) return;

        const doCapture = async (video: HTMLVideoElement) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            setPhase('capturing');
            try {
                const det = await faceapi
                    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                if (!det) { restart(); return; }
                canvas.width  = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                setPhase('done');
                onCaptureRef.current(Array.from(det.descriptor), canvas.toDataURL('image/jpeg'));
            } catch { restart(); }
        };

        const restart = () => {
            doneRef.current    = false;
            challengeRef.current = randomChallenge();
            stateRef.current   = freshState();
            setChallenge(challengeRef.current);
            setPhase('waiting');
            intervalRef.current = setInterval(tick, 150);
        };

        const tick = async () => {
            if (doneRef.current) return;
            const video = videoRef.current;
            if (!video || video.readyState < 2) return;
            try {
                const det = await faceapi
                    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks();

                if (!det) {
                    setPhase('waiting');
                    stateRef.current = freshState();
                    setDebugInfo('');
                    return;
                }

                setPhase('face_found');
                const positions = det.landmarks.positions as unknown as Point[];

                // Debug readout
                if (process.env.NODE_ENV === 'development') {
                    const c = challengeRef.current;
                    if (c === 'blink1' || c === 'blink2')
                        setDebugInfo(`EAR ${calcEAR(positions).toFixed(3)}`);
                    else if (c === 'look_left' || c === 'look_right')
                        setDebugInfo(`Yaw ${calcYaw(positions).toFixed(3)}`);
                    else if (c === 'nod')
                        setDebugInfo(`Pitch ${calcPitch(positions).toFixed(3)}`);
                    else if (c === 'smile')
                        setDebugInfo(`Smile ${calcSmile(positions).toFixed(3)}`);
                }

                const done = checkChallenge(challengeRef.current, positions, stateRef.current);
                if (done) {
                    doneRef.current = true;
                    clearInterval(intervalRef.current!);
                    setPhase('challenge_done');
                    setDebugInfo('');
                    await doCapture(video);
                }
            } catch { /* keep loop alive */ }
        };

        const startLoop = () => { intervalRef.current = setInterval(tick, 150); };
        const video = videoRef.current;
        if (video) {
            if (video.readyState >= 2) startLoop();
            else video.addEventListener('canplay', startLoop, { once: true });
        } else {
            const t = setTimeout(startLoop, 1000);
            return () => clearTimeout(t);
        }

        return () => {
            clearInterval(intervalRef.current!);
            video?.removeEventListener('canplay', startLoop);
        };
    }, [livenessMode, modelsLoaded]);

    // ── Manual capture ────────────────────────────────────────────────────────
    const handleManualCapture = async () => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !modelsLoaded) return;
        setIsDetecting(true);
        try {
            const det = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
            if (!det) { alert('No face detected!'); return; }
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            onCaptureRef.current(Array.from(det.descriptor), canvas.toDataURL('image/jpeg'));
        } catch (e) { console.error(e); }
        finally { setIsDetecting(false); }
    };

    // ── UI helpers ────────────────────────────────────────────────────────────
    const meta = CHALLENGE_META[challenge];

    const outlineColor =
        phase === 'challenge_done' || phase === 'done' ? 'border-green-400' :
        phase === 'face_found'                         ? 'border-blue-400'  :
                                                         'border-white/30';

    const overlay = () => {
        if (!livenessMode) return null;
        if (phase === 'waiting') return (
            <Pill color="black">Position your face in the frame</Pill>
        );
        if (phase === 'face_found') return (
            <Pill color="blue" pulse>
                {meta.emoji}&nbsp; {meta.label}
            </Pill>
        );
        if (phase === 'challenge_done') return (
            <Pill color="green">✓ Done! Capturing...</Pill>
        );
        if (phase === 'capturing') return (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
        return null;
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
            {/* Challenge badge — shown above camera when face is detected */}
            {livenessMode && phase === 'face_found' && (
                <div className="flex items-center gap-3 bg-white border border-blue-100 shadow-md px-5 py-3 rounded-2xl">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Challenge</p>
                        <p className="text-lg font-extrabold text-slate-800">{meta.label}</p>
                    </div>
                </div>
            )}

            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                {!modelsLoaded && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-sm font-medium">Initializing AI...</p>
                    </div>
                )}

                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                        <p className="bg-red-500/20 text-white p-4 rounded-xl backdrop-blur-sm">{error}</p>
                    </div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover -scale-x-100" />
                )}

                <canvas ref={canvasRef} className="hidden" />

                {/* Oval face guide */}
                <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
                    <div className={`w-full h-full border-2 border-dashed rounded-[100%] transition-colors duration-300 ${outlineColor}`} />
                </div>

                {overlay()}

                {/* Dev calibration readout */}
                {process.env.NODE_ENV === 'development' && debugInfo && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-mono">
                        {debugInfo}
                    </div>
                )}
            </div>

            {!livenessMode && (
                <button onClick={handleManualCapture} disabled={!modelsLoaded || isDetecting}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                    {isDetecting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {isDetecting ? 'Analyzing...' : label}
                </button>
            )}

            {livenessMode && phase === 'waiting' && modelsLoaded && (
                <p className="text-sm text-slate-400 text-center">
                    Look into the camera — a random challenge will appear
                </p>
            )}
        </div>
    );
};

// ── Small helper component ────────────────────────────────────────────────────

function Pill({ color, pulse, children }: { color: 'black' | 'blue' | 'green'; pulse?: boolean; children: React.ReactNode }) {
    const bg = color === 'black' ? 'bg-black/70' : color === 'blue' ? 'bg-blue-600/90' : 'bg-green-500/90';
    return (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className={`${bg} text-white text-sm px-5 py-2 rounded-full backdrop-blur-sm font-semibold ${pulse ? 'animate-pulse' : ''}`}>
                {children}
            </div>
        </div>
    );
}

export default Camera;
