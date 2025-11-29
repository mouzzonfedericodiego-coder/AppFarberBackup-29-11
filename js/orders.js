/* ======================================================
   FARBER PANEL PRO
   Módulo: Pedidos (orders.js)
   Estilo: Módulo con estado interno (opción 3)
   Depende de: app.js (registerModule, toast, $, $$)
   ====================================================== */

const OrdersModule = {
  section: "orders",
  storageKey: "farber_orders",

  state: {
    items: [], // { id, number, clientName, createdISO, expectedISO, total, status, notes, itemsCount }
    filterStatus: "all",
  },

  /* -------------------------
     Cargar pedidos
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
      console.error("Error cargando pedidos:", err);
    }
  },

  /* -------------------------
     Guardar pedidos
  ------------------------- */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.items));
    } catch (err) {
      console.error("Error guardando pedidos:", err);
      toast("No se pudo guardar el pedido", "error");
    }
  },

  /* -------------------------
     Agregar un pedido nuevo
  ------------------------- */
  addOrder(data) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const today = new Date();
    const createdISO = data.createdISO || today.toISOString().slice(0, 10);

    const item = {
      id,
      number: data.number || this.generateNextNumber(),
      clientName: data.clientName || "Sin nombre",
      createdISO,
      expectedISO: data.expectedISO || "",
      total: Number(data.total) || 0,
      itemsCount: Number(data.itemsCount) || 0,
      status: data.status || "pending", // pending | arrived | delivered | canceled
      notes: data.notes || "",
    };

    this.state.items.push(item);
    this.save();

    // Opcional: registrar en historial si existe
    if (window.HistoryModule && typeof HistoryModule.addEntry === "function") {
      HistoryModule.addEntry({
        id: item.id,
        number: item.number,
        clientName: item.clientName,
        dateISO: item.createdISO,
        total: item.total,
        status: "ordered",
      });
      HistoryModule.save && HistoryModule.save();
    }

    toast("Pedido creado", "success");
  },

  /* -------------------------
     Generar número correlativo
  ------------------------- */
  generateNextNumber() {
    if (!this.state.items.length) return 1;
    const nums = this.state.items
      .map((i) => Number(i.number) || 0)
      .filter((n) => n > 0)
      .sort((a, b) => b - a);
    return (nums[0] || 0) + 1;
  },

  /* -------------------------
     Cambiar estado de un pedido
  ------------------------- */
  updateStatus(id, newStatus) {
    const item = this.state.items.find((i) => i.id === id);
    if (!item) return;

    item.status = newStatus;
    this.save();
    toast("Estado actualizado", "success");
  },

  /* -------------------------
     Borrar un pedido
  ------------------------- */
  deleteOrder(id) {
    const before = this.state.items.length;
    this.state.items = this.state.items.filter((i) => i.id !== id);
    if (this.state.items.length !== before) {
      this.save();
      toast("Pedido eliminado", "success");
    }
  },

  /* -------------------------
     Helpers de formato
  ------------------------- */
  formatDate(iso) {
    if (!iso) return "—";
    if (iso.includes("-")) {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    }
    return iso;
  },

  formatMoney(value) {
    const num = Number(value) || 0;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  },

  getStatusLabel(status) {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "arrived":
        return "Recibido en fábrica";
      case "delivered":
        return "Entregado al cliente";
      case "canceled":
        return "Cancelado";
      default:
        return "Otro";
    }
  },

  /* -------------------------
     Obtener lista filtrada
  ------------------------- */
  getFilteredItems() {
    return this.state.items.filter((item) => {
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
     Render de la tabla
  ------------------------- */
  renderTable(tbody) {
    const rows = this.getFilteredItems();

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; opacity:.7;">
            No hay pedidos registrados.
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
            <td>${this.formatDate(item.createdISO)}</td>
            <td>${this.formatDate(item.expectedISO)}</td>
            <td>${this.itemsCountToText(item.itemsCount)}</td>
            <td>${this.formatMoney(item.total)}</td>
            <td>
              <span class="history-status history-status--${item.status}">
                ${this.getStatusLabel(item.status)}
              </span>
            </td>
            <td>
              <div style="display:flex; gap:0.25rem; flex-wrap:wrap;">
                <button class="btn btn-light js-order-status" data-id="${item.id}" data-status="arrived">
                  Marcar recibido
                </button>
                <button class="btn btn-light js-order-status" data-id="${item.id}" data-status="delivered">
                  Entregado
                </button>
                <button class="btn btn-light js-order-status" data-id="${item.id}" data-status="canceled">
                  Cancelar
                </button>
                <button class="btn btn-light js-order-delete" data-id="${item.id}">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  },

  itemsCountToText(n) {
    const num = Number(n) || 0;
    if (!num) return "—";
    if (num === 1) return "1 ítem";
    return `${num} ítems`;
  },

  /* -------------------------
     Render principal del módulo
  ------------------------- */
  render(container) {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <h1 class="section-title">Pedidos</h1>

      <div class="card" style="margin-bottom:1.5rem;">
        <h2 style="margin-bottom: 1rem;">Alta rápida de pedido</h2>

        <form id="orderQuickForm" class="config-form">
          <div class="config-grid">
            <div class="config-field">
              <label>Cliente</label>
              <input type="text" name="clientName" placeholder="Nombre del cliente" required />
            </div>

            <div class="config-field">
              <label>Fecha esperada de entrega</label>
              <input type="date" name="expectedISO" />
            </div>

            <div class="config-field">
              <label>Total estimado</label>
              <input type="number" step="0.01" name="total" placeholder="0.00" />
            </div>

            <div class="config-field">
              <label>Cantidad de ítems</label>
              <input type="number" min="0" name="itemsCount" placeholder="0" />
            </div>

            <div class="config-field" style="grid-column:1 / -1;">
              <label>Notas</label>
              <textarea name="notes" rows="2" placeholder="Detalle del pedido, colores, medidas, etc."></textarea>
            </div>
          </div>

          <div style="margin-top: 1.2rem; display:flex; gap:0.75rem;">
            <button type="submit" class="btn btn-primary">Crear pedido</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="history-filters">
          <div class="history-filter">
            <label>Estado</label>
            <select id="ordersStatusFilter">
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="arrived">Recibidos</option>
              <option value="delivered">Entregados</option>
              <option value="canceled">Cancelados</option>
            </select>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Cliente</th>
                <th>Fecha pedido</th>
                <th>Entrega estimada</th>
                <th>Ítems</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
              <!-- filas renderizadas por JS -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const form = wrapper.querySelector("#orderQuickForm");
    const statusFilter = wrapper.querySelector("#ordersStatusFilter");
    const tbody = wrapper.querySelector("#ordersTableBody");

    // Cargar datos existentes
    this.load();

    // Aplicar filtro actual (si en el futuro lo persistimos)
    statusFilter.value = this.state.filterStatus;

    // Render inicial
    this.renderTable(tbody);

    // Evento crear pedido
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);

      const clientName = (fd.get("clientName") || "").toString().trim();
      if (!clientName) {
        toast("Ingresá el nombre del cliente", "error");
        return;
      }

      const expectedISO = (fd.get("expectedISO") || "").toString();
      const total = fd.get("total");
      const itemsCount = fd.get("itemsCount");
      const notes = (fd.get("notes") || "").toString();

      this.addOrder({
        clientName,
        expectedISO,
        total,
        itemsCount,
        notes,
      });

      // Reset form
      form.reset();

      // Render de tabla
      this.renderTable(tbody);
    });

    // Filtro de estado
    statusFilter.addEventListener("change", () => {
      this.state.filterStatus = statusFilter.value;
      this.renderTable(tbody);
    });

    // Acciones en tabla (delegación)
    tbody.addEventListener("click", (ev) => {
      const btnStatus = ev.target.closest(".js-order-status");
      const btnDelete = ev.target.closest(".js-order-delete");

      if (btnStatus) {
        const id = btnStatus.dataset.id;
        const newStatus = btnStatus.dataset.status;
        if (!id || !newStatus) return;
        this.updateStatus(id, newStatus);
        this.renderTable(tbody);
      }

      if (btnDelete) {
        const id = btnDelete.dataset.id;
        if (!id) return;
        if (!window.confirm("¿Eliminar este pedido?")) return;
        this.deleteOrder(id);
        this.renderTable(tbody);
      }
    });
  },

  /* -------------------------
     init (hook post-render)
  ------------------------- */
  init() {
    // Queda para lógica extra futura
  },
};

// Registrar módulo
registerModule("orders", OrdersModule);
