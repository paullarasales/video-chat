<?php

use Illuminate\Support\Facades\Broadcast;

// Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
//     return (int) $user->id === (int) $id;
// });

Broadcast::channel('video-call.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('video-call.{roomId}', function ($user, $roomId) {
    return ['id' => $user->id, 'name' => $user->name];
});
