import React, { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import axios from "axios";

const VideoCall = () => {
    const [isClassStarted, setIsClassStarted] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomId, setRoomId] = useState(null);
    const [peer, setPeer] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [statusMessage, setStatusMessage] = useState("");

    const videoRef = useRef(null); // Host's video
    const remoteVideoRefs = useRef([]); // Participants' videos

    useEffect(() => {
        const newPeer = new Peer();
        setPeer(newPeer);

        newPeer.on("open", (id) => {
            console.log("Peer connected with ID:", id);
        });

        // Handle incoming calls (from participants)
        newPeer.on("call", (call) => {
            console.log("Incoming call from:", call.peer);
            // Get user media and answer the call
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    // Set local stream for the host
                    videoRef.current.srcObject = stream;

                    // Answer the incoming call with the local stream
                    call.answer(stream);

                    // When the remote participant stream is received, add it to the participants list
                    call.on("stream", (remoteStream) => {
                        const newParticipants = [
                            ...participants,
                            { peerId: call.peer, stream: remoteStream },
                        ];
                        setParticipants(newParticipants);
                    });
                })
                .catch((error) => {
                    console.error("Error accessing media:", error);
                    setStatusMessage("Error accessing media.");
                });
        });

        return () => {
            newPeer.destroy();
        };
    }, [participants]);

    const handleStartClass = async () => {
        try {
            if (!peer) return;
            setIsHost(true);
            setStatusMessage("Starting class...");

            // Get the media stream for the host when starting the class
            const stream = await getMediaStream();

            if (stream) {
                videoRef.current.srcObject = stream; // Set the host's video

                const response = await axios.post("/start-class", {
                    host_peer_id: peer.id,
                });

                setIsClassStarted(true);
                setRoomId(response.data.roomId);
                setStatusMessage("Class started successfully!");

                // Call each participant when the class starts (but not the host)
                participants.forEach((participant) => {
                    if (participant.peerId !== peer.id) {  // Avoid calling the host
                        const call = peer.call(participant.peerId, stream);
                        call.on("stream", (remoteStream) => {
                            setParticipants((prevParticipants) => [
                                ...prevParticipants,
                                { peerId: participant.peerId, stream: remoteStream },
                            ]);
                        });
                    }
                });
            }
        } catch (error) {
            console.error("Error starting class:", error);
            setStatusMessage("Failed to start class.");
        }
    };

    const handleJoinClass = async () => {
        try {
            if (!peer) return;
            setStatusMessage("Joining class...");

            const response = await axios.get(`/api/class-status?room_id=${roomId}`);
            const { hostPeerId } = response.data;

            setIsClassStarted(true);
            setStatusMessage("Joined class successfully!");

            const stream = await getMediaStream();

            if (stream) {
                videoRef.current.srcObject = stream;

                // Add the local participant to the participants list
                const newParticipants = [{ peerId: peer.id, stream }];
                setParticipants(newParticipants);

                // Call the host with the participant's stream
                const call = peer.call(hostPeerId, stream);
                call.on("stream", (remoteStream) => {
                    const updatedParticipants = [
                        ...participants,
                        { peerId: hostPeerId, stream: remoteStream },
                    ];
                    setParticipants(updatedParticipants);
                });
            }
        } catch (error) {
            console.error("Error joining class:", error);
            setStatusMessage("Failed to join class.");
        }
    };

    const handleLeaveClass = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        }

        setIsClassStarted(false);
        setRoomId(null);
        setIsHost(false);
        setStatusMessage("");

        setParticipants([]);
        if (peer) {
            peer.destroy();
        }
    };

    const handleEndClass = async () => {
        try {
            setStatusMessage("Ending class...");

            await axios.post("/end-class", { room_id: roomId });

            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            }

            setIsClassStarted(false);
            setRoomId(null);
            setIsHost(false);
            setStatusMessage("Class ended successfully!");

            peer.destroy();
        } catch (error) {
            console.error("Error ending the call.");
            setStatusMessage("Failed to end class.");
        }
    };

    // Function to handle media stream retrieval
    const getMediaStream = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia is not supported in this browser.");
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            return stream;
        } catch (error) {
            console.error("Error accessing user media:", error);
            setStatusMessage("Error accessing user media.");
            return null;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold mb-4">Virtual Classroom</h1>
            <p className="text-gray-700">{statusMessage}</p>

            {!isClassStarted ? (
                <div className="mt-4 flex space-x-4">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleStartClass}
                    >
                        Start Class
                    </button>
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleJoinClass}
                    >
                        Join Class
                    </button>
                </div>
            ) : (
                <div className="mt-4 flex space-x-4">
                    <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleLeaveClass}
                    >
                        Leave Class
                    </button>
                    {isHost && (
                        <button
                            className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded"
                            onClick={handleEndClass}
                        >
                            End Class
                        </button>
                    )}
                </div>
            )}

            {/* Host's Video */}
            <div className="flex flex-col items-center mt-8">
                <h2 className="text-xl font-semibold">Host's Video</h2>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-80 h-60 mt-2 border border-gray-300 rounded-lg"
                ></video>
            </div>

            {/* Participants' Video Grid */}
            <div className="grid grid-cols-3 gap-4 mt-8">
                {participants
                    .filter((participant) => participant.peerId !== peer.id) // Filter out the host
                    .map((participant, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">
                                {participant.peerId === peer.id ? "Your Camera" : "Participant"}
                            </h3>
                            <video
                                autoPlay
                                ref={(el) => {
                                    if (el) el.srcObject = participant.stream;
                                }}
                                className="w-full h-40 rounded-lg mt-2 border border-gray-300"
                            ></video>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default VideoCall;
