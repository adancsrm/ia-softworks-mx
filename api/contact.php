<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

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

$recipient = getenv('SALES_RECIPIENT') ?: 'ventas@flowrecia.com';
$smtpHost = getenv('SMTP_HOST') ?: '';
$smtpUsername = getenv('SMTP_USERNAME') ?: '';
$smtpPassword = getenv('SMTP_PASSWORD') ?: '';
$smtpPort = (int)(getenv('SMTP_PORT') ?: 465);
$smtpSecure = getenv('SMTP_SECURE') ?: PHPMailer::ENCRYPTION_SMTPS;
$smtpFromEmail = getenv('SMTP_FROM_EMAIL') ?: '';
$smtpFromName = getenv('SMTP_FROM_NAME') ?: 'flowrecIA - Sitio web';

$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    $config = require $configFile;
    if (is_array($config)) {
        $recipient = (string)($config['sales_recipient'] ?? $recipient);
        $smtpHost = (string)($config['smtp_host'] ?? $smtpHost);
        $smtpUsername = (string)($config['smtp_username'] ?? $smtpUsername);
        $smtpPassword = (string)($config['smtp_password'] ?? $smtpPassword);
        $smtpPort = (int)($config['smtp_port'] ?? $smtpPort);
        $smtpSecure = (string)($config['smtp_secure'] ?? $smtpSecure);
        $smtpFromEmail = (string)($config['smtp_from_email'] ?? $smtpFromEmail);
        $smtpFromName = (string)($config['smtp_from_name'] ?? $smtpFromName);
    }
}

if ($smtpFromEmail === '') {
    $smtpFromEmail = $smtpUsername;
}

if ($smtpHost === '' || $smtpUsername === '' || $smtpPassword === '' || $smtpPassword === 'PEGA_AQUI_TU_PASSWORD_SMTP') {
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

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUsername;
    $mail->Password = $smtpPassword;
    $mail->SMTPSecure = $smtpSecure;
    $mail->Port = $smtpPort;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($smtpFromEmail, $smtpFromName);
    $mail->addAddress($recipient);
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $mail->addReplyTo($email, $nombre);
    }

    $mail->isHTML(true);
    $mail->Subject = 'Solicitud de cotización - ' . $subjectName;
    $mail->Body = $body;
    $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], "\n", $body));

    $mail->send();
} catch (PHPMailerException $e) {
    error_log('PHPMailer error: ' . $mail->ErrorInfo);
    respond(502, 'No fue posible enviar la solicitud en este momento.');
}

respond(200, 'Solicitud enviada correctamente.');
