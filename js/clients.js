/* ======================================================
   FARBER PANEL PRO
   Módulo: Clientes (clients.js)
   Estilo: Módulo con estado interno (opción 3)
   Depende de: app.js (registerModule, toast, $, $$, createEl)
   ====================================================== */

const ClientsModule = {
  section: "clients",
  storageKey: "farber_clients",

  state: {
    list: [],      // [{ id, name, phone, email, address, notes, createdISO }]
    searchText: ""
  },

  /* -------------------------
     Cargar clientes
  ------------------------- */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.state.list = parsed;
      }
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  },

  /* -------------------------
     Guardar clientes
  ------------------------- */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.list));
    } catch (err) {
      console.error("Error guardando clientes:", err);
      toast("No se pudo guardar clientes", "error");
    }
  },

  /* -------------------------
     Agregar cliente
  ------------------------- */
  addClient(data) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const today = new Date().toISOString().slice(0, 10);

    const client = {
      id,
      name: (data.name || "").toString(),
      phone: (data.phone || "").toString(),
      email: (data.email || "").toString(),
      address: (data.address || "").toString(),
      notes: (data.notes || "").toString(),
      createdISO: today
    };

    this.state.list.push(client);
    this.save();
    toast("Cliente agregado", "success");
  },

  /* -------------------------
     Actualizar cliente
  ------------------------- */
  updateClient(id, data) {
    const client = this.state.list.find((c) => c.id === id);
    if (!client) return;

    client.name = (data.name || "").toString();
    client.phone = (data.phone || "").toString();
    client.email = (data.email || "").toString();
    client.address = (data.address || "").toString();
    client.notes = (data.notes || "").toString();

    this.save();
    toast("Cliente actualizado", "success");
  },

  /* -------------------------
     Eliminar cliente
  ------------------------- */
  deleteClient(id) {
    const before = this.state.list.length;
    this.state.list = this.state.list.filter((c) => c.id !== id);
    if (this.state.list.length !== before) {
      this.save();
      toast("Cliente eliminado", "success");
    }
  },

  /* -------------------------
     Formatear fecha
  ------------------------- */
  formatDate(iso) {
    if (!iso) return "—";
    if (iso.includes("-")) {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    }
    return iso;
  },

  /* -------------------------
     Lista filtrada por búsqueda
  ------------------------- */
  getFilteredList() {
    const txt = this.state.searchText.trim().toLowerCase();
    if (!txt) return this.state.list;

    return this.state.list.filter((c) => {
      return (
        (c.name || "").toLowerCase().includes(txt) ||
        (c.phone || "").toLowerCase().includes(txt) ||
        (c.email || "").toLowerCase().includes(txt)
      );
    });
  },

  /* -------------------------
     Render tabla
  ------------------------- */
  renderTable(tbody) {
    const list = this.getFilteredList();

    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; opacity:.7;">
            No hay clientes cargados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list
      .map((c) => {
        return `
          <tr data-id="${c.id}">
            <td>${c.name || "—"}</td>
            <td>${c.phone || "—"}</td>
            <td>${c.email || "—"}</td>
            <td>${c.address || "—"}</td>
            <td>${this.formatDate(c.createdISO)}</td>
            <td>
              <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                <button class="btn btn-light js-client-edit" data-id="${c.id}">
                  Editar
                </button>
                <button class="btn btn-light js-client-delete" data-id="${c.id}">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  },

  /* -------------------------
     Llenar formulario (modo edición)
  ------------------------- */
  fillForm(form, client) {
    if (!form || !client) return;
    form.querySelector("[name='name']").value = client.name || "";
    form.querySelector("[name='phone']").value = client.phone || "";
    form.querySelector("[name='email']").value = client.email || "";
    form.querySelector("[name='address']").value = client.address || "";
    form.querySelector("[name='notes']").value = client.notes || "";
  },

  clearForm(form) {
    if (!form) return;
    form.reset();
    const idField = form.querySelector("[name='clientId']");
    if (idField) idField.value = "";
  },

  /* -------------------------
     Render principal
  ------------------------- */
  render(container) {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <h1 class="section-title">Clientes</h1>

      <div class="card" style="margin-bottom:1.5rem;">
        <h2 style="margin-bottom:1rem;">Alta / edición de cliente</h2>

        <form id="clientForm" class="config-form">
          <input type="hidden" name="clientId" />

          <div class="config-grid">
            <div class="config-field">
              <label>Nombre completo</label>
              <input type="text" name="name" placeholder="Ej: Juan Pérez" required />
            </div>

            <div class="config-field">
              <label>Teléfono</label>
              <input type="text" name="phone" placeholder="Ej: 11 1234-5678" />
            </div>

            <div class="config-field">
              <label>Email</label>
              <input type="email" name="email" placeholder="cliente@ejemplo.com" />
            </div>

            <div class="config-field">
              <label>Dirección</label>
              <input type="text" name="address" placeholder="Calle, número, ciudad" />
            </div>

            <div class="config-field" style="grid-column:1 / -1;">
              <label>Notas</label>
              <textarea name="notes" rows="2" placeholder="Observaciones, preferencias de diseño, colores, etc."></textarea>
            </div>
          </div>

          <div style="margin-top:1.2rem; display:flex; gap:0.75rem;">
            <button type="submit" class="btn btn-primary" id="clientSubmitBtn">
              Guardar cliente
            </button>
            <button type="button" class="btn btn-light" id="clientResetBtn">
              Limpiar formulario
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
          <h2>Listado de clientes</h2>

          <div style="max-width:260px; width:100%;">
            <input
              type="text"
              id="clientSearch"
              placeholder="Buscar por nombre, teléfono o email..."
            />
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Alta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="clientsTableBody">
              <!-- filas desde JS -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const form = wrapper.querySelector("#clientForm");
    const submitBtn = wrapper.querySelector("#clientSubmitBtn");
    const resetBtn = wrapper.querySelector("#clientResetBtn");
    const searchInput = wrapper.querySelector("#clientSearch");
    const tbody = wrapper.querySelector("#clientsTableBody");

    // Cargar datos
    this.load();

    // Render inicial tabla
    this.renderTable(tbody);

    // Manejo submit (alta / edición)
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);

      const id = (fd.get("clientId") || "").toString();
      const name = (fd.get("name") || "").toString().trim();

      if (!name) {
        toast("Ingresá el nombre del cliente", "error");
        return;
      }

      const payload = {
        name,
        phone: fd.get("phone"),
        email: fd.get("email"),
        address: fd.get("address"),
        notes: fd.get("notes")
      };

      if (id) {
        this.updateClient(id, payload);
      } else {
        this.addClient(payload);
      }

      this.clearForm(form);
      submitBtn.textContent = "Guardar cliente";
      this.renderTable(tbody);
    });

    // Botón limpiar
    resetBtn.addEventListener("click", () => {
      this.clearForm(form);
      submitBtn.textContent = "Guardar cliente";
    });

    // Búsqueda
    searchInput.addEventListener("input", () => {
      this.state.searchText = searchInput.value || "";
      this.renderTable(tbody);
    });

    // Acciones en la tabla (delegación)
    tbody.addEventListener("click", (ev) => {
      const btnEdit = ev.target.closest(".js-client-edit");
      const btnDelete = ev.target.closest(".js-client-delete");

      if (btnEdit) {
        const id = btnEdit.dataset.id;
        const client = this.state.list.find((c) => c.id === id);
        if (!client) return;

        this.fillForm(form, client);
        form.querySelector("[name='clientId']").value = client.id;
        submitBtn.textContent = "Actualizar cliente";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (btnDelete) {
        const id = btnDelete.dataset.id;
        if (!id) return;
        if (!window.confirm("¿Eliminar este cliente?")) return;
        this.deleteClient(id);
        this.renderTable(tbody);
      }
    });
  },

  /* -------------------------
     init (hook post-render)
  ------------------------- */
  init() {
    // Por ahora no hay lógica extra al iniciar,
    // pero queda el hook preparado.
  }
};

// Registrar módulo en el SPA
registerModule("clients", ClientsModule);
