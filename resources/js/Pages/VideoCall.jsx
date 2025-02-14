import React, { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const VideoCall = ({ authUserId, classStarted, message }) => {
    const [isClassStarted, setIsClassStarted] = useState(classStarted || false);
    const [statusMessage, setStatusMessage] = useState(message || '');
    const videoRef = useRef(null);

    const handleStartClass = async () => {
        try {
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;

            console.log("CSRF Token:", csrfToken); // Debug log

            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch('/start-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to start class');
            }

            const data = await response.json();

            setIsClassStarted(true);
            setStatusMessage(data.message);

            startCamera(); // Start the camera after starting the class
        } catch (error) {
            console.error('Error starting the class:', error);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing the camera:', error);
        }
    };

    return (
        <AuthenticatedLayout>
            <div>
                <h1>Video Call</h1>
                {!isClassStarted ? (
                    <div>
                        <button onClick={handleStartClass}>Start Class</button>
                    </div>
                ) : (
                    <div>
                        <p>{statusMessage}</p>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '600px', border: '1px solid black' }}></video>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default VideoCall;
