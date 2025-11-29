/* ======================================================
   FARBER PANEL PRO
   Módulo: Presupuestos (budgets.js)
   Estilo PRO (opción 3)
   ====================================================== */

const BudgetsModule = {
  section: "budgets",
  storageKey: "farber_budgets",

  state: {
    list: [],
    filterStatus: "all",
    searchText: ""
  },

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      this.state.list = JSON.parse(raw) || [];
    } catch (err) {
      console.error("Error cargando presupuestos:", err);
    }
  },

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.list));
    } catch (err) {
      console.error("Error guardando presupuestos:", err);
      toast("Error guardando presupuesto", "error");
    }
  },

  addBudget(data) {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now();
    const today = new Date().toISOString().slice(0, 10);

    const budget = {
      id,
      number: this.getNextNumber(),
      clientName: data.clientName || "Sin cliente",
      dateISO: today,
      itemsCount: data.itemsCount || 0,
      total: data.total || 0,
      status: "draft" // draft / sent / approved / rejected / ordered
    };

    this.state.list.push(budget);
    this.save();

    // Registrar en historial si está disponible
    if (window.HistoryModule) {
      HistoryModule.addEntry({
        id: budget.id,
        number: budget.number,
        clientName: budget.clientName,
        dateISO: budget.dateISO,
        total: budget.total,
        status: "draft"
      });
      HistoryModule.save();
    }

    toast("Presupuesto creado", "success");
  },

  getNextNumber() {
    if (!this.state.list.length) return 1;
    const nums = this.state.list.map((b) => Number(b.number) || 0);
    return Math.max(...nums) + 1;
  },

  updateStatus(id, newStatus) {
    const b = this.state.list.find((x) => x.id === id);
    if (!b) return;
    b.status = newStatus;
    this.save();
  },

  deleteBudget(id) {
    this.state.list = this.state.list.filter((b) => b.id !== id);
    this.save();
  },

  filtered() {
    return this.state.list.filter((b) => {
      if (this.state.filterStatus !== "all" && b.status !== this.state.filterStatus)
        return false;
      if (this.state.searchText &&
          !b.clientName.toLowerCase().includes(this.state.searchText.toLowerCase()))
        return false;
      return true;
    });
  },

  renderTable(tbody) {
    const rows = this.filtered();

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; opacity:.7;">
            No hay presupuestos.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = rows
      .map((b) => `
        <tr>
          <td>${b.number}</td>
          <td>${b.clientName}</td>
          <td>${b.dateISO}</td>
          <td>${b.itemsCount}</td>
          <td>$${b.total.toFixed(2)}</td>
          <td>${this.formatStatus(b.status)}</td>
          <td>
            <button class="btn btn-light js-status" data-id="${b.id}" data-status="sent">Enviar</button>
            <button class="btn btn-light js-status" data-id="${b.id}" data-status="approved">Aprobar</button>
            <button class="btn btn-light js-status" data-id="${b.id}" data-status="ordered">Pedido</button>
            <button class="btn btn-light js-delete" data-id="${b.id}">Eliminar</button>
          </td>
        </tr>
      `)
      .join("");
  },

  formatStatus(s) {
    const map = {
      draft: "Borrador",
      sent: "Enviado",
      approved: "Aprobado",
      rejected: "Rechazado",
      ordered: "Convertido en pedido"
    };
    return map[s] || s;
  },

  render(container) {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <h1 class="section-title">Presupuestos</h1>

      <div class="card" style="margin-bottom:1.5rem;">
        <h2>Crear presupuesto rápido</h2>

        <form id="budgetForm" style="margin-top:1rem;">
          <input name="clientName" placeholder="Cliente" required />
          <input type="number" step="1" name="itemsCount" placeholder="Cantidad ítems" required />
          <input type="number" step="0.01" name="total" placeholder="Total ARS" required />

          <button class="btn btn-primary" style="margin-top:0.7rem;">Crear</button>
        </form>
      </div>

      <div class="card">
        <div style="display:flex; gap:1rem; margin-bottom:1rem;">
          <input id="budgetSearch" placeholder="Buscar por cliente..." style="width:250px;" />
          <select id="budgetFilter" style="width:250px;">
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviado</option>
            <option value="approved">Aprobado</option>
            <option value="ordered">Convertido en pedido</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Ítems</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="budgetTableBody"></tbody>
        </table>
      </div>
    `;

    container.appendChild(wrapper);

    const form = wrapper.querySelector("#budgetForm");
    const tbody = wrapper.querySelector("#budgetTableBody");
    const search = wrapper.querySelector("#budgetSearch");
    const filter = wrapper.querySelector("#budgetFilter");

    this.load();
    this.renderTable(tbody);

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);

      this.addBudget({
        clientName: fd.get("clientName"),
        itemsCount: Number(fd.get("itemsCount")),
        total: Number(fd.get("total"))
      });

      form.reset();
      this.renderTable(tbody);
    });

    search.addEventListener("input", () => {
      this.state.searchText = search.value;
      this.renderTable(tbody);
    });

    filter.addEventListener("change", () => {
      this.state.filterStatus = filter.value;
      this.renderTable(tbody);
    });

    tbody.addEventListener("click", (ev) => {
      const sBtn = ev.target.closest(".js-status");
      const dBtn = ev.target.closest(".js-delete");

      if (sBtn) {
        this.updateStatus(sBtn.dataset.id, sBtn.dataset.status);
        this.renderTable(tbody);
      }

      if (dBtn) {
        if (!confirm("¿Eliminar este presupuesto?")) return;
        this.deleteBudget(dBtn.dataset.id);
        this.renderTable(tbody);
      }
    });
  },

  init() {}
};

registerModule("budgets", BudgetsModule);
