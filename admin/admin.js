// admin.js

console.log('¡Script de administración cargado!');

const existingDishesContainer = document.getElementById('existing-dishes-container');
const addDishForm = document.getElementById('add-dish-form');
const existingCategoriesContainer = document.getElementById('existing-categories-container'); // Nuevo contenedor para categorías

// --- Parte 1: Cargar y Mostrar Platos Existentes ---

// Función para crear el HTML de un solo plato en la vista de administración
// --- MEJORA: Añadir símbolo $ al precio ---
function createAdminMenuItemHTML(item, categoryId) {
    const itemId = item.name.replace(/\s+/g, '-').toLowerCase();

    // Asegurarse de que el precio se muestre con $
    // Verifica si ya empieza con '$' o 'S/' para no duplicar o mezclar símbolos
    let displayPrice = item.price;
    if (typeof displayPrice === 'string') { // Asegurar que es un string antes de usar startsWith
        if (!displayPrice.startsWith('$') && !displayPrice.startsWith('S/')) {
             displayPrice = `$ ${item.price}`;
        } else if (displayPrice.startsWith('S/')) {
             displayPrice = displayPrice.replace('S/', '$'); // Reemplaza S/ por $ si ya lo tenía
        }
    } else { // Si no es string, asumir que es un número y agregar $
        displayPrice = `$ ${item.price}`;
    }


    return `
        <div class="admin-menu-item" data-id="${itemId}" data-category="${categoryId}">

            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="admin-item-image">` : ''}

            <div class="admin-item-info">
                <h3 class="admin-item-name">${item.name}</h3>
                <p class="admin-item-desc">${item.description}</p>
                <span class="admin-item-price">${displayPrice}</span> {/* Usamos el precio con $ */}
            </div>

            <div class="admin-item-actions">
                <button class="edit-btn" data-id="${itemId}" data-category="${categoryId}">Editar</button>
                <button class="delete-btn" data-id="${itemId}" data-category="${categoryId}">Eliminar</button>
            </div>
        </div>
    `;
}

// Función principal para cargar el menú y mostrar los platos en la administración
async function loadAdminMenu() {
    // Mantenemos el console.log para depuración
    console.log('Valor de existingDishesContainer:', existingDishesContainer);

    if (!existingDishesContainer) {
        console.error("Error: El elemento con ID 'existing-dishes-container' no fue encontrado en el DOM.");
        // Considera mostrar un mensaje de error visible al usuario aquí
        return;
    }

    existingDishesContainer.innerHTML = '<p>Cargando platos...</p>';

    try {
        // La ruta a menu.json debería ser correcta si tu servidor Node.js lo sirve correctamente
        // Asegúrate que tu server.js sirva menu.json desde http://localhost:3000/menu.json
        const response = await fetch('/menu.json'); // Probablemente necesites la ruta absoluta si server.js lo sirve desde la raíz
        if (!response.ok) {
            // Si el servidor Node.js devuelve 404 o otro error
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const menuData = await response.json(); // menuData es un array de categorías

        existingDishesContainer.innerHTML = ''; // Limpiar mensaje de carga

        if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
             existingDishesContainer.innerHTML = '<p>No hay platos en el menú o el formato es incorrecto.</p>';
             console.error("menu.json está vacío, no es un array, o es null:", menuData);
             return;
        }

        menuData.forEach(category => {
             // Opcional: Mostrar el título de la categoría antes de sus platos
             // existingDishesContainer.insertAdjacentHTML('beforeend', `<h3>${category.title}</h3>`);

            if (category.items && Array.isArray(category.items) && category.items.length > 0) {
                category.items.forEach(item => {
                    const menuItemHTML = createAdminMenuItemHTML(item, category.id);
                    existingDishesContainer.insertAdjacentHTML('beforeend', menuItemHTML);
                });
            } else {
                 // Opcional: Mensaje si una categoría no tiene ítems
                 // existingDishesContainer.insertAdjacentHTML('beforeend', `<p>No hay platos en la categoría "${category.title}".</p>`);
            }
        });

        setupDishActionButtons(); // Función para configurar botones de platos

    } catch (error) {
        console.error('Error al cargar los platos para administración:', error);
         // Usar el contenedor si no es null para mostrar el error
        if (existingDishesContainer) {
            existingDishesContainer.innerHTML = '<p style="color: red;">Error al cargar los platos. Verifique la consola para más detalles.</p>';
        }
    }
}

// Configurar event listeners para botones de platos
function setupDishActionButtons() {
     if (!existingDishesContainer) return;
     // Eliminar listeners anteriores para evitar duplicados
    existingDishesContainer.removeEventListener('click', handleDishActionClick);
    // Agregar el listener
    existingDishesContainer.addEventListener('click', handleDishActionClick);
}

// Manejador unificado para clics en botones de plato (Eliminar/Editar)
function handleDishActionClick(event) {
    const button = event.target;

    // Si el clic fue en un botón de eliminar plato
    if (button.classList.contains('delete-btn')) {
        const menuItemElement = button.closest('.admin-menu-item');
        if (menuItemElement) {
            const dishId = menuItemElement.dataset.id;
            const categoryId = menuItemElement.dataset.category;
            const dishName = menuItemElement.querySelector('.admin-item-name').textContent;

            if (confirm(`¿Estás seguro de eliminar el plato "${dishName}"?`)) {
                console.log(`Solicitud para eliminar plato con ID "${dishId}" de la categoría "${categoryId}"`);
                // --- Lógica de eliminación con BACKEND (tu server.js) iría aquí ---
                // Deberías enviar una petición al servidor (ej: DELETE /api/dishes/:id)
                alert(`Solicitud de eliminación para "${dishName}" procesada. (Implementar lógica en server.js)`);
                menuItemElement.remove(); // Solo visualmente hasta que el backend confirme
            }
        }
    }
    // Si el clic fue en un botón de editar plato
    else if (button.classList.contains('edit-btn')) {
        const menuItemElement = button.closest('.admin-menu-item');
        if (menuItemElement) {
            const dishId = menuItemElement.dataset.id;
            const categoryId = menuItemElement.dataset.category;
             // Obtener los datos actuales del plato
            const dishName = menuItemElement.querySelector('.admin-item-name').textContent;
            const dishDescription = menuItemElement.querySelector('.admin-item-desc').textContent;
            const dishPrice = menuItemElement.querySelector('.admin-item-price').textContent; // Tendrá '$ '
            const dishImage = menuItemElement.querySelector('.admin-item-image')?.src || '';

            console.log(`Solicitud para editar plato con ID "${dishId}" de la categoría "${categoryId}". Datos:`, {name: dishName, description: dishDescription, price: dishPrice, image: dishImage});
            alert(`Funcionalidad de edición para "${dishName}" (Solo frontend). Implementar lógica en server.js para guardar.`);

            // --- Lógica para abrir un formulario de edición (quizás una modal) y llenarlo iría aquí ---
            // Luego, al enviar el formulario, enviar una petición al servidor (ej: PUT /api/dishes/:id)
        }
    }
}


// --- Parte 2: Manejar el Formulario de Agregar Plato ---

addDishForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const categoryId = document.getElementById('dish-category').value.trim();
    const name = document.getElementById('dish-name').value.trim();
    const description = document.getElementById('dish-description').value.trim();
    const price = document.getElementById('dish-price').value.trim(); // Obtiene el precio sin el símbolo de la moneda
    const image = document.getElementById('dish-image').value.trim();

    if (!categoryId || !name || !description || !price) {
        alert('Por favor, complete al menos los campos obligatorios.');
        return;
    }

     // Puedes validar que el precio sea un número si quieres
     // if (isNaN(parseFloat(price))) { alert('El precio debe ser un número válido.'); return; }


    const newDishData = {
        // En un sistema real, el backend generaría un ID único
        name: name,
        description: description,
        price: price, // Guarda el precio como número o string sin símbolo, según lo maneje tu backend
        image: image
    };

    console.log('Datos del nuevo plato (listos para enviar a server.js):', newDishData);
    console.log('Categoría seleccionada:', categoryId);

    // --- Lógica de envío a BACKEND (tu server.js) iría aquí ---
    // Deberías enviar una petición al servidor (ej: POST /api/dishes)
     alert('Datos del plato listos para enviar a server.js. (Implementar lógica en server.js para recibir y guardar)');
     addDishForm.reset();
     // Si el backend confirma el éxito, puedes recargar la lista o añadir el plato visualmente:
     // loadAdminMenu();
});


// --- Parte 3: Gestionar Categorías (Frontend Placeholder) ---

// Función para crear el HTML de un solo ítem de categoría
function createAdminCategoryItemHTML(category) {
    const categoryId = category.id;
    const categoryTitle = category.title;

    return `
        <div class="admin-category-item" data-id="${categoryId}">
            <h3>${categoryTitle} (ID: ${categoryId})</h3> {/* Muestra título e ID */}
            <div class="admin-category-actions">
                <button class="edit-cat-btn" data-id="${categoryId}">Editar</button>
                <button class="delete-cat-btn" data-id="${categoryId}">Eliminar</button>
            </div>
        </div>
    `;
}

// Función para cargar y mostrar las categorías
async function loadAdminCategories() {
    // Mantenemos el console.log para depuración
    console.log('Valor de existingCategoriesContainer:', existingCategoriesContainer);

     if (!existingCategoriesContainer) {
        console.error("Error: El elemento con ID 'existing-categories-container' no fue encontrado en el DOM.");
        return;
    }

    existingCategoriesContainer.innerHTML = '<p>Cargando categorías...</p>';

    try {
        // La ruta a menu.json debería ser correcta si tu servidor Node.js lo sirve
        // Probablemente necesites la ruta absoluta si server.js lo sirve desde la raíz
        const response = await fetch('/menu.json'); // La misma fuente de datos
        if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        const menuData = await response.json(); // menuData es un array de categorías

        existingCategoriesContainer.innerHTML = ''; // Limpiar mensaje de carga

        if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
             existingCategoriesContainer.innerHTML = '<p>No hay categorías en el menú o el formato es incorrecto.</p>';
             console.error("menu.json está vacío, no es un array, o es null:", menuData);
             return;
        }

        menuData.forEach(category => {
             // Solo procesamos si la categoría tiene un ID y título válidos
             if (category.id && category.title) {
                  const categoryItemHTML = createAdminCategoryItemHTML(category);
                  existingCategoriesContainer.insertAdjacentHTML('beforeend', categoryItemHTML);
             } else {
                 console.warn("Categoría con formato incorrecto encontrada:", category);
             }
        });

        setupCategoryActionButtons(); // Configurar botones de categorías

    } catch (error) {
        console.error('Error al cargar las categorías para administración:', error);
        if (existingCategoriesContainer) {
             existingCategoriesContainer.innerHTML = '<p style="color: red;">Error al cargar las categorías. Verifique la consola para más detalles.</p>';
        }
    }
}

// Configurar event listeners para botones de categoría
function setupCategoryActionButtons() {
     if (!existingCategoriesContainer) return;
     // Eliminar listeners anteriores
     existingCategoriesContainer.removeEventListener('click', handleCategoryActionClick);
     // Agregar el listener
     existingCategoriesContainer.addEventListener('click', handleCategoryActionClick);
}

// Manejador unificado para clics en botones de categoría (Eliminar/Editar)
function handleCategoryActionClick(event) {
    const button = event.target;

    // Si el clic fue en un botón de eliminar categoría
    if (button.classList.contains('delete-cat-btn')) {
        const categoryItemElement = button.closest('.admin-category-item');
        if (categoryItemElement) {
            const categoryId = categoryItemElement.dataset.id;
             // Opcional: Obtener el título para el mensaje de confirmación
             const categoryTitleElement = categoryItemElement.querySelector('h3');
             const categoryTitle = categoryTitleElement ? categoryTitleElement.textContent : 'Categoría sin título';


            if (confirm(`¿Estás seguro de eliminar la categoría con ID "${categoryId}"?`)) {
                console.log(`Solicitud para eliminar categoría con ID "${categoryId}"`);
                // --- Lógica de eliminación con BACKEND (tu server.js) iría aquí ---
                 // NOTA: Eliminar una categoría a menudo implica también manejar los platos que pertenecen a esa categoría (eliminarlos, reasignarlos, etc.)
                 // Deberías enviar una petición al servidor (ej: DELETE /api/categories/:id)
                alert(`Solicitud de eliminación para la categoría con ID "${categoryId}" procesada. (Implementar lógica en server.js)`);
                 // categoryItemElement.remove(); // Elimina el elemento del DOM solo visualmente - descomentar si solo quieres simular en frontend
            }
        }
    }
    // Si el clic fue en un botón de editar categoría
    else if (button.classList.contains('edit-cat-btn')) {
        const categoryItemElement = button.closest('.admin-category-item');
        if (categoryItemElement) {
            const categoryId = categoryItemElement.dataset.id;
             // Obtener el título actual
             const categoryTitleElement = categoryItemElement.querySelector('h3');
             const categoryTitle = categoryTitleElement ? categoryTitleElement.textContent : 'Categoría sin título';


            console.log(`Solicitud para editar categoría con ID "${categoryId}". Título actual: "${categoryTitle}"`);
            alert(`Funcionalidad de edición para la categoría con ID "${categoryId}" (Solo frontend). Implementar lógica en server.js para guardar.`);

            // --- Lógica para abrir un formulario de edición y llenarlo iría aquí ---
            // Luego, al enviar el formulario, enviar una petición al servidor (ej: PUT /api/categories/:id)
        }
    }
}


// *** Inicializar la página de administración ***
document.addEventListener('DOMContentLoaded', function() {
    loadAdminMenu(); // Cargar y mostrar los platos
    loadAdminCategories(); // Cargar y mostrar las categorías
});