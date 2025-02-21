<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'], // Add your paths as necessary

    'allowed_methods' => ['*'], // Allow all methods, or specify if needed

    'allowed_origins' => ['http://192.168.2.104'], // Allow the Vite server

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // Allow all headers

    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,

];
