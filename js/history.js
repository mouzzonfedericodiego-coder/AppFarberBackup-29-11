/* ======================================================
   FARBER PANEL PRO
   Módulo: Historial (history.js)
   Estilo: Módulo con estado interno (opción 3)
   Depende de: app.js (registerModule, toast, $, $$)
   ====================================================== */

const HistoryModule = {
  section: "history",
  storageKey: "farber_history", // se puede alinear luego con BudgetsModule

  state: {
    items: [], // cada item: { id, number, clientName, dateISO, total, status }
    filterClient: "all",
    filterStatus: "all"
  },

  /* -------------------------
     Cargar historial
  ------------------------- */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.state.items = parsed;
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  },

  /* -------------------------
     Guardar historial
     (lo usará BudgetsModule/OrdersModule)
  ------------------------- */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.items));
    } catch (err) {
      console.error("Error guardando historial:", err);
    }
  },

  /* -------------------------
     Recibir nuevos registros
     (para usar desde otros módulos)
  ------------------------- */
  addEntry(entry) {
    // entry: { id, number, clientName, dateISO, total, status }
    if (!entry || !entry.id) return;
    this.state.items.push(entry);
    this.save();
  },

  /* -------------------------
     Formatear fecha
  ------------------------- */
  formatDate(iso) {
    if (!iso) return "—";
    // si viene en formato yyyy-mm-dd
    if (iso.includes("-")) {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    }
    return iso;
  },

  /* -------------------------
     Formatear dinero
  ------------------------- */
  formatMoney(value) {
    const num = Number(value) || 0;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  },

  /* -------------------------
     Obtener lista filtrada
  ------------------------- */
  getFilteredItems() {
    return this.state.items.filter((item) => {
      if (
        this.state.filterClient !== "all" &&
        item.clientName !== this.state.filterClient
      ) {
        return false;
      }

      if (
        this.state.filterStatus !== "all" &&
        item.status !== this.state.filterStatus
      ) {
        return false;
      }

      return true;
    });
  },

  /* -------------------------
     Renderizar tabla
  ------------------------- */
  renderTable(tbody) {
    const rows = this.getFilteredItems();

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; opacity:.7;">
            No hay registros en el historial.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rows
      .map((item) => {
        return `
          <tr>
            <td>${item.number || "—"}</td>
            <td>${item.clientName || "Sin nombre"}</td>
            <td>${this.formatDate(item.dateISO)}</td>
            <td>${this.formatMoney(item.total || 0)}</td>
            <td>
              <span class="history-status history-status--${item.status || "otro"}">
                ${this.getStatusLabel(item.status)}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  },

  /* -------------------------
     Etiqueta legible de estado
  ------------------------- */
  getStatusLabel(status) {
    switch (status) {
      case "draft":
        return "Borrador";
      case "sent":
        return "Enviado";
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      case "ordered":
        return "Convertido en pedido";
      default:
        return "Otro";
    }
  },

  /* -------------------------
     Render principal del módulo
  ------------------------- */
  render(container) {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <h1 class="section-title">Historial de presupuestos</h1>

      <div class="card">
        <div class="history-filters">
          <div class="history-filter">
            <label>Cliente</label>
            <select id="historyClientFilter">
              <option value="all">Todos</option>
            </select>
          </div>

          <div class="history-filter">
            <label>Estado</label>
            <select id="historyStatusFilter">
              <option value="all">Todos</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviado</option>
              <option value="approved">Aprobado</option>
              <option value="ordered">Convertido en pedido</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody id="historyTableBody">
              <!-- filas renderizadas vía JS -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const clientSelect = wrapper.querySelector("#historyClientFilter");
    const statusSelect = wrapper.querySelector("#historyStatusFilter");
    const tbody = wrapper.querySelector("#historyTableBody");

    // Cargar datos desde localStorage
    this.load();

    // Inicializar combos
    this.populateClientFilter(clientSelect);

    // Aplicar filtros actuales (por si más adelante persistimos filtros)
    clientSelect.value = this.state.filterClient;
    statusSelect.value = this.state.filterStatus;

    // Render inicial de la tabla
    this.renderTable(tbody);

    // Eventos de filtros
    clientSelect.addEventListener("change", () => {
      this.state.filterClient = clientSelect.value;
      this.renderTable(tbody);
    });

    statusSelect.addEventListener("change", () => {
      this.state.filterStatus = statusSelect.value;
      this.renderTable(tbody);
    });
  },

  /* -------------------------
     Llenar combo de clientes
  ------------------------- */
  populateClientFilter(selectEl) {
    if (!selectEl) return;

    const names = Array.from(
      new Set(this.state.items.map((i) => i.clientName).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es"));

    names.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      selectEl.appendChild(opt);
    });
  },

  /* -------------------------
     init (hook post-render)
  ------------------------- */
  init() {
    // Por ahora no requiere lógica extra,
    // pero queda el espacio para futuros features.
  }
};

// Registrar módulo
registerModule("history", HistoryModule);
