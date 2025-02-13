<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoCallParticipant extends Model
{
    use HasFactory;

    protected $fillable = ['video_call_id', 'user_id'];

    public function videoCall()
    {
        return $this->belongsTo(VideoCall::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
