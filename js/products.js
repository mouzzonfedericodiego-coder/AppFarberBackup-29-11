/* ======================================================
   FARBER PANEL PRO
   Módulo: Productos (products.js)
   Estilo: Módulo con estado interno (opción 3)
   ====================================================== */

const ProductsModule = {
  section: "products",
  storageKey: "farber_products",

  state: {
    list: [],      // { id, name, price, category, description }
    searchText: "",
    filterCategory: "all"
  },

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) this.state.list = parsed;
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  },

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.list));
    } catch (err) {
      console.error("Error guardando productos:", err);
      toast("No se pudo guardar productos", "error");
    }
  },

  addProduct(data) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const product = {
      id,
      name: (data.name || "").toString(),
      price: Number(data.price) || 0,
      category: (data.category || "General").toString(),
      description: (data.description || "").toString()
    };

    this.state.list.push(product);
    this.save();
    toast("Producto agregado", "success");
  },

  updateProduct(id, data) {
    const p = this.state.list.find((x) => x.id === id);
    if (!p) return;

    p.name = data.name;
    p.price = Number(data.price) || 0;
    p.category = data.category;
    p.description = data.description;

    this.save();
    toast("Producto actualizado", "success");
  },

  deleteProduct(id) {
    const before = this.state.list.length;
    this.state.list = this.state.list.filter((p) => p.id !== id);
    if (this.state.list.length !== before) {
      this.save();
      toast("Producto eliminado", "success");
    }
  },

  getFiltered() {
    const txt = this.state.searchText.toLowerCase();
    return this.state.list.filter((p) => {
      if (this.state.filterCategory !== "all" && p.category !== this.state.filterCategory) {
        return false;
      }
      return (
        p.name.toLowerCase().includes(txt) ||
        p.category.toLowerCase().includes(txt)
      );
    });
  },

  renderTable(tbody) {
    const list = this.getFiltered();

    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; opacity:.7;">
            No hay productos.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((p) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>$${p.price.toFixed(2)}</td>
          <td>${p.description || "—"}</td>
          <td>
            <button class="btn btn-light js-edit" data-id="${p.id}">Editar</button>
            <button class="btn btn-light js-del" data-id="${p.id}">Eliminar</button>
          </td>
        </tr>
      `)
      .join("");
  },

  render(container) {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <h1 class="section-title">Productos</h1>

      <div class="card" style="margin-bottom:1.5rem;">
        <h2>Agregar / editar producto</h2>

        <form id="prodForm" class="config-form" style="margin-top:1rem;">
          <input type="hidden" name="productId" />

          <div class="config-grid">
            <div class="config-field">
              <label>Nombre</label>
              <input name="name" placeholder="Ej: Mueble TV" required />
            </div>

            <div class="config-field">
              <label>Precio (ARS)</label>
              <input type="number" step="0.01" name="price" required />
            </div>

            <div class="config-field">
              <label>Categoría</label>
              <input name="category" placeholder="Ej: Mobiliario" />
            </div>

            <div class="config-field" style="grid-column:1/-1;">
              <label>Descripción</label>
              <textarea name="description" rows="2"></textarea>
            </div>
          </div>

          <div style="margin-top:1rem; display:flex; gap:0.5rem;">
            <button class="btn btn-primary">Guardar</button>
            <button type="button" id="prodReset" class="btn btn-light">Limpiar</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.7rem;">
          <input id="prodSearch" placeholder="Buscar productos..." style="width:250px;" />
          <select id="prodCatFilter" style="width:200px;">
            <option value="all">Todas las categorías</option>
          </select>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="prodTable"></tbody>
        </table>
      </div>
    `;

    container.appendChild(wrapper);

    const form = wrapper.querySelector("#prodForm");
    const resetBtn = wrapper.querySelector("#prodReset");
    const tbody = wrapper.querySelector("#prodTable");
    const search = wrapper.querySelector("#prodSearch");
    const catFilter = wrapper.querySelector("#prodCatFilter");

    this.load();

    // Poblar categorías
    const cats = [...new Set(this.state.list.map((p) => p.category))];
    cats.forEach((c) => {
      if (!c) return;
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      catFilter.appendChild(opt);
    });

    this.renderTable(tbody);

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const id = fd.get("productId");
      const product = {
        name: fd.get("name"),
        price: fd.get("price"),
        category: fd.get("category"),
        description: fd.get("description")
      };

      if (id) this.updateProduct(id, product);
      else this.addProduct(product);

      form.reset();
      this.renderTable(tbody);
    });

    resetBtn.addEventListener("click", () => form.reset());

    search.addEventListener("input", () => {
      this.state.searchText = search.value;
      this.renderTable(tbody);
    });

    catFilter.addEventListener("change", () => {
      this.state.filterCategory = catFilter.value;
      this.renderTable(tbody);
    });

    tbody.addEventListener("click", (ev) => {
      const edit = ev.target.closest(".js-edit");
      const del = ev.target.closest(".js-del");

      if (edit) {
        const p = this.state.list.find((x) => x.id === edit.dataset.id);
        if (!p) return;
        form.productId.value = p.id;
        form.name.value = p.name;
        form.price.value = p.price;
        form.category.value = p.category;
        form.description.value = p.description;
      }

      if (del) {
        if (!confirm("¿Eliminar producto?")) return;
        this.deleteProduct(del.dataset.id);
        this.renderTable(tbody);
      }
    });
  },

  init() {}
};

registerModule("products", ProductsModule);
