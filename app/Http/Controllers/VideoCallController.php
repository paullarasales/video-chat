<?php

namespace App\Http\Controllers;

use App\Events\RequestVideoCall;
use App\Events\VideoCallEvent;
use App\Events\VideoCallStarted;
use App\Events\ClassStartedEvent;
use App\Events\RequestVideoCallStatus;
use App\Models\VideoCall;
use App\Models\VideoCallParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VideoCallController extends Controller
{
    public function index()
    {
        return Inertia::render('VideoCall', [
            'authUserId' => auth()->user()->id,
        ]);
    }

    public function startClass(Request $request)
    {   
       $request->validate([
            'host_peer_id' => 'required|string',
       ]);

       $userId = auth()->user()->id;

       $existingClass = VideoCall::where('host_id', $userId)->where('status', 'ongoing')->first();

       if ($existingClass) {
            return response()->json([
                'message' => 'Class is already ongoing',
                'classStarted' => true,
                'hostPeerId' => $existingClass->host_peer_id,
                'roomId' => $existingClass->room_id,
            ]);
       }

       $roomId = uniqid();
       $class = VideoCall::create([
            'host_id' => $userId,
            'host_peer_id' => $request->host_peer_id,
            'room_id' => $roomId,
            'status' => 'ongoing',
       ]);

       return response()->json([
            'message' => 'Class has started successfully',
            'classStarted' => true,
            'hostPeerId' => $class->host_peer_id,
            'roomId' => $class->room_id,
       ]);
    }

    public function joinCall(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $ongoingClass = VideoCall::where('status', 'ongoing')->first();

        if (!$ongoingClass) {
            return response()->json(['message' => 'No ongoing class to join'], 400);
        }

        VideoCallParticipant::create([
            'video_call_id' => $ongoingClass->id,
            'user_id' => $request->user_id,
        ]);

        return response()->json([
            'message' => 'You have joined the class!',
            'hostPeerId' => $ongoingClass->host_peer_id,
        ]);
    }

    public function endCall(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:video_calls,room_id',
        ]);

        $call = VideoCall::where('room_id', $request->room_id)->first();

        if ($call) {
            $call->update(['status' => 'ended']);
            return response()->json(['message' => 'Call ended successfully']);
        }

        return response()->json(['message' => 'Call not found'], 404);
    }

    public function getClassStatus()
    {
        $ongoingClass = VideoCall::where('status', 'ongoing')->exists();

        return response()->json([
            'classStarted' => $ongoingClass,
            'message' => $ongoingClass ? 'An ongoing class is available. Join now!' : 'No class is ongoing.',
        ]);
    }
}
