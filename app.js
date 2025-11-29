/* ======================================================
   FARBER PANEL PRO - APP.JS
   SPA Router / Loader / Module Manager / UI Core
   ====================================================== */

/* ------------------------------------------------------
   1) LOADER FARBER PRO
------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("appLoader");
    if (!loader) return;

    // Mantener visible para ver la animación PRO
    setTimeout(() => {
        loader.classList.add("loader--hide");

        // Eliminar del DOM al finalizar fade-out
        setTimeout(() => loader.remove(), 900);

    }, 2200);
});


/* ------------------------------------------------------
   2) SISTEMA DE MÓDULOS (REGISTRO GLOBAL)
------------------------------------------------------ */

const Modules = {};  // Aquí se registran todos los módulos

function registerModule(name, moduleObj) {
    Modules[name] = moduleObj;
}

/* ------------------------------------------------------
   3) ROUTER PRINCIPAL DEL SPA
------------------------------------------------------ */

let currentSection = "dashboard";

function navigateTo(section) {
    if (!Modules[section]) {
        console.error("❌ Módulo no encontrado:", section);
        return;
    }

    currentSection = section;

    // Actualizar sidebar UI
    updateSidebarActive(section);

    // Renderizar contenido
    const main = document.getElementById("mainContent");
    main.innerHTML = ""; // limpiar
    Modules[section].render(main);

    // Ejecutar lógica interna de cada módulo
    if (Modules[section].init) {
        Modules[section].init();
    }
}

/* ------------------------------------------------------
   4) ACTIVAR LINKS DEL SIDEBAR
------------------------------------------------------ */

function setupSidebarNavigation() {
    const links = document.querySelectorAll(".js-nav");

    links.forEach(link => {
        link.addEventListener("click", (ev) => {
            ev.preventDefault();

            const section = link.dataset.section;
            navigateTo(section);
        });
    });
}

function updateSidebarActive(activeSection) {
    document.querySelectorAll(".sidebar__link").forEach(link => {
        link.classList.remove("active");
        if (link.dataset.section === activeSection) {
            link.classList.add("active");
        }
    });
}


/* ------------------------------------------------------
   5) ARRANQUE DEL SISTEMA
------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
    setupSidebarNavigation();
    navigateTo("dashboard");   // Primera vista
});


/* ------------------------------------------------------
   6) HELPERS GLOBALES (DISPONIBLES PARA TODOS LOS MÓDULOS)
------------------------------------------------------ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function createEl(tag, opts = {}) {
    const el = document.createElement(tag);
    if (opts.class) el.className = opts.class;
    if (opts.text) el.textContent = opts.text;
    if (opts.html) el.innerHTML = opts.html;
    return el;
}

function toast(msg, type = "default") {
    const div = createEl("div", { class: `toast toast--${type}`, text: msg });

    document.body.appendChild(div);

    setTimeout(() => {
        div.classList.add("visible");
    }, 20);

    setTimeout(() => {
        div.classList.remove("visible");
        setTimeout(() => div.remove(), 400);
    }, 2400);
}


/* ------------------------------------------------------
   7) PLANTILLA DE MÓDULO BASE (PARA REFERENCIA)
------------------------------------------------------ */

const Dashboard = {
    section: "dashboard",
    render(container) {
        container.innerHTML = `
            <h1 class="section-title">Dashboard</h1>
            <div class="card">Bienvenido al Panel Profesional FARBER.</div>
        `;
    },
    init() {
        // procesos del dashboard si los necesitás
    }
};

// Registrar
registerModule("dashboard", Dashboard);

/* ======================================================
   FIN DEL ARCHIVO APP.JS
   ====================================================== */
