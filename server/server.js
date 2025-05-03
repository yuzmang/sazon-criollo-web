// server.js

const express = require('express');
const fs = require('fs'); // Módulo para interactuar con el sistema de archivos
const path = require('path'); // Módulo para manejar rutas de archivos
const cors = require('cors'); // Middleware para habilitar CORS
const { v4: uuidv4 } = require('uuid'); // Para generar IDs únicos (asegúrate de haber corrido 'npm install uuid')

const app = express();
const PORT = process.env.PORT || 3000; // Puerto para el servidor
const menuFilePath = path.join(__dirname, 'menu.json'); // Ruta al archivo menu.json

// --- Middleware ---
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Permite al servidor entender JSON en las solicitudes (para POST/PUT)
app.use(express.static(__dirname)); // Sirve archivos estáticos desde la raíz del proyecto

// --- Funciones para Manejar Datos ---

// Carga los datos del menú desde menu.json y ASEGURA que todos los items tengan ID
function loadMenuData() {
    console.log(`Intentando cargar datos desde: ${menuFilePath}`);
    try {
        let data = [];
        if (fs.existsSync(menuFilePath)) {
            const jsonData = fs.readFileSync(menuFilePath, 'utf-8');
            // Intentar parsear, si falla, el catch lo manejará
            data = JSON.parse(jsonData);
            console.log("Archivo menu.json leído y parseado.");
        } else {
            console.warn(`Archivo ${menuFilePath} no existe. Se creará uno vacío.`);
            // No es necesario retornar [], se procesará el array vacío abajo
        }

        // *** Asegurar que todos los items tengan un ID ***
        let dataModified = false;
        if (Array.isArray(data)) {
            data.forEach(category => {
                // Verificar que la categoría y sus items sean válidos antes de iterar
                if (category && category.id && Array.isArray(category.items)) {
                    category.items.forEach(item => {
                        // Verificar que el item sea un objeto válido y no tenga ya un ID
                        if (item && typeof item === 'object' && !item.id) {
                            const newId = uuidv4();
                            item.id = newId; // Asignarle uno
                            console.log(`-> Asignado nuevo ID ${newId} al plato "${item.name || 'SIN NOMBRE'}" en categoría "${category.id}"`);
                            dataModified = true; // Marcar que se modificó
                        } else if (item && !item.name) {
                             console.warn(`-> ADVERTENCIA: Plato en categoría "${category.id}" no tiene nombre. ID: ${item.id || 'N/A'}`);
                        }
                    });
                } else if (category && category.id) {
                     console.warn(`-> ADVERTENCIA: Categoría "${category.id}" no tiene un array 'items' válido.`);
                     // Opcional: inicializar items si no existe
                     if (!category.items) {
                         category.items = [];
                         dataModified = true; // Considerar esto una modificación si se quiere guardar
                     }
                } else {
                    console.warn("-> ADVERTENCIA: Se encontró una categoría inválida o sin ID en menu.json:", category);
                }
            });
        } else {
            console.error("Error: El contenido de menu.json no es un Array. Se usará un array vacío.");
            data = []; // Asegurar que sea un array si el parseo dio otra cosa
            dataModified = true; // Forzar guardado para corregir el archivo
        }

        // Si se modificaron datos (se añadieron IDs), guardar el archivo actualizado
        if (dataModified) {
            console.log("Guardando menu.json con los nuevos IDs/correcciones...");
            saveMenuData(data); // Llamar a la función para guardar
        } else {
            console.log("No se necesitaron modificaciones en los IDs del menú.");
        }

        return data; // Devolver los datos (posiblemente con nuevos IDs)

    } catch (error) {
        console.error("Error CRÍTICO al cargar, parsear o procesar menu.json:", error);
        // Intentar crear/guardar uno vacío si falla el parseo severo o el archivo no existe
        if (!fs.existsSync(menuFilePath) || error instanceof SyntaxError) {
             try {
                 console.warn("Intentando crear/resetear menu.json vacío debido a error.");
                 saveMenuData([]); // Guarda un array vacío
                 return [];
             } catch (saveError) {
                 console.error("Error CRÍTICO al intentar guardar menu.json vacío:", saveError);
                 return []; // Fallback final
             }
        }
        // Si hubo otro tipo de error, devolver vacío para evitar fallos mayores
        return [];
    }
}

// Guarda los datos del menú en menu.json
function saveMenuData(data) {
    try {
        // Usamos null, 2 para formatear el JSON con indentación para legibilidad
        fs.writeFileSync(menuFilePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`--> menu.json guardado exitosamente en ${menuFilePath}`);
    } catch (error) {
        console.error(`--> Error FATAL al guardar menu.json en ${menuFilePath}:`, error);
        // Considerar lanzar el error para detener el proceso si el guardado es crítico
        // throw error;
    }
}

// --- Carga inicial de los datos al iniciar el servidor ---
// La función loadMenuData ahora asegura que los IDs existan
let menuData = loadMenuData();

// --- API Endpoints ---

// GET /api/menu - Obtener todo el menú
app.get('/api/menu', (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] GET /api/menu solicitado`);
    // Devolver los datos en memoria (que ya tienen IDs asegurados por loadMenuData)
    res.json(menuData);
});

// POST /api/menu/:categoryId/items - Agregar un nuevo plato a una categoría
app.post('/api/menu/:categoryId/items', (req, res) => {
    const categoryId = req.params.categoryId;
    const newDishData = req.body;
    console.log(`[${new Date().toLocaleTimeString()}] POST /api/menu/${categoryId}/items`, newDishData);

    if (!newDishData || !newDishData.name || !newDishData.price || !newDishData.description) {
        return res.status(400).json({ message: "Faltan datos requeridos (nombre, precio, descripción)." });
    }
    const category = menuData.find(cat => cat.id === categoryId);
    if (!category) return res.status(404).json({ message: `Categoría '${categoryId}' no encontrada.` });

    const newDish = {
        name: newDishData.name,
        description: newDishData.description,
        price: newDishData.price,
        image: newDishData.image || '', // Asegurar que image exista, aunque sea vacío
        id: uuidv4() // Asigna un ID único universal
    };

    if (!Array.isArray(category.items)) category.items = []; // Asegurar que items sea array

    category.items.push(newDish);
    saveMenuData(menuData); // Guardar cambios

    console.log(`   -> Plato "${newDish.name}" (ID: ${newDish.id}) agregado a categoría "${categoryId}".`);
    res.status(201).json(newDish); // Responder con el plato creado
});

// PUT /api/menu/:categoryId/items/:itemId - Actualizar un plato existente
app.put('/api/menu/:categoryId/items/:itemId', (req, res) => {
    const { categoryId, itemId } = req.params; // Usar destructuring
    const updatedDishData = req.body;
    console.log(`[${new Date().toLocaleTimeString()}] PUT /api/menu/${categoryId}/items/${itemId}`, updatedDishData);

    if (!updatedDishData || !updatedDishData.name || !updatedDishData.price || !updatedDishData.description) {
        return res.status(400).json({ message: "Faltan datos requeridos para actualizar." });
    }
    const category = menuData.find(cat => cat.id === categoryId);
    if (!category || !Array.isArray(category.items)) return res.status(404).json({ message: `Categoría '${categoryId}' no encontrada.` });

    const itemIndex = category.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return res.status(404).json({ message: `Plato ID '${itemId}' no encontrado en categoría '${categoryId}'.` });

    // Actualizar el objeto en el array, asegurando mantener el ID original
    const originalItem = category.items[itemIndex];
    category.items[itemIndex] = {
        // Preservar el ID original es crucial
        id: originalItem.id,
        // Tomar los datos enviados, asegurando que no sobreescriban el ID
        name: updatedDishData.name,
        description: updatedDishData.description,
        price: updatedDishData.price,
        image: updatedDishData.image || originalItem.image || '' // Mantener imagen si no se envía una nueva
    };

    saveMenuData(menuData); // Guardar cambios
    console.log(`   -> Plato ID ${itemId} actualizado.`);
    res.status(200).json(category.items[itemIndex]); // Responder con el plato actualizado
});

// DELETE /api/menu/:categoryId/items/:itemId - Eliminar un plato
app.delete('/api/menu/:categoryId/items/:itemId', (req, res) => {
    const { categoryId, itemId } = req.params;
    console.log(`[${new Date().toLocaleTimeString()}] DELETE /api/menu/${categoryId}/items/${itemId}`);

    const category = menuData.find(cat => cat.id === categoryId);
    if (!category || !Array.isArray(category.items)) return res.status(404).json({ message: `Categoría '${categoryId}' no encontrada.` });

    const itemIndex = category.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return res.status(404).json({ message: `Plato ID '${itemId}' no encontrado en categoría '${categoryId}'.` });

    const removedItemName = category.items[itemIndex].name; // Para log
    category.items.splice(itemIndex, 1); // Eliminar el item
    saveMenuData(menuData); // Guardar cambios
    console.log(`   -> Plato "${removedItemName}" (ID: ${itemId}) eliminado.`);
    res.status(204).send(); // Respuesta estándar para DELETE exitoso
});

// --- Iniciar el Servidor ---
app.listen(PORT, () => {
    console.log("---------------------------------------------");
    console.log(`Servidor de Administración Sazón Criollo`);
    console.log(`Corriendo en http://localhost:${PORT}`);
    console.log(`- Sirviendo archivos desde: ${__dirname}`);
    console.log(`- Archivo de datos: ${menuFilePath}`);
    console.log("---------------------------------------------");
});