<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoCall extends Model
{
    use HasFactory;

    protected $fillable = ['host_id', 'room_id', 'status', 'host_peer_id'];

    public function host()
    { 
        return $this->belongsTo(User::class, 'host_id');
    }

    public function participants()
    {
        return $this->belongsToMany(User::class, 'video_call_participants');
    }
}
