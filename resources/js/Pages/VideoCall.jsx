import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

const VideoCall = ({ authUserId }) => {
    const [peer, setPeer] = useState(null);
    const [isClassStarted, setIsClassStarted] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [remotePeerId, setRemotePeerId] = useState(null);
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        const newPeer = new Peer(); // Initialize PeerJS
        setPeer(newPeer);

        // When this user receives a call, answer with their own stream
        newPeer.on("call", (call) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
                call.answer(stream); // Answer with local stream
                call.on("stream", (remoteStream) => {
                    remoteVideoRef.current.srcObject = remoteStream;
                });
            });
        });

        // Destroy Peer instance when component unmounts
        return () => newPeer.destroy();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = stream;
            return stream;
        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    };

    const handleStartClass = async () => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
            const response = await fetch("/start-call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });

            if (!response.ok) throw new Error("Failed to start class");

            const data = await response.json();
            setIsClassStarted(true);
            setStatusMessage(data.message);

            const stream = await startCamera();

            // Store peer ID in the database so participants can connect
            peer.on("open", (id) => {
                fetch("/set-peer-id", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    body: JSON.stringify({ user_id: authUserId, peerId: id }),
                });
            });
        } catch (error) {
            console.error("Error starting the class:", error);
        }
    };

    const handleJoinClass = async (userId) => {
        try {
            const response = await fetch("/join-call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) throw new Error("Failed to join class");

            const data = await response.json();
            console.log("Joined class:", data);

            setRemotePeerId(data.hostPeerId);

            const stream = await startCamera();

            if (data.hostPeerId) {
                const call = peer.call(data.hostPeerId, stream);
                call.on("stream", (remoteStream) => {
                    remoteVideoRef.current.srcObject = remoteStream;
                });
            }
        } catch (error) {
            console.error("Error joining the class:", error);
        }
    };

    return (
        <div>
            <h2>Video Call</h2>
            {isClassStarted ? (
                <p>{statusMessage}</p>
            ) : (
                <button onClick={handleStartClass}>Start Class</button>
            )}

            <button onClick={() => handleJoinClass(authUserId)}>Join Class</button>

            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                <div>
                    <h3>Your Camera</h3>
                    <video ref={videoRef} autoPlay playsInline style={{ width: "300px", border: "1px solid black" }}></video>
                </div>

                <div>
                    <h3>Host's Camera</h3>
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px", border: "1px solid red" }}></video>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
