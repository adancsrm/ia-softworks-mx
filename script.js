document.addEventListener("DOMContentLoaded", function () {
  /*
   * =========================================================
   * MEDICIÓN GTM / GA4
   * =========================================================
   *
   * Los eventos se envían al dataLayer y Google Tag Manager
   * decide cuáles mandar posteriormente a Google Analytics.
   */

  window.dataLayer = window.dataLayer || [];

  function trackEvent(eventName, parameters = {}) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  }

  const siteScript = document.querySelector('script[src$="script.js"]');
  const privacyUrl = siteScript
    ? new URL("privacidad/index.html", siteScript.src).href
    : "privacidad/index.html";

  /*
   * =========================================================
   * AÑO AUTOMÁTICO DEL FOOTER
   * =========================================================
   */

  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const footerGrid = document.querySelector("footer .footer-grid");

  if (footerGrid && !footerGrid.querySelector(".privacy-link")) {
    const privacyLink = document.createElement("a");
    privacyLink.className = "privacy-link";
    privacyLink.href = privacyUrl;
    privacyLink.textContent = "Aviso de privacidad";
    footerGrid.appendChild(privacyLink);
  }

  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    const relValues = new Set(
      (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean),
    );
    relValues.add("noopener");
    relValues.add("noreferrer");
    link.setAttribute("rel", Array.from(relValues).join(" "));
  });

  /*
   * =========================================================
   * CLICS DE CONTACTO
   * =========================================================
   *
   * No enviamos el número telefónico, correo ni URL completa
   * al dataLayer para evitar mandar datos identificables a GA4.
   */

  document.addEventListener("click", function (event) {
    const clickedElement =
      event.target instanceof Element ? event.target : null;
    const link = clickedElement?.closest("a[href]");

    if (!link) return;

    const href = (link.getAttribute("href") || "").trim().toLowerCase();

    if (
      href.startsWith("https://wa.me/") ||
      href.startsWith("http://wa.me/") ||
      href.includes("api.whatsapp.com/") ||
      href.startsWith("whatsapp:")
    ) {
      trackEvent("whatsapp_click", {
        contact_method: "whatsapp",
      });
      return;
    }

    if (href.startsWith("tel:")) {
      trackEvent("phone_click", {
        contact_method: "phone",
      });
      return;
    }

    if (href.startsWith("mailto:")) {
      trackEvent("email_click", {
        contact_method: "email",
      });
    }
  });

  /*
   * =========================================================
   * FORMULARIO DE COTIZACIÓN
   * =========================================================
   */

  const quoteFormTemplate = `
    <form id="quoteForm">
      <div class="form-grid">
        <label>Nombre o empresa<input name="nombre" placeholder="Ej. AQUA NARVAL" required type="text"></label>
        <label>Persona de contacto<input name="contacto" placeholder="Ej. Lic. Eduardo Serrano" required type="text"></label>
      </div>
      <div class="form-grid">
        <label>Correo electrónico<input name="email" placeholder="correo@empresa.com" required type="email"></label>
        <label>Teléfono / WhatsApp<input name="telefono" placeholder="55 0000 0000" required type="tel"></label>
      </div>
      <div class="form-grid">
        <label>Servicio de interés
          <select name="servicio" required>
            <option value="">Selecciona una opción</option>
            <option>Punto de venta POS</option>
            <option>Tienda en línea</option>
            <option>Chatbot / Agente IA</option>
            <option>Sistema de cotización</option>
            <option>Facturación / reportes</option>
            <option>Automatización administrativa</option>
            <option>Mejora a sistema existente</option>
            <option>Desarrollo de software a medida</option>
            <option>Sitio web</option>
            <option>Google Ads</option>
            <option>Redes sociales</option>
            <option>Campañas publicitarias</option>
          </select>
        </label>
        <label>Presupuesto estimado<input name="presupuesto" placeholder="Ej. $6,000 MXN o por definir" type="text"></label>
      </div>
      <label>Descripción del proyecto
        <textarea name="descripcion" placeholder="Describe qué necesitas, tiempos, procesos actuales, reportes, usuarios, etc." required></textarea>
      </label>
      <button class="btn btn-primary" type="submit">Enviar solicitud</button>
    </form>
  `;

  document.querySelectorAll("[data-quote-form]").forEach(function (mountPoint) {
    mountPoint.innerHTML = quoteFormTemplate;
  });

  const quoteForm = document.getElementById("quoteForm");

  if (quoteForm) {
    const phpContactUrl = siteScript
      ? new URL("api/contact.php", siteScript.src).href
      : "api/contact.php";
    const quoteButton = quoteForm.querySelector('button[type="submit"]');
    let quoteNote = quoteForm.querySelector(".form-note");
    const originalButtonText = quoteButton?.textContent || "Enviar solicitud";

    if (quoteButton && !quoteForm.querySelector('input[name="privacidad"]')) {
      const consentLabel = document.createElement("label");
      consentLabel.className = "privacy-consent";
      consentLabel.innerHTML = `
        <input name="privacidad" type="checkbox" value="acepto" required>
        <span>
          He leído y acepto el
          <a href="${privacyUrl}" target="_blank" rel="noopener">aviso de privacidad</a>.
        </span>
      `;
      quoteForm.insertBefore(consentLabel, quoteButton);
    }

    if (quoteButton && !quoteNote) {
      quoteNote = document.createElement("p");
      quoteNote.className = "form-note";
      quoteNote.setAttribute("aria-live", "polite");
      quoteButton.insertAdjacentElement("afterend", quoteNote);
    }

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
        const response = await fetch(phpContactUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });
        let result = {};
        try {
          result = await response.json();
        } catch (error) {
          throw new Error("El servidor devolvió una respuesta inválida.");
        }
        if (!response.ok) {
          throw new Error(result.error || "No fue posible enviar la solicitud.");
        }

        /*
         * Conversión principal:
         * solo se registra cuando api/contact.php respondió correctamente.
         */
        trackEvent("generate_lead", {
          lead_source: "quote_form",
          form_id: quoteForm.id || "quoteForm",
        });

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
  let chatOpenTracked = false;
  let chatInteractionTracked = false;

  const assistantScript = document.querySelector(
    'script[src$="script.js"]',
  );

  const assistantApiUrl = assistantScript
    ? new URL("api/chat.php", assistantScript.src).href
    : "api/chat.php";

  function toggleAssistant(forceOpen) {
    if (!assistantPanel) return;

    const wasOpen = assistantPanel.classList.contains("is-open");

    const shouldOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !wasOpen;

    assistantPanel.classList.toggle("is-open", shouldOpen);
    assistantToggle?.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen && !wasOpen && !chatOpenTracked) {
      chatOpenTracked = true;

      trackEvent("chat_open", {
        chat_name: "flowrecia_assistant",
      });
    }
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

    if (!chatInteractionTracked) {
      chatInteractionTracked = true;

      trackEvent("chat_interaction", {
        chat_name: "flowrecia_assistant",
      });
    }

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
    assistantToggle.setAttribute("aria-label", "Abrir asistente virtual");
    assistantToggle.setAttribute("aria-controls", "assistantPanel");
    assistantToggle.setAttribute("aria-expanded", "false");
    assistantClose?.setAttribute("aria-label", "Cerrar asistente virtual");
    assistantInput.setAttribute("aria-label", "Pregunta para el asistente virtual");
    assistantForm
      .querySelector('button[type="submit"]')
      ?.setAttribute("aria-label", "Enviar pregunta al asistente");

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

  }


  /*
   * =========================================================
   * BARRA DE CONTACTO
   * =========================================================
   *
   * Escritorio:
   * muestra correo, WhatsApp y teléfono sobre el encabezado.
   *
   * Móvil:
   * muestra accesos compactos junto al menú hamburguesa.
   */

  const siteTopbar = document.querySelector(".topbar");
  const siteNav = siteTopbar?.querySelector(".nav");

  if (siteTopbar && siteNav) {
    /*
     * Barra superior para escritorio.
     */
    if (!document.querySelector(".contact-strip")) {
      const contactStrip = document.createElement("div");
      contactStrip.className = "contact-strip";

      contactStrip.innerHTML = `
        <div class="container contact-strip-inner">

          <a
            class="contact-strip-link"
            href="mailto:ventas@flowrecia.com"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                d="M3 5h18v14H3V5Zm1.8 1.8L12 12.1l7.2-5.3H4.8ZM4.5 17.5h15V8.4L12 13.9 4.5 8.4v9.1Z"
                fill="currentColor"
              />
            </svg>

            <span>ventas@flowrecia.com</span>
          </a>


         <div class="contact-strip-phone">

          <a
            class="contact-action-icon"
            href="https://wa.me/528332395885"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enviar WhatsApp al 833 239 5885"
            title="WhatsApp"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="17"
              height="17"
            >
              <path
                d="M12 2a9.7 9.7 0 0 0-8.3 14.7L2.4 22l5.4-1.4A9.8 9.8 0 1 0 12 2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8 8 0 1 1 12 19.8Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.3-.4.3-.4.8-1.4.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1-.1-.1-.3-.2-.6-.3Z"
                fill="currentColor"
              />
            </svg>
          </a>

          <a
            class="contact-action-icon"
            href="tel:+528332395885"
            aria-label="Llamar al 833 239 5885"
            title="Llamar"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="17"
              height="17"
            >
              <path
                d="M6.6 10.8a15.7 15.7 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.2.6 3.4.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.2c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.3.6 3.4.1.4 0 .8-.3 1.1l-2.2 2.1Z"
                fill="currentColor"
              />
            </svg>
          </a>

          <span>833 239 5885</span>

        </div>


        <div class="contact-strip-phone">

          <a
            class="contact-action-icon"
            href="https://wa.me/525534137179"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enviar WhatsApp al 55 3413 7179"
            title="WhatsApp"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="17"
              height="17"
            >
              <path
                d="M12 2a9.7 9.7 0 0 0-8.3 14.7L2.4 22l5.4-1.4A9.8 9.8 0 1 0 12 2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8 8 0 1 1 12 19.8Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.3-.4.3-.4.8-1.4.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1-.1-.1-.3-.2-.6-.3Z"
                fill="currentColor"
              />
            </svg>
          </a>

          <a
            class="contact-action-icon"
            href="tel:+525534137179"
            aria-label="Llamar al 55 3413 7179"
            title="Llamar"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="17"
              height="17"
            >
              <path
                d="M6.6 10.8a15.7 15.7 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.2.6 3.4.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.2c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.3.6 3.4.1.4 0 .8-.3 1.1l-2.2 2.1Z"
                fill="currentColor"
              />
            </svg>
          </a>

          <span>55 3413 7179</span>

        </div>

        </div>
      `;
      
      siteTopbar.prepend(contactStrip);
    }

    
    /*
     * Accesos compactos para móvil.
     */
    if (!siteNav.querySelector(".mobile-contact-actions")) {
      const mobileContactActions = document.createElement("div");

      mobileContactActions.className = "mobile-contact-actions";

      mobileContactActions.innerHTML = `

        <!-- WhatsApp -->

        <details class="mobile-contact-menu">

          <summary
            class="mobile-contact-link"
            aria-label="Elegir número de WhatsApp"
            title="WhatsApp"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                d="M12 2a9.7 9.7 0 0 0-8.3 14.7L2.4 22l5.4-1.4A9.8 9.8 0 1 0 12 2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8 8 0 1 1 12 19.8Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.3-.4.3-.4.8-1.4.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1-.1-.1-.3-.2-.6-.3Z"
                fill="currentColor"
              />
            </svg>
          </summary>

          <div class="mobile-contact-popover">

            <span class="mobile-contact-popover-title">
              WhatsApp
            </span>

            <a
              href="https://wa.me/528332395885"
              target="_blank"
              rel="noopener noreferrer"
            >
              833 239 5885
            </a>

            <a
              href="https://wa.me/525534137179"
              target="_blank"
              rel="noopener noreferrer"
            >
              55 3413 7179
            </a>

          </div>

        </details>


        <!-- Llamadas -->

        <details class="mobile-contact-menu">

          <summary
            class="mobile-contact-link"
            aria-label="Elegir número para llamar"
            title="Llamar"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                d="M6.6 10.8a15.7 15.7 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.2.6 3.4.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.2c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.3.6 3.4.1.4 0 .8-.3 1.1l-2.2 2.1Z"
                fill="currentColor"
              />
            </svg>
          </summary>

          <div class="mobile-contact-popover">

            <span class="mobile-contact-popover-title">
              Llamar
            </span>

            <a href="tel:+528332395885">
              833 239 5885
            </a>

            <a href="tel:+525534137179">
              55 3413 7179
            </a>

          </div>

        </details>


        <!-- Correo -->

        <a
          class="mobile-contact-link"
          href="mailto:ventas@flowrecia.com"
          aria-label="Enviar correo a ventas@flowrecia.com"
          title="ventas@flowrecia.com"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
          >
            <path
              d="M3 5h18v14H3V5Zm1.8 1.8L12 12.1l7.2-5.3H4.8ZM4.5 17.5h15V8.4L12 13.9 4.5 8.4v9.1Z"
              fill="currentColor"
            />
          </svg>
        </a>

      `;

      const navLinksElement =
        siteNav.querySelector(".nav-links");

      if (navLinksElement) {
        siteNav.insertBefore(
          mobileContactActions,
          navLinksElement,
        );
const mobileContactMenus =
  mobileContactActions.querySelectorAll(".mobile-contact-menu");

mobileContactMenus.forEach((menu) => {
  menu.addEventListener("toggle", () => {
    if (!menu.open) return;

    mobileContactMenus.forEach((otherMenu) => {
      if (otherMenu !== menu) {
        otherMenu.removeAttribute("open");
      }
    });
  });
});

document.addEventListener("click", (event) => {
  if (mobileContactActions.contains(event.target)) return;

  mobileContactMenus.forEach((menu) => {
    menu.removeAttribute("open");
  });
});
      }
    }
  }




  /*
   * =========================================================
   * NAVEGACIÓN PRINCIPAL Y MENÚ MÓVIL
   * =========================================================
   */

  const mainNav = document.querySelector(".topbar .nav");
  const navLinks = mainNav?.querySelector(".nav-links");

  if (mainNav && navLinks) {
    const mobileToggle = document.createElement("button");
    mobileToggle.className = "mobile-nav-toggle";
    mobileToggle.type = "button";
    mobileToggle.setAttribute("aria-label", "Abrir menú principal");
    mobileToggle.setAttribute("aria-controls", "main-navigation");
    mobileToggle.setAttribute("aria-expanded", "false");
    mobileToggle.textContent = "☰";
    navLinks.id = "main-navigation";
    mainNav.insertBefore(mobileToggle, navLinks);

    function closeMobileNav() {
      mainNav.classList.remove("nav-open");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.setAttribute("aria-label", "Abrir menú principal");
      mobileToggle.textContent = "☰";
    }

    mobileToggle.addEventListener("click", function () {
      const shouldOpen = !mainNav.classList.contains("nav-open");
      mainNav.classList.toggle("nav-open", shouldOpen);
      mobileToggle.setAttribute("aria-expanded", String(shouldOpen));
      mobileToggle.setAttribute(
        "aria-label",
        shouldOpen ? "Cerrar menú principal" : "Abrir menú principal",
      );
      mobileToggle.textContent = shouldOpen ? "×" : "☰";
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      const linkUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const normalizedLinkPath = linkUrl.pathname.replace(/\/index\.html$/, "/");
      const normalizedCurrentPath = currentUrl.pathname.replace(/\/index\.html$/, "/");

      if (
        linkUrl.origin === currentUrl.origin &&
        normalizedLinkPath === normalizedCurrentPath &&
        !linkUrl.hash
      ) {
        link.setAttribute("aria-current", "page");
      }

      link.addEventListener("click", closeMobileNav);
    });

    document.addEventListener("click", function (event) {
      if (!mainNav.contains(event.target)) {
        closeMobileNav();
      }
    });
  }

  /*
   * =========================================================
   * MENÚ DESPLEGABLE DE PRODUCTOS
   * =========================================================
   *
   * Se abre y cierra con el mismo botón.
   * También se cierra al elegir una opción, hacer clic fuera o pulsar Escape.
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
        link.addEventListener("click", function () {
          closeDropdown();
          toggle.blur();
        });
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
