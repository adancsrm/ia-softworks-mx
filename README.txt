Estructura del sitio:
mi-sitio-ia-softworks-mx/
├── index.html
├── styles.css
├── script.js
├── assets/logo-flowrecIA.jpeg
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
├── quienes-somos/index.html
├── contacto/index.html
├── privacidad/index.html
├── robots.txt
├── sitemap.xml
└── .htaccess

Todas las páginas conservan logo, nombre, sedes, contacto, formulario de cotización y asistente virtual. El contacto heredado de Alan Rodríguez debe permanecer retirado. El número directo o WhatsApp del responsable se incorporará únicamente cuando haya sido confirmado.

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
ENVÍO DE FORMULARIOS EN BANAHOSTING / CPANEL
============================================

El sitio usa exclusivamente api/contact.php. No depende de Netlify.

Requisitos del hosting:
- Apache o LiteSpeed con PHP 8 o superior.
- Extensiones PHP cURL y mbstring.
- Sitio publicado mediante HTTPS.

Configuración:
1. Agrega y verifica ia-softworks.mx en Resend.
2. Copia api/config.php.example como api/config.php.
3. Sustituye PEGA_AQUI_TU_CLAVE_DE_RESEND por la API key real.
4. Conserva sales_recipient como bshgroupcrm@gmail.com.
5. Si se habilitará el asistente, configura también la clave de Gemini.
6. Sube el contenido del proyecto a la carpeta pública asignada al dominio.
7. Comprueba que https://flowrecia.com/api/contact.php responda con
   "Método no permitido" al abrirla directamente; eso confirma que PHP se ejecuta.
8. Envía una solicitud real desde el formulario y comprueba su llegada a
   bshgroupcrm@gmail.com.

api/config.php contiene secretos y está excluido mediante .gitignore. No debe
subirse a Git. Como alternativa, el servidor puede definir RESEND_API_KEY,
SALES_RECIPIENT, GEMINI_API_KEY y GEMINI_MODEL como variables de entorno.

Los mensajes se envían desde flowrecIA <contacto@ia-softworks.mx> hacia
bshgroupcrm@gmail.com. El correo del visitante se configura como dirección de
respuesta.
