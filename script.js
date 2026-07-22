document.addEventListener("DOMContentLoaded", function () {
  /*
   * =========================================================
   * AÑO AUTOMÁTICO DEL FOOTER
   * =========================================================
   */

  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /*
   * =========================================================
   * FORMULARIO DE COTIZACIÓN
   * =========================================================
   */

  const quoteForm = document.getElementById("quoteForm");

  if (quoteForm) {
    const quoteScript = document.querySelector('script[src$="script.js"]');
    const phpContactUrl = quoteScript
      ? new URL("api/contact.php", quoteScript.src).href
      : "api/contact.php";
    const quoteApiUrls = ["/.netlify/functions/contact", phpContactUrl];
    const quoteButton = quoteForm.querySelector('button[type="submit"]');
    const quoteNote = quoteForm.querySelector(".form-note");
    const originalButtonText = quoteButton?.textContent || "Enviar solicitud";

    // Campo trampa: los visitantes no lo ven, pero ayuda a bloquear bots.
    const websiteField = document.createElement("input");
    websiteField.type = "text";
    websiteField.name = "website";
    websiteField.tabIndex = -1;
    websiteField.autocomplete = "off";
    websiteField.setAttribute("aria-hidden", "true");
    websiteField.style.position = "absolute";
    websiteField.style.left = "-10000px";
    quoteForm.appendChild(websiteField);

    quoteForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const form = event.currentTarget;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (quoteButton) {
        quoteButton.disabled = true;
        quoteButton.textContent = "Enviando...";
      }
      if (quoteNote) {
        quoteNote.textContent = "Estamos enviando tu solicitud...";
        quoteNote.setAttribute("role", "status");
      }

      try {
        const requestBody = JSON.stringify(
          Object.fromEntries(new FormData(form)),
        );
        let response;

        for (const apiUrl of quoteApiUrls) {
          response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody,
          });

          // En Hostinger no existe la ruta de Functions de Netlify.
          if (response.status !== 404 && response.status !== 405) break;
        }

        if (!response) {
          throw new Error("No se encontró el servicio de envío.");
        }
        let result = {};
        try {
          result = await response.json();
        } catch (error) {
          throw new Error("El servidor devolvió una respuesta inválida.");
        }
        if (!response.ok) {
          throw new Error(result.error || "No fue posible enviar la solicitud.");
        }

        form.reset();
        if (quoteNote) {
          quoteNote.textContent =
            "Solicitud enviada correctamente. Nos pondremos en contacto contigo.";
        }
      } catch (error) {
        if (quoteNote) {
          quoteNote.textContent =
            error.message || "No fue posible enviar la solicitud. Intenta nuevamente.";
        }
        console.error("Error al enviar la cotización:", error);
      } finally {
        if (quoteButton) {
          quoteButton.disabled = false;
          quoteButton.textContent = originalButtonText;
        }
      }
    });
  }

  /*
   * =========================================================
   * ASISTENTE VIRTUAL
   * =========================================================
   */

  const assistantPanel = document.getElementById("assistantPanel");
  const assistantToggle = document.getElementById("assistantToggle");
  const assistantClose = document.getElementById("assistantClose");
  const assistantForm = document.getElementById("assistantForm");
  const assistantInput = document.getElementById("assistantInput");
  const assistantMessages = document.getElementById("assistantMessages");

  const assistantHistory = [];

  const assistantScript = document.querySelector(
    'script[src$="script.js"]',
  );

  const assistantApiUrl = assistantScript
    ? new URL("api/chat.php", assistantScript.src).href
    : "api/chat.php";

  function toggleAssistant(forceOpen) {
    if (!assistantPanel) return;

    const shouldOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !assistantPanel.classList.contains("is-open");

    assistantPanel.classList.toggle("is-open", shouldOpen);
  }

  function addAssistantMessage(text, type) {
    if (!assistantMessages) return;

    const bubble = document.createElement("div");

    bubble.className = `msg ${type}`;
    bubble.textContent = text;

    assistantMessages.appendChild(bubble);
    assistantMessages.scrollTop = assistantMessages.scrollHeight;
  }

  function setAssistantBusy(isBusy) {
    if (!assistantInput || !assistantForm) return;

    assistantInput.disabled = isBusy;

    const submitButton = assistantForm.querySelector(
      'button[type="submit"]',
    );

    if (submitButton) {
      submitButton.disabled = isBusy;
    }
  }

  function addTypingIndicator() {
    if (!assistantMessages) return;

    removeTypingIndicator();

    const bubble = document.createElement("div");

    bubble.className = "msg bot";
    bubble.id = "assistantTyping";
    bubble.textContent = "Escribiendo...";

    assistantMessages.appendChild(bubble);
    assistantMessages.scrollTop = assistantMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    document.getElementById("assistantTyping")?.remove();
  }

  async function getAssistantResponse(question) {
    const response = await fetch(assistantApiUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: question,
        history: assistantHistory.slice(-8),
      }),
    });

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      throw new Error(
        "El servidor devolvió una respuesta inválida.",
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "No fue posible obtener una respuesta.",
      );
    }

    return data.answer;
  }

  async function askAssistant(question) {
    if (!question) return;

    addAssistantMessage(question, "user");
    addTypingIndicator();
    setAssistantBusy(true);

    try {
      const answer = await getAssistantResponse(question);

      removeTypingIndicator();
      addAssistantMessage(answer, "bot");

      assistantHistory.push(
        {
          role: "user",
          text: question,
        },
        {
          role: "assistant",
          text: answer,
        },
      );
    } catch (error) {
      removeTypingIndicator();

      addAssistantMessage(
        error.message ||
          "El asistente no está disponible en este momento.",
        "bot",
      );

      console.error("Error del asistente:", error);
    } finally {
      setAssistantBusy(false);
      assistantInput?.focus();
    }
  }

  if (
    assistantToggle &&
    assistantPanel &&
    assistantForm &&
    assistantInput &&
    assistantMessages
  ) {
    assistantToggle.addEventListener("click", function () {
      toggleAssistant();
    });

    if (assistantClose) {
      assistantClose.addEventListener("click", function () {
        toggleAssistant(false);
      });
    }

    document
      .querySelectorAll(".assistant-chip")
      .forEach(function (chip) {
        chip.addEventListener("click", function () {
          const question = chip.dataset.question;

          if (question) {
            askAssistant(question);
          }
        });
      });

    assistantForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const question = assistantInput.value.trim();

      if (!question) return;

      assistantInput.value = "";
      askAssistant(question);
    });

    setTimeout(function () {
      toggleAssistant(true);
    }, 900);
  }

  /*
   * =========================================================
   * MENÚ DESPLEGABLE DE PRODUCTOS
   * =========================================================
   *
   * Mantiene visible el menú después de pasar el mouse.
   * Se cierra al elegir una opción o hacer clic fuera.
   */

  document
    .querySelectorAll(".nav-dropdown")
    .forEach(function (dropdown) {
      const toggle = dropdown.querySelector(
        ".nav-dropdown-toggle",
      );

      const menu = dropdown.querySelector(
        ".nav-dropdown-menu",
      );

      if (!toggle || !menu) return;

      function openDropdown() {
        dropdown.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
      }

      function closeDropdown() {
        dropdown.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }

      toggle.setAttribute("aria-expanded", "false");

      dropdown.addEventListener(
        "mouseenter",
        openDropdown,
      );

      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (dropdown.classList.contains("is-open")) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeDropdown);
      });

      document.addEventListener("click", function (event) {
        if (!dropdown.contains(event.target)) {
          closeDropdown();
        }
      });

      dropdown.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          closeDropdown();
          toggle.focus();
        }
      });
    });

  /*
   * =========================================================
   * MAPA MENTAL ANIMADO
   * =========================================================
   */

  const mapa = document.getElementById("mapaIA");
  const svg = document.getElementById("conexionesIA");

  /*
   * Si esta página no contiene el mapa, termina únicamente
   * la configuración del mapa. El resto del script ya se ejecutó.
   */

  if (!mapa || !svg) return;

  const nodos = Array.from(
    mapa.querySelectorAll(".nodo"),
  );

  const estados = new Map();
  const lineas = [];

  const movimientoReducido = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let ancho = 0;
  let alto = 0;
  let mouseX = 0;
  let mouseY = 0;
  let frameId = null;
  let tiempoAnterior = 0;

  const conexiones = [
    ["softworks", "chatbots"],
    ["softworks", "desarrollo"],
    ["softworks", "automatizacion"],
    ["chatbots", "desarrollo"],
    ["desarrollo", "automatizacion"],
    ["desarrollo", "inteligencia"],
    ["automatizacion", "inteligencia"],
    ["inteligencia", "apis"],
    ["inteligencia", "crm"],
    ["inteligencia", "agentes"],
    ["inteligencia", "campanas"],
    ["apis", "crm"],
    ["crm", "agentes"],
    ["agentes", "campanas"],
  ];

  function numero(elemento, nombre, defecto) {
    const valor = Number(elemento.dataset[nombre]);

    return Number.isFinite(valor)
      ? valor
      : defecto;
  }

  nodos.forEach(function (nodo, indice) {
    const id = nodo.dataset.id;

    if (!id) return;

    estados.set(id, {
      elemento: nodo,
      xPorcentaje: numero(nodo, "x", 50),
      yPorcentaje: numero(nodo, "y", 50),
      amplitud: numero(nodo, "amplitud", 6),
      velocidad: numero(nodo, "velocidad", 0.001),
      faseX: indice * 0.95,
      faseY: indice * 1.35,
      x: 0,
      y: 0,
    });
  });

  conexiones.forEach(function (pares, indice) {
    const origen = estados.get(pares[0]);
    const destino = estados.get(pares[1]);

    if (!origen || !destino) return;

    const grupo = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );

    const ruta = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );

    const particula = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );

    ruta.classList.add("linea-conexion");
    ruta.dataset.origen = pares[0];
    ruta.dataset.destino = pares[1];

    particula.classList.add("particula-conexion");

    particula.setAttribute(
      "r",
      indice % 3 === 0 ? "2.4" : "1.7",
    );

    grupo.appendChild(ruta);
    grupo.appendChild(particula);
    svg.appendChild(grupo);

    lineas.push({
      ruta,
      particula,
      origen,
      destino,
      progreso: (indice * 0.11) % 1,
      velocidad:
        0.00012 +
        (indice % 4) * 0.000025,
    });
  });

  function dimensiones() {
    const rect = mapa.getBoundingClientRect();

    ancho = rect.width;
    alto = rect.height;

    svg.setAttribute(
      "viewBox",
      `0 0 ${ancho} ${alto}`,
    );
  }

  function rutaCurva(origen, destino) {
    const dx = destino.x - origen.x;
    const dy = destino.y - origen.y;

    const distancia =
      Math.sqrt(dx * dx + dy * dy) || 1;

    const curvatura = Math.min(
      52,
      Math.max(16, distancia * 0.1),
    );

    const perpendicularX = -dy / distancia;
    const perpendicularY = dx / distancia;

    const medioX =
      (origen.x + destino.x) / 2 +
      perpendicularX * curvatura;

    const medioY =
      (origen.y + destino.y) / 2 +
      perpendicularY * curvatura;

    return (
      `M ${origen.x} ${origen.y} ` +
      `Q ${medioX} ${medioY} ` +
      `${destino.x} ${destino.y}`
    );
  }

  function actualizarNodos(tiempo) {
    estados.forEach(function (estado) {
      const baseX =
        (ancho * estado.xPorcentaje) / 100;

      const baseY =
        (alto * estado.yPorcentaje) / 100;

      let flotacionX = 0;
      let flotacionY = 0;

      if (!movimientoReducido) {
        flotacionX =
          Math.sin(
            tiempo * estado.velocidad +
              estado.faseX,
          ) * estado.amplitud;

        flotacionY =
          Math.cos(
            tiempo *
              estado.velocidad *
              0.82 +
              estado.faseY,
          ) * estado.amplitud;
      }

      const profundidad =
        estado.elemento.classList.contains(
          "nodo--principal",
        )
          ? 10
          : 5;

      const parallaxX = mouseX * profundidad;
      const parallaxY = mouseY * profundidad;

      estado.x =
        baseX +
        flotacionX +
        parallaxX;

      estado.y =
        baseY +
        flotacionY +
        parallaxY;

      estado.elemento.style.left = `${baseX}px`;
      estado.elemento.style.top = `${baseY}px`;

      estado.elemento.style.setProperty(
        "--desplazamiento-x",
        `${flotacionX}px`,
      );

      estado.elemento.style.setProperty(
        "--desplazamiento-y",
        `${flotacionY}px`,
      );

      estado.elemento.style.setProperty(
        "--parallax-x",
        `${parallaxX}px`,
      );

      estado.elemento.style.setProperty(
        "--parallax-y",
        `${parallaxY}px`,
      );
    });
  }

  function actualizarLineas(delta) {
    lineas.forEach(function (conexion) {
      conexion.ruta.setAttribute(
        "d",
        rutaCurva(
          conexion.origen,
          conexion.destino,
        ),
      );

      const longitud =
        conexion.ruta.getTotalLength();

      if (
        !Number.isFinite(longitud) ||
        longitud <= 0
      ) {
        return;
      }

      if (!movimientoReducido) {
        conexion.progreso =
          (conexion.progreso +
            delta * conexion.velocidad) %
          1;
      }

      const punto =
        conexion.ruta.getPointAtLength(
          longitud * conexion.progreso,
        );

      conexion.particula.setAttribute(
        "cx",
        punto.x,
      );

      conexion.particula.setAttribute(
        "cy",
        punto.y,
      );
    });
  }

  function animar(tiempo) {
    const delta = Math.min(
      40,
      tiempoAnterior
        ? tiempo - tiempoAnterior
        : 16,
    );

    tiempoAnterior = tiempo;

    actualizarNodos(tiempo);
    actualizarLineas(delta);

    frameId = requestAnimationFrame(animar);
  }

  function activar(id, activo) {
    lineas.forEach(function (conexion) {
      const relacionada =
        conexion.ruta.dataset.origen === id ||
        conexion.ruta.dataset.destino === id;

      if (relacionada) {
        conexion.ruta.classList.toggle(
          "linea-conexion--activa",
          activo,
        );
      }
    });
  }

  nodos.forEach(function (nodo) {
    const id = nodo.dataset.id;

    if (!id) return;

    nodo.addEventListener(
      "mouseenter",
      function () {
        activar(id, true);
      },
    );

    nodo.addEventListener(
      "mouseleave",
      function () {
        activar(id, false);
      },
    );

    nodo.addEventListener(
      "focus",
      function () {
        activar(id, true);
      },
    );

    nodo.addEventListener(
      "blur",
      function () {
        activar(id, false);
      },
    );
  });

  mapa.addEventListener(
    "pointermove",
    function (evento) {
      const rect =
        mapa.getBoundingClientRect();

      mouseX =
        (evento.clientX - rect.left) /
          rect.width -
        0.5;

      mouseY =
        (evento.clientY - rect.top) /
          rect.height -
        0.5;
    },
  );

  mapa.addEventListener(
    "pointerleave",
    function () {
      mouseX = 0;
      mouseY = 0;
    },
  );

  if ("ResizeObserver" in window) {
    const resizeObserver =
      new ResizeObserver(dimensiones);

    resizeObserver.observe(mapa);
  } else {
    window.addEventListener(
      "resize",
      dimensiones,
    );
  }

  document.addEventListener(
    "visibilitychange",
    function () {
      if (document.hidden) {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }

        frameId = null;
      } else if (!frameId) {
        tiempoAnterior = 0;
        frameId = requestAnimationFrame(animar);
      }
    },
  );

  dimensiones();
  frameId = requestAnimationFrame(animar);
});
