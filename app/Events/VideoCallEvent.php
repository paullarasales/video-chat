<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class VideoCallEvent implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $user;
    public $action;

    public function __construct($user, $action)
    {
        $this->user = $user;
        $this->action = $action;
    }

    public function broadcastOn()
    {
        return new PresenceChannel('video-call');
    }

    public function broadcastAs()
    {
        return 'video.call';
    }
}
