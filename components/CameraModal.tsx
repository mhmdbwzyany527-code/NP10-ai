
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon, CameraSwitchIcon, RefreshCwIcon, CheckIcon } from './Icons';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
    const [isFlashing, setIsFlashing] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (!isOpen) {
            stopStream();
            return;
        }

        let isCancelled = false;

        const startStream = async () => {
            stopStream(); // Always stop previous stream
            setError(null);
            setCapturedImage(null);

            const constraints: MediaStreamConstraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            };

            if (activeDeviceId) {
                (constraints.video as MediaTrackConstraints).deviceId = { exact: activeDeviceId };
            } else {
                (constraints.video as MediaTrackConstraints).facingMode = 'user';
            }

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                if (isCancelled) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);
                
                if (!activeDeviceId && videoDevices.length > 0) {
                    const currentDeviceId = mediaStream.getVideoTracks()[0]?.getSettings().deviceId;
                    setActiveDeviceId(currentDeviceId || videoDevices[0].deviceId);
                }

            } catch (err) {
                if (isCancelled) return;
                console.error("Error accessing camera:", err);
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setError('Camera permission denied. Please enable it in your browser settings.');
                    } else if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError' || err.name === 'NotReadableError') {
                        setError('Could not access the camera. It might be in use by another app or not connected properly.');
                    } else {
                        setError(`Could not start video source. Error: ${err.name}`);
                    }
                } else {
                    setError('An unknown error occurred while accessing the camera.');
                }
            }
        };

        startStream();

        return () => {
            isCancelled = true;
            stopStream();
        };
    }, [isOpen, activeDeviceId, retryCount, stopStream]);


    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                const isFrontFacing = stream?.getVideoTracks()[0]?.getSettings().facingMode === 'user';
                // Flip the image horizontally for front-facing camera
                if (isFrontFacing) {
                    context.translate(video.videoWidth, 0);
                    context.scale(-1, 1);
                }
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 300);

                setCapturedImage(dataUrl);
                stopStream();
            }
        }
    };
    
    const handleRetake = () => {
        setCapturedImage(null);
        setRetryCount(c => c + 1); // Trigger the useEffect to restart the stream
    };

    const handleUsePhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };
    
    const handleSwitchCamera = () => {
        if (devices.length > 1) {
            const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
            const nextIndex = (currentIndex + 1) % devices.length;
            setActiveDeviceId(devices[nextIndex].deviceId);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl aspect-[9/16] sm:aspect-video overflow-hidden relative border border-slate-700 m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 z-30 transition-colors" aria-label="Close camera">
                    <XIcon />
                </button>
                
                {/* Camera View or Captured Image */}
                <div className="flex-1 w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
                    {isFlashing && <div className="absolute inset-0 bg-white animate-shutter z-10"></div>}
                    {error && (
                        <div className="text-center text-red-400 p-4">
                            <h3 className="font-bold text-lg">Camera Error</h3>
                            <p className="text-sm">{error}</p>
                            <button onClick={() => setRetryCount(c => c + 1)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors">
                                <RefreshCwIcon />
                                Try Again
                            </button>
                        </div>
                    )}
                    {!error && (
                        <>
                             <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`w-full h-full object-cover transform-gpu transition-opacity duration-300 ${stream?.getVideoTracks()[0]?.getSettings().facingMode === 'user' ? '-scale-x-100' : ''} ${capturedImage ? 'opacity-0' : 'opacity-100'}`}
                            />
                            {capturedImage && (
                                <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
                            )}
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center z-20">
                    {!capturedImage ? (
                        <div className="flex items-center w-full justify-between">
                             <div className="w-16 h-16 flex items-center justify-center">
                                {devices.length > 1 && (
                                    <button onClick={handleSwitchCamera} className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors" aria-label="Switch camera">
                                        <CameraSwitchIcon />
                                    </button>
                                )}
                            </div>
                            <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white/90 p-1.5 flex items-center justify-center ring-4 ring-white/30 hover:bg-white transition" aria-label="Take picture">
                                <div className="w-full h-full rounded-full bg-white ring-2 ring-slate-900"></div>
                            </button>
                           <div className="w-16 h-16"> {/* Spacer */} </div>
                        </div>
                    ) : (
                        <div className="flex items-center w-full justify-around">
                            <button onClick={handleRetake} className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors" aria-label="Retake picture">
                                <RefreshCwIcon />
                                Retake
                            </button>
                            <button onClick={handleUsePhoto} className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors ring-2 ring-white/50" aria-label="Use this photo">
                                <CheckIcon />
                                Use Photo
                            </button>
                        </div>
                    )}
                </div>
            </div>
             <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraModal;