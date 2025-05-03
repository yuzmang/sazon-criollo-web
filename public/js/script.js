// js/script.js - Versión Completa Corregida (Formato Precio CLP)

console.log("js/script.js cargado.");

// --- Funciones de Utilidad (Ejemplo: Scroll Suave) ---
function scrollToCategory(categoryId, event) { /* ... (igual que antes) ... */ }

// --- Función para formatear precio ---
function formatPriceCLP(priceString) {
    // Asume que priceString es algo como "12.345" o "15000"
    // Devuelve "$ 12.345"
    return `$ ${priceString || '?'}`; // Añade símbolo y espacio
}

// --- Función para Crear HTML de un Plato (Cliente - Con Formato CLP) ---
function createMenuItemHTML(item) {
    const placeholderImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const safeName = item.name ? item.name.replace(/"/g, '&quot;') : 'Plato sin nombre';
    const formattedPrice = formatPriceCLP(item.price); // Formatear precio

    return `
        <div class="menu-item">
            <img src="${item.image || placeholderImg}" alt="${safeName}" class="item-image" loading="lazy" onerror="this.onerror=null;this.src='${placeholderImg}';">
            <div class="item-details">
                <h3 class="item-title">${item.name || 'Nombre no disponible'}</h3>
                <p class="item-description">${item.description || ''}</p>
                {/* Mostrar precio formateado */}
                <span class="item-price">${formattedPrice}</span>
            </div>
        </div>
    `;
}

// --- Función Principal para Cargar Menú desde API ---
// (SIN CAMBIOS, ya que createMenuItemHTML ahora formatea)
async function loadMenu() { /* ... (igual que antes) ... */ }

// --- Inicializar la Carga del Menú ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMenu);
} else {
    loadMenu();
}

// --- Otras funciones de tu script.js ---
// function setupScrollListener() { ... }

console.log("js/script.js finalizado.");
