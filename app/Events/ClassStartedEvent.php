<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ClassStartedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;

    /**
     * Create a new event instance.
     *
     * @param int $userId
     * @return void
     */
    public function __construct($userId)
    {
        $this->userId = $userId; // the user who started the class
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new Channel('class-started');
    }

    /**
     * Broadcast the event data.
     *
     * @return array
     */
    public function broadcastWith()
    {
        return [
            'user_id' => $this->userId, // Send the user ID of who started the class
            'message' => 'Class has started'
        ];
    }
}
