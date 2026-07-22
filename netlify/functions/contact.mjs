const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

const clean = (value, maxLength) =>
  String(value ?? "").trim().slice(0, maxLength);

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export default async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Método no permitido." });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json")) {
    return json(415, { error: "Formato de solicitud no permitido." });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { error: "Solicitud inválida." });
  }

  // Campo trampa contra envíos automatizados.
  if (clean(input.website, 200)) {
    return json(200, { message: "Solicitud enviada." });
  }

  const nombre = clean(input.nombre, 120);
  const contacto = clean(input.contacto, 120);
  const email = clean(input.email, 254);
  const telefono = clean(input.telefono, 60);
  const servicio = clean(input.servicio, 160);
  const presupuesto = clean(input.presupuesto, 100) || "Por definir";
  const descripcion = clean(input.descripcion, 3000);

  if (!nombre || !contacto || !telefono || !servicio || !descripcion) {
    return json(422, { error: "Completa todos los campos obligatorios." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(422, { error: "Escribe un correo electrónico válido." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json(503, { error: "El servicio de correo todavía no está configurado." });
  }

  const safe = {
    nombre: escapeHtml(nombre),
    contacto: escapeHtml(contacto),
    email: escapeHtml(email),
    telefono: escapeHtml(telefono),
    servicio: escapeHtml(servicio),
    presupuesto: escapeHtml(presupuesto),
    descripcion: escapeHtml(descripcion).replaceAll("\n", "<br>"),
  };

  let resendResponse;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "IA Softworks MX <contacto@ia-softworks.mx>",
        to: ["alan_aarm@hotmail.com"],
        reply_to: email,
        subject: `Solicitud de cotización - ${nombre.replace(/[\r\n]/g, " ")}`,
        html: `<h2>Nueva solicitud de cotización</h2>
          <p><strong>Cliente / empresa:</strong> ${safe.nombre}</p>
          <p><strong>Persona de contacto:</strong> ${safe.contacto}</p>
          <p><strong>Correo:</strong> ${safe.email}</p>
          <p><strong>Teléfono / WhatsApp:</strong> ${safe.telefono}</p>
          <p><strong>Servicio de interés:</strong> ${safe.servicio}</p>
          <p><strong>Presupuesto estimado:</strong> ${safe.presupuesto}</p>
          <p><strong>Descripción del proyecto:</strong><br>${safe.descripcion}</p>`,
      }),
    });
  } catch (error) {
    console.error("Resend connection error", error);
    return json(502, { error: "No fue posible conectar con el servicio de correo." });
  }

  if (!resendResponse.ok) {
    console.error("Resend API error", resendResponse.status, await resendResponse.text());
    return json(502, { error: "No fue posible enviar la solicitud en este momento." });
  }

  return json(200, { message: "Solicitud enviada correctamente." });
};
