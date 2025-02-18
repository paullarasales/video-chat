import React, { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import axios from "axios";

const VideoCall = () => {
    const [isClassStarted, setIsClassStarted] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [remotePeerId, setRemotePeerId] = useState(null);
    const [peer, setPeer] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");

    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        const newPeer = new Peer();
        setPeer(newPeer);

        newPeer.on("open", (id) => {
            console.log("Peer connected with ID:", id);
        });

        newPeer.on("call", (call) => {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    videoRef.current.srcObject = stream;
                    call.answer(stream);
                    call.on("stream", (remoteStream) => {
                        remoteVideoRef.current.srcObject = remoteStream;
                    });
                })
                .catch((error) => console.error("Error accessing media:", error));
        });

        return () => newPeer.destroy();
    }, []);

    const handleStartClass = async () => {
        try {
            if (!peer) return;
            setIsHost(true);
            setStatusMessage("Starting class...");

            const response = await axios.post("/start-class", {
                room_id: "your-room-id", // Replace with actual room ID logic
                host_peer_id: peer.id,
            });

            setIsClassStarted(response.data.classStarted);
            setRoomId(response.data.roomId);
            setStatusMessage("Class started successfully!");

        } catch (error) {
            console.error("Error starting class:", error);
            setStatusMessage("Failed to start class.");
        }
    };

    const handleJoinClass = async () => {
        try {
            if (!peer) return;
            setStatusMessage("Joining class...");

            const response = await axios.get(`/api/class-status?room_id=your-room-id`);
            const { hostPeerId, roomId } = response.data;

            setRemotePeerId(hostPeerId);
            setRoomId(roomId);
            setIsClassStarted(true);
            setStatusMessage("Joined class successfully!");

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = stream;

            const call = peer.call(hostPeerId, stream);
            call.on("stream", (remoteStream) => {
                remoteVideoRef.current.srcObject = remoteStream;
            });

        } catch (error) {
            console.error("Error joining class:", error);
            setStatusMessage("Failed to join class.");
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
            setIsHost(false);
            setStatusMessage("");

            peer.destroy();
        } catch (error) {
            console.error("Error leaving the call.");
        }
    };

    const handleEndCall = async () => {
        try {
            setStatusMessage("Ending class...");

            await axios.post("/end-class", { room_id: roomId });

            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }

            setIsClassStarted(false);
            setRemotePeerId(null);
            setRoomId(null);
            setIsHost(false);
            setStatusMessage("Class ended successfully!");

            peer.destroy();
        } catch (error) {
            console.error("Error ending the call.");
            setStatusMessage("Failed to end class.");
        }
    };

    return (
        <div>
            <h1>Video Call</h1>
            <p>{statusMessage}</p>

            {!isClassStarted && (
                <button onClick={handleStartClass}>Start Class</button>
            )}
            {!isClassStarted && (
                <button onClick={handleJoinClass}>Join Class</button>
            )}

            {isClassStarted && (
                <button onClick={handleLeaveCall}>Leave Call</button>
            )}
            {isHost && isClassStarted && (
                <button onClick={handleEndCall}>End Class</button>
            )}

            <div>
                <h2>Your Video</h2>
                <video ref={videoRef} autoPlay muted></video>
            </div>

            <div>
                <h2>Remote Video</h2>
                <video ref={remoteVideoRef} autoPlay></video>
            </div>
        </div>
    );
};

export default VideoCall;
