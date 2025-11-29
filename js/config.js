/* ======================================================
   FARBER PANEL PRO
   Módulo: Configuración general (config.js)
   Estilo: Módulo con estado interno (opción 3)
   Depende de: app.js (registerModule, toast)
   ====================================================== */

const ConfigModule = {
  section: "config",
  storageKey: "farber_config",

  state: {
    empresaNombre: "Farber Muebles",
    sucursalNombre: "Casa Central",
    monedaSimbolo: "$",
    monedaCodigo: "ARS",
    ivaPorDefecto: 21,
    mostrarCentavos: true,
    numeracionAutomatica: true
  },

  /* -------------------------
     Cargar configuración
  ------------------------- */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      this.state = {
        ...this.state,
        ...parsed
      };
    } catch (err) {
      console.error("Error cargando configuración:", err);
    }
  },

  /* -------------------------
     Guardar configuración
  ------------------------- */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      toast("Configuración guardada", "success");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      toast("No se pudo guardar la configuración", "error");
    }
  },

  /* -------------------------
     Aplicar state al formulario
  ------------------------- */
  applyToForm(form) {
    if (!form) return;

    form.querySelector("[name='empresaNombre']").value =
      this.state.empresaNombre || "";

    form.querySelector("[name='sucursalNombre']").value =
      this.state.sucursalNombre || "";

    form.querySelector("[name='monedaSimbolo']").value =
      this.state.monedaSimbolo || "";

    form.querySelector("[name='monedaCodigo']").value =
      this.state.monedaCodigo || "";

    form.querySelector("[name='ivaPorDefecto']").value =
      this.state.ivaPorDefecto ?? 21;

    form.querySelector("[name='mostrarCentavos']").checked =
      !!this.state.mostrarCentavos;

    form.querySelector("[name='numeracionAutomatica']").checked =
      !!this.state.numeracionAutomatica;
  },

  /* -------------------------
     Leer datos desde el form
  ------------------------- */
  readFromForm(form) {
    if (!form) return;

    const fd = new FormData(form);

    this.state.empresaNombre = (fd.get("empresaNombre") || "").toString();
    this.state.sucursalNombre = (fd.get("sucursalNombre") || "").toString();
    this.state.monedaSimbolo = (fd.get("monedaSimbolo") || "").toString();
    this.state.monedaCodigo = (fd.get("monedaCodigo") || "").toString();

    const iva = parseFloat(fd.get("ivaPorDefecto"));
    this.state.ivaPorDefecto = Number.isFinite(iva) ? iva : 21;

    this.state.mostrarCentavos = form.querySelector(
      "[name='mostrarCentavos']"
    ).checked;

    this.state.numeracionAutomatica = form.querySelector(
      "[name='numeracionAutomatica']"
    ).checked;
  },

  /* -------------------------
     Render de la sección
  ------------------------- */
  render(container) {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <h1 class="section-title">Configuración</h1>

      <div class="card">
        <h2 style="margin-bottom: 1rem;">Datos generales</h2>

        <form id="configForm" class="config-form">
          <div class="config-grid">
            <div class="config-field">
              <label>Nombre de la empresa</label>
              <input type="text" name="empresaNombre" placeholder="Farber Muebles" />
            </div>

            <div class="config-field">
              <label>Nombre de la sucursal</label>
              <input type="text" name="sucursalNombre" placeholder="Casa Central" />
            </div>

            <div class="config-field">
              <label>Símbolo de moneda</label>
              <input type="text" name="monedaSimbolo" maxlength="3" placeholder="$" />
            </div>

            <div class="config-field">
              <label>Código de moneda</label>
              <input type="text" name="monedaCodigo" maxlength="4" placeholder="ARS" />
            </div>

            <div class="config-field">
              <label>IVA por defecto (%)</label>
              <input type="number" name="ivaPorDefecto" min="0" max="100" step="0.1" />
            </div>

            <div class="config-field config-field--check">
              <label>
                <input type="checkbox" name="mostrarCentavos" />
                Mostrar centavos en los importes
              </label>
            </div>

            <div class="config-field config-field--check">
              <label>
                <input type="checkbox" name="numeracionAutomatica" />
                Numeración automática de presupuestos
              </label>
            </div>
          </div>

          <div style="margin-top: 1.5rem; display:flex; gap:0.75rem;">
            <button type="submit" class="btn btn-primary">Guardar cambios</button>
            <button type="button" id="configResetBtn" class="btn btn-light">
              Restaurar valores por defecto
            </button>
          </div>
        </form>
      </div>
    `;

    container.appendChild(wrapper);

    const form = wrapper.querySelector("#configForm");
    const resetBtn = wrapper.querySelector("#configResetBtn");

    // Cargar state actual y aplicarlo
    this.load();
    this.applyToForm(form);

    // Eventos
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.readFromForm(form);
      this.save();
    });

    resetBtn.addEventListener("click", () => {
      if (!window.confirm("¿Restaurar la configuración por defecto?")) return;
      this.state = {
        empresaNombre: "Farber Muebles",
        sucursalNombre: "Casa Central",
        monedaSimbolo: "$",
        monedaCodigo: "ARS",
        ivaPorDefecto: 21,
        mostrarCentavos: true,
        numeracionAutomatica: true
      };
      this.applyToForm(form);
      this.save();
    });
  },

  /* -------------------------
     init (se ejecuta tras render)
  ------------------------- */
  init() {
    // Por ahora no necesitamos lógica extra acá,
    // pero queda el hook preparado para más adelante.
  }
};

// Registrar módulo en el router SPA
registerModule("config", ConfigModule);
