# ia-softworks-mx

## Ejecutar en local (Windows)

1. Configura la clave de Claude (Anthropic) en `api/config.php`.
2. Ejecuta `.\start-local.cmd` desde PowerShell o CMD.
3. Abre `http://127.0.0.1:8000/`.

No abras `index.html` directamente con `file://`: el chatbot necesita PHP. El
script configura el entorno local necesario para conectar PHP con Claude. Usa
`.\start-local.cmd -Port 8080` para cambiar el puerto. El lanzador no modifica la
política global de ejecución de PowerShell.
Sitio web IASoftworksMX
