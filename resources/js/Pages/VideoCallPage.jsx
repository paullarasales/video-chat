import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const VideoCallPage = ({ message, user }) => {
    return (
        <AuthenticatedLayout>
            <div>
                <h1>{message}</h1>
                <p>User: {user.name}</p>
                {/* You can add more UI here to display the video call information */}
            </div>
        </AuthenticatedLayout>
    );
};

export default VideoCallPage;
