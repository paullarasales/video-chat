import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';  // Import Peerjs for WebRTC
import { Inertia } from '@inertiajs/inertia';

const VideoCall = ({ users }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [isReceivingCall, setIsReceivingCall] = useState(false);
    const [peer, setPeer] = useState(null);
    const [myStream, setMyStream] = useState(null);

    const myVideo = useRef(null);
    const theirVideo = useRef(null);

    useEffect(() => {
        const peerInstance = new Peer();
        setPeer(peerInstance);

        peerInstance.on('open', (id) => {
            console.log("My peer ID is " + id);
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setMyStream(stream);
                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }
            }).catch((err) => console.error("Failed to get media stream:", err));

        peerInstance.on('call', (incomingCall) => {
            setIsReceivingCall(true);
            incomingCall.answer(myStream);
            incomingCall.on('stream', (remoteStream) => {
                if (theirVideo.current) {
                    theirVideo.current.srcObject = remoteStream;
                }
            });
        });

        return () => {
            if (peerInstance) peerInstance.destroy();
        };
    }, []);

    const startCall = (user) => {
        setIsCalling(true);
        const call = peer.call(user.peerId, myStream);
        call.on('stream', (remoteStream) => {
            if (theirVideo.current) {
                theirVideo.current.srcObject = remoteStream;
            }
        });

        // Post the data to Laravel (Ensure the route is correct)
        Inertia.post(route('video-call.request', { user: user.id }), {
            peerId: peer.id,
        });
    };

    return (
        <div>
            <video ref={myVideo} autoPlay muted />
            <video ref={theirVideo} autoPlay />
            <div>
                <h3>Contacts</h3>
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>
                            {user.name}
                            <button onClick={() => startCall(user)}>Call</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default VideoCall;
