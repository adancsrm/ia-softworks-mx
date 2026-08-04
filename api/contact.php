<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, string $message): void
{
    http_response_code($status);
    $key = $status >= 400 ? 'error' : 'message';
    echo json_encode([$key => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean($value, int $maxLength): string
{
    return mb_substr(trim((string)$value), 0, $maxLength);
}

function html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, 'Método no permitido.');
}

$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
if (strpos($contentType, 'application/json') === false) {
    respond(415, 'Formato de solicitud no permitido.');
}

$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) {
    respond(400, 'Solicitud inválida.');
}

// Campo trampa contra envíos automatizados.
if (clean($input['website'] ?? '', 200) !== '') {
    respond(200, 'Solicitud enviada.');
}

$nombre = clean($input['nombre'] ?? '', 120);
$contacto = clean($input['contacto'] ?? '', 120);
$email = clean($input['email'] ?? '', 254);
$telefono = clean($input['telefono'] ?? '', 60);
$servicio = clean($input['servicio'] ?? '', 160);
$presupuesto = clean($input['presupuesto'] ?? 'Por definir', 100) ?: 'Por definir';
$descripcion = clean($input['descripcion'] ?? '', 3000);
$privacidad = clean($input['privacidad'] ?? '', 20);
$serviciosPermitidos = [
    'Punto de venta POS',
    'Tienda en línea',
    'Chatbot / Agente IA',
    'Sistema de cotización',
    'Facturación / reportes',
    'Automatización administrativa',
    'Mejora a sistema existente',
    'Desarrollo de software a medida',
    'Sitio web',
    'Google Ads',
    'Redes sociales',
    'Campañas publicitarias',
];

if ($nombre === '' || $contacto === '' || $telefono === '' || $servicio === '' || $descripcion === '') {
    respond(422, 'Completa todos los campos obligatorios.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, 'Escribe un correo electrónico válido.');
}
if (!in_array($servicio, $serviciosPermitidos, true)) {
    respond(422, 'Selecciona un servicio válido.');
}
if ($privacidad !== 'acepto') {
    respond(422, 'Debes aceptar el aviso de privacidad.');
}

$apiKey = getenv('RESEND_API_KEY') ?: '';
$recipient = getenv('SALES_RECIPIENT') ?: 'bshgroupcrm@gmail.com';
$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    $config = require $configFile;
    if (is_array($config)) {
        $apiKey = (string)($config['resend_api_key'] ?? $apiKey);
        $recipient = (string)($config['sales_recipient'] ?? $recipient);
    }
}

if ($apiKey === '' || $apiKey === 'PEGA_AQUI_TU_CLAVE_DE_RESEND') {
    respond(503, 'El servicio de correo todavía no está configurado.');
}
if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    error_log('Invalid SALES_RECIPIENT configuration.');
    respond(503, 'El destinatario de ventas no está configurado correctamente.');
}

session_name('ia_softworks_form');
session_set_cookie_params([
    'httponly' => true,
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'samesite' => 'Lax',
]);
session_start();

$now = time();
$lastSubmission = (int)($_SESSION['last_quote_submission'] ?? 0);
if ($lastSubmission > 0 && ($now - $lastSubmission) < 30) {
    respond(429, 'Espera unos segundos antes de enviar otra solicitud.');
}
$_SESSION['last_quote_submission'] = $now;

$subjectName = preg_replace('/[\r\n]+/', ' ', $nombre) ?: 'Nuevo prospecto';
$body = '<h2>Nueva solicitud de cotización</h2>'
    . '<p><strong>Cliente / empresa:</strong> ' . html($nombre) . '</p>'
    . '<p><strong>Persona de contacto:</strong> ' . html($contacto) . '</p>'
    . '<p><strong>Correo:</strong> ' . html($email) . '</p>'
    . '<p><strong>Teléfono / WhatsApp:</strong> ' . html($telefono) . '</p>'
    . '<p><strong>Servicio de interés:</strong> ' . html($servicio) . '</p>'
    . '<p><strong>Presupuesto estimado:</strong> ' . html($presupuesto) . '</p>'
    . '<p><strong>Descripción del proyecto:</strong><br>' . nl2br(html($descripcion)) . '</p>';

$payload = [
    'from' => 'MIA Coding <contacto@ia-softworks.mx>',
    'to' => [$recipient],
    'reply_to' => $email,
    'subject' => 'Solicitud de cotización - ' . $subjectName,
    'html' => $body,
];

$curl = curl_init('https://api.resend.com/emails');
if ($curl === false) {
    respond(500, 'No fue posible iniciar el servicio de correo.');
}

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$response = curl_exec($curl);
$status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_error($curl);
curl_close($curl);

if ($response === false) {
    error_log('Resend connection error: ' . $curlError);
    respond(502, 'No fue posible conectar con el servicio de correo.');
}
if ($status < 200 || $status >= 300) {
    error_log('Resend API error HTTP ' . $status . ': ' . $response);
    respond(502, 'No fue posible enviar la solicitud en este momento.');
}

respond(200, 'Solicitud enviada correctamente.');
