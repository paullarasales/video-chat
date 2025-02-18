import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

const VideoCall = ({ authUserId }) => {
    const [peer, setPeer] = useState(null);
    const [isClassStarted, setIsClassStarted] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [remotePeerId, setRemotePeerId] = useState(null);
    const [isHost, setIsHost] = useState(false); // New state to track if the user is the host
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

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
            peer.on("open", async (id) => {
                console.log("Host Peer ID:", id);

                const response = await fetch("/start-class", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    body: JSON.stringify({ host_peer_id: id }),
                });

                if (!response.ok) throw new Error("Failed to start class");

                const data = await response.json();
                setIsClassStarted(true);
                setStatusMessage(data.message);

                // Start the host's camera
                const stream = await startCamera();
                videoRef.current.srcObject = stream;
                setIsHost(true);

                // Host starts calling participants (if any)
                if (data.participantPeerIds) {
                    data.participantPeerIds.forEach((participantPeerId) => {
                        const call = peer.call(participantPeerId, stream);
                        call.on("stream", (remoteStream) => {
                            remoteVideoRef.current.srcObject = remoteStream;
                        });
                    });
                }
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

            setRemotePeerId(data.hostPeerId); // Set the host's peer ID

            const stream = await startCamera();

            // When the participant joins, they call the host's peer ID
            if (data.hostPeerId) {
                const call = peer.call(data.hostPeerId, stream); // Participant calls the host
                call.on("stream", (remoteStream) => {
                    remoteVideoRef.current.srcObject = remoteStream; // Assign the host's stream to the participant's video
                });
            }
        } catch (error) {
            console.error("Error joining the class:", error);
        }
    };

    const handleEndCall = async () => {
        try {
            if (!roomId) return;

            const response = await fetch("/end-call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ room_id: roomId }),
            });

            if (!response.ok) throw new Error("Failed to end call");

            console.log("Call ended successfully");

            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (remoteVideoRef.current?.srcObject) {
                remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }

            setIsClassStarted(false);
            setStatusMessage("Class has ended.");
            setRemotePeerId(null);
            setIsHost(false);
            setRoomId(null);

            peer.destroy();
        } catch (error) {
            console.error("Error ending the call:", error);
        }
    };

    const handleLeaveCall = () => {
        try {
            console.log("Leaving call...");

            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }

            setIsClassStarted(false);
            setRemotePeerId(null);
            setRoomId(null);

            peer.destroy();
        } catch (error) {
            console.error("Error leaving the call.");
        }
    }

    return (
        <div>
            <h2>Video Call</h2>
            {isClassStarted ? (
                <p>{statusMessage}</p>
            ) : (
                <button onClick={handleStartClass}>Start Class</button>
            )}

            <button onClick={() => handleJoinClass(authUserId)}>Join Class</button>

            {isHost ? (
                <button onClick={handleEndCall} className="bg-red-400 text-white rounded-md">
                    End Call
                </button>
            ) : (
                <button onClick={handleLeaveCall} className="bg-blue-400 text-white rounded-md">
                    Leave Call
                </button>
            )}

            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                <div>
                    <h3>{isHost ? "Host's Camera" : "Your Camera"}</h3>
                    <video ref={videoRef} autoPlay playsInline style={{ width: "300px", border: "1px solid black" }}></video>
                </div>

                <div>
                    <h3>{isHost ? "Participant's Camera" : "Host's Camera"}</h3>
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px", border: "1px solid red" }}></video>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
