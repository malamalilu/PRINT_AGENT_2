<?php

header('Content-Type: application/json; charset=utf-8');

$url = 'http://127.0.0.1:19100/api/health';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 3,
        'ignore_errors' => true,
    ],
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Lita Print Agent is not running.',
    ]);
    exit;
}

echo $response;
