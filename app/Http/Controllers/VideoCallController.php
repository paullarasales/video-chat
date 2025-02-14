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

    public function requestVideoCall(Request $request, User $user)
    {
        $user->peerId = $request->peerId;
        $user->fromUser = Auth::user();

        broadcast(new RequestVideoCall($user));

        return response()->json($user);
    }

    public function requestVideoCallStatus(Request $request, User $user)
    {
        $user->peerId = $request->peerId;
        $user->fromUser = Auth::user();

        broadcast(new RequestVideoCallStatus($user));
        return response()->json($user);
    }

    public function startCall(Request $request)
    {
        broadcast(new VideoCallStarted(Auth::user()));
        return response()->json(['message' => 'Call started']);
    }

    public function joinCall(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:video_calls,room_id',
            'user_id' => 'required|exists:users,id',
        ]);

        VideoCallParticipant::create([
            'video_call_id' => VideoCall::where('room_id', $request->room_id)->first()->id,
            'user_id' => $request->user_id,
        ]);

        broadcast(new VideoCallEvent($request->room_id, $request->user()));

        return response()->json([
            'message' => 'Joined call',
            'room_id' => $request->room_id,
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
            broadcast(new VideoCallEvent($request->room_id, $request->user()));

            return response()->json(['message' => 'Call ended']);
        }

        return response()->json(['message' => 'Call not found'], 404);
    }

    public function startClass(Request $request)
    {
        $userId = auth()->user()->id;

        $class = VideoCall::create([
            'host_id' => $userId,
            'room_id' => uniqid(),
            'status' => 'ongoing',
        ]);

        broadcast(new ClassStartedEvent($userId));

        return response()->json([
            'message' => 'Class has started successfully',
            'classStarted' => true,
        ]);
    }

    public function getClassStatus()
    {
        $ongoingClass = VideoCall::where('status', 'ongoing')->exists();

        return response()->json([
            'classStarted' => $ongoinClass,
            'message' => $ongoingClass ? 'An ongoing class is available. Join now!' : 'No class is ongoing.',
        ]);
    }
}
