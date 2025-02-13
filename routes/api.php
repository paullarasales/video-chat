<?php

use Illuminate\Http\Request;
use App\Http\Controllers\VideoCallController;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/video-call/start', [VideoCallController::class, 'startCall']);
    Route::post('/video-call/join', [VideoCallController::class, 'joinCall']);
    Route::post('/video-call/end', [VideoCallController::class, 'endCall']);
});
