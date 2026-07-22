Estructura del sitio:
mi-sitio-ia-softworks-mx/
├── index.html
├── styles.css
├── script.js
├── assets/logo-ia-softworks-mx.jpg
├── sitios-web/index.html
├── chatbots-ia/index.html
├── google-ads/index.html
├── campanas-publicitarias/index.html
├── redes-sociales/index.html
├── agentes-online/index.html
├── plataforma-cotizacion/index.html
├── tienda-en-linea/index.html
├── facturacion/index.html
├── automatizacion/index.html
└── quienes-somos/index.html

Todas las páginas conservan logo, nombre, sedes, contacto, formulario de cotización, WhatsApp de Alan Rodríguez y asistente virtual.

INTEGRACIÓN CON GEMINI API
--------------------------
El asistente virtual ya consulta Gemini mediante api/chat.php.

Configuración rápida para hosting con PHP:
1. Confirma que el servidor tenga PHP 8+, cURL y mbstring.
2. Copia api/config.php.example como api/config.php.
3. Abre api/config.php y sustituye PEGA_AQUI_TU_CLAVE_DE_GEMINI por tu clave.
4. Sube el proyecto completo al hosting mediante HTTPS.
5. Abre el sitio desde el servidor. La API no funciona abriendo index.html directamente con file://.

Alternativa recomendada: define GEMINI_API_KEY como variable de entorno del servidor.
También puedes definir GEMINI_MODEL; el valor predeterminado es gemini-3-flash-preview.

La información empresarial que utiliza el asistente está en:
data/informacion-empresa.txt
Puedes editar ese archivo para agregar servicios, horarios, políticas y preguntas frecuentes.

IMPORTANTE:
- Nunca coloques la clave en script.js ni en una página HTML.
- No incluyas api/config.php al compartir o publicar el código fuente.
- Revisa periódicamente en Google AI Studio la cuota y el modelo disponibles.
ENVÍO DE FORMULARIOS CON RESEND
===============================

NETLIFY
-------

El sitio usa automáticamente netlify/functions/contact.mjs cuando está desplegado en Netlify.
Crea en Netlify la variable de entorno RESEND_API_KEY y realiza un nuevo deploy.
No subas api/config.php a Netlify.

HOSTINGER
---------

Si la Function de Netlify no existe, el formulario usa automáticamente api/contact.php.
Copia api/config.php.example como api/config.php y coloca ahí resend_api_key.
El archivo api/config.php debe permanecer privado y está excluido por .gitignore.

1. Agrega y verifica ia-softworks.mx en el panel de Resend.
2. Copia api/config.php.example como api/config.php.
3. En api/config.php, sustituye PEGA_AQUI_TU_CLAVE_DE_RESEND por la API key real.
4. No publiques la llave ni incluyas api/config.php en repositorios. El archivo ya está en .gitignore.
5. Sube el sitio y envía una solicitud de prueba desde cualquiera de los formularios.

También puedes configurar la llave como variable de entorno RESEND_API_KEY y omitirla de config.php.
Los mensajes se envían desde IA Softworks MX <contacto@ia-softworks.mx> hacia
alan_aarm@hotmail.com. El correo del visitante se configura como dirección de respuesta.
