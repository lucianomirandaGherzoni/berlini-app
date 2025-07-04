// Configuración de la API base
// Define la URL base de tu API de productos.
const CONFIG = {
  API_BASE_URL: "https://api-crud-berlini.vercel.app/api/v1/productos",
  // Las credenciales de ADMIN_USERNAME y ADMIN_PASSWORD NO deben estar en el código del cliente en producción.
  // Deben ser validadas por una API en el servidor (como tu función serverless /api/login).
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "admin123",
}

// Elementos del DOM 
const listaProductos = document.getElementById("grilla-productos") // Contenedor de la lista de productos en la página principal
const productoModal = document.getElementById("productoModal") // Modal para crear/editar productos
const confirmarEliminarModal = document.getElementById("confirmarEliminarModal") // Modal de confirmación de eliminación
const modalTitulo = document.getElementById("modalTitulo") // Título del modal de producto
const mensajeEliminar = document.getElementById("mensajeEliminar") // Mensaje en el modal de eliminación

// Campos de entrada del formulario de producto
const inputId = document.getElementById("id-producto") // Campo ID del producto
const inputNombre = document.getElementById("nombre-producto") // Campo Nombre del producto
const inputDetalle = document.getElementById("detalle-producto") // Campo Detalle del producto
const inputPrecio = document.getElementById("precio-producto") // Campo Precio del producto
const inputStock = document.getElementById("stock-producto") // Campo Stock del producto
const inputImagen = document.getElementById("imagen-producto") // Campo de entrada de archivo para la imagen

// Elementos para manejo de imágenes en el modal de producto
const previewImagen = document.getElementById("preview-imagen") // Contenedor de la previsualización de la imagen
const imgPreview = document.getElementById("img-preview") // Elemento <img> dentro del contenedor de previsualización
const removerImagenBtn = document.getElementById("remover-imagen") // Botón para remover la imagen seleccionada
const spinnerGuardar = document.getElementById("spinner-guardar") // Spinner de carga para el botón guardar
const textoGuardar = document.getElementById("texto-guardar") // Texto del botón guardar

// Botones principales de la interfaz de administración
const btnAgregarProducto = document.getElementById("boton-agregar-producto") // Botón para abrir el modal de creación de producto
const btnGuardarProducto = productoModal ? productoModal.querySelector("#btnGuardar") : null // Botón para guardar cambios en el modal de producto
const btnEliminarConfirm = confirmarEliminarModal ? confirmarEliminarModal.querySelector("#btnEliminar") : null // Botón de confirmación de eliminación

// Variables globales para el estado de la aplicación
let productoActual = null // Almacena el producto que se está editando/eliminando
let imagenActualUrl = null // Almacena la URL de la imagen actual del producto (si existe)
let nuevaImagenFile = null // Almacena el objeto File de la nueva imagen seleccionada

// Modales de carrito y login (para la página principal)
const cartModal = document.getElementById("modal-carrito") // Modal del carrito de compras
const loginModal = document.getElementById("modal-login") // Modal de inicio de sesión
let itemsCarrito = [] // Array para almacenar los ítems en el carrito
const CLAVE_CARRITO_STORAGE = "viandas_carrito" // Clave para almacenar el carrito en localStorage

// --- Funciones de Utilidad ---

// Muestra un mensaje de notificación (toast) en la esquina inferior derecha.
function showToast(message, type = "exito") {
  const toastContainer = document.getElementById("contenedor-notificaciones")
  if (!toastContainer) return

  const toast = document.createElement("div")
  toast.classList.add("notificacion", type)
  toast.textContent = message
  toastContainer.appendChild(toast)

  // Fuerza un reflow para que la transición CSS funcione correctamente
  void toast.offsetWidth
  toast.classList.add("mostrar")

  // Oculta y elimina el toast después de 3 segundos
  setTimeout(() => {
    toast.classList.remove("mostrar")
    toast.addEventListener("transitionend", () => {
      toast.remove()
    })
  }, 3000)
}

// Carga los ítems del carrito desde el almacenamiento local (localStorage).
function cargarCarrito() {
  const carritoGuardado = localStorage.getItem(CLAVE_CARRITO_STORAGE)
  if (carritoGuardado) {
    itemsCarrito = JSON.parse(carritoGuardado)
  }
  actualizarContadorCarrito()
}

// Guarda los ítems del carrito en el almacenamiento local (localStorage).
function guardarCarrito() {
  localStorage.setItem(CLAVE_CARRITO_STORAGE, JSON.stringify(itemsCarrito))
  actualizarContadorCarrito()
}

// Actualiza el contador de ítems en el icono del carrito.
function actualizarContadorCarrito() {
  const contador = itemsCarrito.reduce((total, item) => total + item.quantity, 0)
  const spanContador = document.getElementById("cart-item-count")
  if (spanContador) {
    spanContador.textContent = contador.toString()
    spanContador.style.display = contador > 0 ? "flex" : "none" // Muestra/oculta el contador
  }
}

// Abre un modal específico.
function abrirModal(idModal) {
  const modal = document.getElementById(idModal)
  if (modal) {
    modal.style.display = "flex" // Cambia el estilo para hacerlo visible
    document.body.style.overflow = "hidden" // Desactiva el desplazamiento del cuerpo
  }

}

// Cierra un modal específico.
function cerrarModal(idModal) {
  const modal = document.getElementById(idModal)
  if (modal){
    modal.style.display = "none" // Cambia el estilo para ocultarlo
    document.body.style.overflow = "auto";
  } 

}

// Cierra todos los modales y limpia los campos del formulario de producto.
function cerrarYLimpiarModales() {
  if (productoModal) productoModal.style.display = "none"
  if (confirmarEliminarModal) confirmarEliminarModal.style.display = "none"
   document.body.style.overflow = "auto";
  // Limpiar campos del formulario
  if (inputId) inputId.value = ""
  if (inputDetalle) inputDetalle.value = ""
  if (inputStock) inputStock.value = ""
  if (inputNombre) inputNombre.value = ""
  if (inputPrecio) inputPrecio.value = ""
  if (inputImagen) inputImagen.value = "" // Limpia el input de tipo file

  // Limpiar la previsualización de la imagen
  limpiarPreviewImagen()

  // Reiniciar variables de estado
  productoActual = null
  imagenActualUrl = null
  nuevaImagenFile = null

  // Asegura que el campo ID no esté en modo solo lectura al cerrar
  if (inputId) inputId.readOnly = false
}

// --- Funciones para manejo de imágenes (interactúan con tu API backend) ---

// Oculta el contenedor de previsualización de imagen y limpia la fuente de la imagen.
function limpiarPreviewImagen() {
  if (previewImagen) previewImagen.style.display = "none" // Oculta el contenedor
  if (imgPreview) imgPreview.src = "" // Limpia la fuente de la imagen
}

// Muestra una previsualización de la imagen seleccionada por el usuario.
function mostrarPreviewImagen(file) {
  if (!file || !previewImagen || !imgPreview) return // Verifica que los elementos existan

  const reader = new FileReader() // Crea un lector de archivos
  reader.onload = (e) => {
    imgPreview.src = e.target.result // Establece la fuente de la imagen a la URL de datos del archivo
    previewImagen.style.display = "flex" // Muestra el contenedor de previsualización
  }
  reader.readAsDataURL(file) // Lee el contenido del archivo como una URL de datos
}

// Sube un archivo de imagen a tu API backend.
// Tu API se encargará de subirlo a Supabase Storage y devolver la URL pública.
async function subirImagen(file) {
  if (!file) return null // Si no hay archivo, no hace nada

  try {
    const formData = new FormData() // Crea un objeto FormData para enviar el archivo
    formData.append("image", file) // Añade el archivo al FormData con el nombre 'image' (debe coincidir con tu Multer config en rutas.mjs)

    // Realiza una solicitud POST a tu endpoint de subida de imágenes
    const response = await fetch(`${CONFIG.API_BASE_URL}/upload-image`, {
      method: "POST",
      body: formData, // Envía el FormData
      // No se establece Content-Type aquí; el navegador lo hace automáticamente para FormData
    })

    // Si la respuesta no es exitosa (código de estado 2xx)
    if (!response.ok) {
      const errorBody = await response.json() // Intenta leer el cuerpo del error
      throw new Error(
        `Error al subir imagen a la API: ${response.status}, mensaje: ${errorBody.mensaje || errorBody.message || "Error desconocido"}`,
      )
    }

    const result = await response.json() // Parsea la respuesta JSON
    return result.imageUrl // Retorna la URL pública de la imagen que tu API debe devolver
  } catch (error) {
    console.error("Error al subir imagen:", error)
    throw error // Propaga el error para que sea manejado por la función que llama
  }
}

// Elimina una imagen de Supabase Storage a través de tu API backend.
async function eliminarImagen(imageUrl) {
  if (!imageUrl) return // Si no hay URL, no hace nada

  try {
    // Realiza una solicitud DELETE a tu endpoint de eliminación de imágenes
    const response = await fetch(`${CONFIG.API_BASE_URL}/delete-image`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json", // Indica que el cuerpo es JSON
      },
      body: JSON.stringify({ imageUrl }), // Envía la URL de la imagen en el cuerpo JSON
    })

    // Si la respuesta no es exitosa, registra una advertencia (no un error crítico si la imagen ya no existe)
    if (!response.ok) {
      const errorBody = await response.json()
      console.warn(
        `Error al eliminar imagen de la API: ${response.status}, mensaje: ${errorBody.mensaje || errorBody.message || "Error desconocido"}`,
      )
    }
  } catch (error) {
    console.warn("Error al eliminar imagen:", error) // Registra cualquier error de red o de la solicitud
  }
}

// --- Funciones de la API (CRUD de productos) ---

// Obtiene todos los productos de la API.
async function fetchProductosAPI() {
  try {
    // Añade un timestamp para evitar problemas de caché en el navegador
    const url = `${CONFIG.API_BASE_URL}?_=${new Date().getTime()}`
    console.log("Fetching products from API:", url)
    const respuesta = await fetch(url)
    if (!respuesta.ok) {
      // Manejo específico para el caso de "No hay productos" si la API devuelve 200 con un mensaje
      if (respuesta.status === 200) {
        const data = await respuesta.json()
        if (data.mensaje && data.mensaje.includes("No hay productos")) {
          console.log("API response: No products found.")
          return []
        }
      }
      throw new Error(`Error HTTP: ${respuesta.status}`)
    }
    const data = await respuesta.json()
    console.log("Products fetched successfully:", data)
    return data
  } catch (error) {
    console.error("Error al obtener productos de la API:", error)
    showToast("No se pudieron cargar los productos. Intente de nuevo más tarde.", "error")
    return []
  }
}

// Agrega un nuevo producto a través de la API.
async function agregarProductoAPI(productoData) {
  try {
    const respuesta = await fetch(`${CONFIG.API_BASE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productoData),
    })
    if (!respuesta.ok) {
      const errorBody = await respuesta.json()
      throw new Error(
        `Error HTTP: ${respuesta.status}, mensaje: ${errorBody.mensaje || errorBody.message || "Error desconocido"}`,
      )
    }
    const newProductResponse = await respuesta.json()
    return newProductResponse.producto
  } catch (error) {
    console.error("Error al agregar producto a la API:", error)
    showToast(`Error al agregar producto: ${error.message}`, "error")
    return null
  }
}

// Modifica un producto existente a través de la API.
async function modificarProductosAPI(id, productData) {
  try {
    const respuesta = await fetch(`${CONFIG.API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    })
    if (!respuesta.ok) {
      const errorBody = await respuesta.json()
      throw new Error(
        `Error HTTP: ${respuesta.status}, mensaje: ${errorBody.mensaje || errorBody.message || "Error desconocido"}`,
      )
    }
    return true
  } catch (error) {
    console.error("Error al actualizar producto en la API:", error)
    showToast(`Error al actualizar producto: ${error.message}`, "error")
    return false
  }
}

// Elimina un producto a través de la API.
async function eliminarProductoAPI(id) {
  console.log(`Intentando eliminar producto con ID: ${id}`)
  try {
    const respuesta = await fetch(`${CONFIG.API_BASE_URL}/${id}`, {
      method: "DELETE",
    })
    console.log(`Respuesta de la API para eliminar: Status ${respuesta.status}, OK: ${respuesta.ok}`)
    if (!respuesta.ok) {
      // Si la API devuelve 404, lo tratamos como éxito si el producto ya no existe
      if (respuesta.status === 404) {
        console.warn(
          `API devolvió 404 para DELETE, pero se procede como si fuera exitoso según el feedback del usuario.`,
        )
        return true
      }

      const contentType = respuesta.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorBody = await respuesta.json()
        console.error("Cuerpo del error al eliminar:", errorBody)
        throw new Error(
          `Error HTTP: ${respuesta.status}, mensaje: ${errorBody.mensaje || errorBody.message || "Error desconocido"}`,
        )
      } else {
        throw new Error(`Error HTTP: ${respuesta.status}`)
      }
    }
    console.log(`Producto con ID ${id} eliminado exitosamente de la API.`)
    return true
  } catch (error) {
    console.error("Error al eliminar producto de la API:", error)
    showToast(`Error al eliminar producto: ${error.message}`, "error")
    return false
  }
}

// --- Funciones de Interfaz de Usuario (UI) ---

// Crea y retorna un elemento de tarjeta de producto para la visualización en la página principal.
function crearTarjetaProducto(producto) {
  // Si el stock es 0, no creamos la tarjeta.
  if (producto.stock === 0) {
    return null; // O podrías retornar undefined, lo importante es que no sea un elemento DOM
  }
  const card = document.createElement("div")
  card.className = "tarjeta"
  card.innerHTML = `
        <div class="tarjeta-cabecera">
            <img src="${producto.imagen_url}" alt="${producto.nombre}">
        </div>
        <div class="tarjeta-contenido">
            <h3 class="tarjeta-titulo">${producto.nombre}</h3>
            <p class="tarjeta-descripcion">${producto.detalle}</p>
            <p class="tarjeta-precio">$${producto.precio.toFixed(2)}</p>
        </div>
        <div class="tarjeta-pie">
            <button class="boton boton-primario boton-ancho-completo boton-agregar-carrito" data-product-id="${producto.id}">Agregar al Carrito</button>
        </div>
    `
  return card
}

// Renderiza la lista de productos en la página principal.
async function renderizarProductos() {
  if (!listaProductos) return
  listaProductos.innerHTML = "<p>Cargando productos...</p>"
  const productosAPI = await fetchProductosAPI() // Obtiene productos de la API
  listaProductos.innerHTML = "" // Limpia el contenedor
  if (productosAPI && productosAPI.length > 0) {
    productosAPI.forEach((producto) => {
      const card = crearTarjetaProducto(producto)
      if (card) {
        listaProductos.appendChild(card) // Añade cada producto como una tarjeta
      }


    })
  } else {
    listaProductos.innerHTML =
      '<p style="text-align: center; color: var(--texto-mutado);">No hay productos disponibles.</p>'
  }
}

// Agrega un producto al carrito de compras.
function agregarAlCarrito(producto) {
  const itemExistente = itemsCarrito.find((item) => item.id === producto.id)
  if (itemExistente) {
    itemExistente.quantity++
  } else {
    itemsCarrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      detalle: producto.detalle,
      stock: producto.stock,
      imagen_url: producto.imagen_url, // Usa imagen_url
      quantity: 1,
    })
  }
  guardarCarrito()
  showToast(`${producto.nombre} ha sido añadido al carrito.`)
}

// Renderiza el contenido del modal del carrito de compras.
async function renderizarModalCarrito() {
  const contenedorItems = document.getElementById("contenedor-items-carrito")
  const spanMontoTotal = document.getElementById("monto-total-carrito")
  const resumenDiv = document.getElementById("resumen-carrito")
  if (!contenedorItems || !spanMontoTotal || !resumenDiv) {
    console.error("Elementos del modal de carrito no encontrados.")
    return
  }

  contenedorItems.innerHTML = ""
  let montoTotal = 0

  if (itemsCarrito.length === 0) {
    contenedorItems.innerHTML =
      '<p style="text-align: center; color: var(--texto-mutado); padding: 2rem 0;">El carrito está vacío.</p>'
    resumenDiv.style.display = "none"
  } else {
    resumenDiv.style.display = "block"
    itemsCarrito.forEach((item) => {
      montoTotal += item.precio * item.quantity
      const divItem = document.createElement("div")
      divItem.className = "item-carrito"
      divItem.innerHTML = `
        <img src="${item.imagen_url}" alt="${item.nombre}" class="item-carrito-imagen">
        <div class="item-carrito-detalles">
          <h4 class="item-carrito-nombre">${item.nombre}</h4>
          <p class="item-carrito-precio">$${item.precio.toFixed(2)}</p>
        </div>
        <div class="item-carrito-controles">
          <button class="boton boton-contorno boton-icono" data-product-id="${item.id}" data-action="decrease">-</button>
          <span>${item.quantity}</span>
          <button class="boton boton-contorno boton-icono" data-product-id="${item.id}" data-action="increase">+</button>
        </div>
        <p class="item-carrito-subtotal">$${(item.precio * item.quantity).toFixed(2)}</p>
        <button class="boton boton-fantasma boton-icono" data-product-id="${item.id}" data-action="remove" style="color:var(--destructivo);">
          <svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      `
      contenedorItems.appendChild(divItem)
    })
  }

  spanMontoTotal.textContent = `$${montoTotal.toFixed(2)}`
}

// Abre el modal para crear un nuevo producto, limpiando los campos.
function abrirModalCrear() {
  if (modalTitulo) modalTitulo.textContent = "Crear Producto"
  // Limpia todos los campos del formulario
  if (inputId) inputId.value = ""
  if (inputId) inputId.readOnly = false // Asegura que el ID no esté en solo lectura para nuevos productos (aunque se autogenera)
  if (inputDetalle) inputDetalle.value = ""
  if (inputStock) inputStock.value = ""
  if (inputNombre) inputNombre.value = ""
  if (inputPrecio) inputPrecio.value = ""
  if (inputImagen) inputImagen.value = "" // Limpia el input de archivo

  limpiarPreviewImagen() // Limpia la previsualización de la imagen
  productoActual = null // No hay producto actual al crear uno nuevo
  imagenActualUrl = null
  nuevaImagenFile = null

  if (productoModal) abrirModal("productoModal")
}

// Abre el modal para editar un producto existente, cargando sus datos.
async function abrirModalEditar(id) {
  try {
    console.log(`abrirModalEditar: Intentando obtener producto con ID: ${id}`)
    const respuesta = await fetch(`${CONFIG.API_BASE_URL}/${id}`) // Obtiene el producto de la API
    if (!respuesta.ok) {
      throw new Error(`Error HTTP! status: ${respuesta.status}`)
    }
    const producto = await respuesta.json()

    if (producto && producto.id) {
      let cleanId = producto.id
      // Manejo de IDs que puedan venir con formato inesperado (ej. de Supabase)
      if (typeof producto.id === "string" && producto.id.includes(":")) {
        cleanId = producto.id.split(":")[0]
        console.warn(
          `abrirModalEditar: ID de la API contiene dos puntos, parseando a: ${cleanId}. Original: ${producto.id}`,
        )
      }

      if (modalTitulo) modalTitulo.textContent = "Editar Producto"
      if (inputId) inputId.value = cleanId
      if (inputId) inputId.readOnly = true // El ID no se puede editar
      if (inputNombre) inputNombre.value = producto.nombre
      if (inputPrecio) inputPrecio.value = producto.precio
      if (inputDetalle) inputDetalle.value = producto.detalle
      if (inputStock) inputStock.value = producto.stock

      if (inputImagen) inputImagen.value = "" // Limpia el input de archivo para una nueva selección

      // Manejar imagen actual: limpia la previsualización y muestra la imagen existente si hay
      limpiarPreviewImagen()
      if (producto.imagen_url) {
        imagenActualUrl = producto.imagen_url // Guarda la URL de la imagen actual
        imgPreview.src = producto.imagen_url // Muestra la imagen actual en el preview
        previewImagen.style.display = "flex" // Asegura que el contenedor de preview esté visible
      }

      productoActual = { ...producto, id: cleanId } // Almacena el producto actual
      nuevaImagenFile = null // No hay nueva imagen seleccionada al abrir el modal

      if (productoModal) abrirModal("productoModal")
    } else {
      showToast("Producto no encontrado para editar.", "error")
    }
  } catch (error) {
    console.error("Error al obtener producto para editar:", error)
    showToast("No se pudo cargar el producto para editar.", "error")
  }
}

// Abre el modal de confirmación para eliminar un producto.
async function abrirModalEliminar(id) {
  try {
    console.log(`abrirModalEliminar: Intentando obtener producto con ID: ${id}`)
    const respuesta = await fetch(`${CONFIG.API_BASE_URL}/${id}`)
    if (!respuesta.ok) {
      throw new Error(`Error HTTP! status: ${respuesta.status}`)
    }
    const producto = await respuesta.json()

    if (producto && producto.id) {
      let cleanId = producto.id
      if (typeof producto.id === "string" && producto.id.includes(":")) {
        cleanId = producto.id.split(":")[0]
        console.warn(
          `abrirModalEliminar: ID de la API contiene dos puntos, parseando a: ${cleanId}. Original: ${producto.id}`,
        )
      }

      productoActual = { ...producto, id: cleanId } // Almacena el producto a eliminar

      // Muestra un cuadro de diálogo de confirmación nativo
      if (confirm(`¿Estás seguro de que quieres eliminar el producto "${producto.nombre}" (ID: ${cleanId})?`)) {
        console.log("Confirmación de eliminación aceptada. Llamando a eliminarProducto().")
        eliminarProducto() // Llama a la función de eliminación si se confirma
      } else {
        console.log("Confirmación de eliminación cancelada.")
        cerrarYLimpiarModales() // Cierra y limpia si se cancela
      }
    } else {
      showToast("Producto no encontrado para eliminar.", "error")
    }
  } catch (error) {
    console.error("Error al obtener producto para eliminar:", error)
    showToast("No se pudo cargar el producto para confirmar eliminación.", "error")
  }
}

// Guarda un producto (crea uno nuevo o modifica uno existente).
async function guardarProducto() {
  // Obtiene los valores de los campos del formulario
  const nombre = inputNombre ? inputNombre.value.trim() : ""
  const precio = inputPrecio ? Number.parseFloat(inputPrecio.value) : 0
  const stock = inputStock ? Number.parseInt(inputStock.value) : 0
  const detalle = inputDetalle ? inputDetalle.value.trim() : ""
  const archivoImagen = inputImagen ? inputImagen.files[0] : null // Obtiene el archivo de imagen seleccionado

  // Validación básica de campos obligatorios
  if (!nombre || isNaN(precio) || precio <= 0 || !detalle || isNaN(stock) || stock < 0) {
    showToast(
      "Por favor complete todos los campos obligatorios (Nombre, Precio, Detalle, Stock) correctamente. Precio y Stock deben ser números válidos.",
      "error",
    )
    return
  }

  // Muestra spinner de carga y deshabilita el botón
  if (spinnerGuardar) spinnerGuardar.style.display = "inline-block"
  if (textoGuardar) textoGuardar.textContent = "Guardando..."
  if (btnGuardarProducto) btnGuardarProducto.disabled = true

  let imagen_url = productoActual ? productoActual.imagen_url : null // URL de la imagen actual del producto

  // Lógica para subir o mantener la imagen
  if (nuevaImagenFile) { // Si se seleccionó una nueva imagen (nuevaImagenFile se setea en el change event del inputImagen)
    try {
      const newImageUrl = await subirImagen(nuevaImagenFile) // Sube la nueva imagen a través de tu API
      if (newImageUrl) {
        // Si había una imagen anterior y se subió una nueva, eliminar la anterior a través de tu API
        if (imagenActualUrl && imagenActualUrl !== newImageUrl) {
          await eliminarImagen(imagenActualUrl)
        }
        imagen_url = newImageUrl // Actualiza la URL de la imagen a la nueva
      } else {
        // Si la subida falló, informa pero permite que el producto se guarde sin imagen
        showToast("Fallo al subir la nueva imagen. Se mantendrá la imagen anterior o ninguna.", "info")
      }
    } catch (error) {
      console.error("Error al subir imagen en guardarProducto:", error)
      showToast(`Error al subir imagen: ${error.message}`, "error")
      // No se retorna aquí, para permitir que el producto se guarde incluso si la imagen falla
    }
  } else if (productoActual && !imagenActualUrl && !nuevaImagenFile) {
    // Si estamos editando, no hay nueva imagen y la imagen actual fue removida (imagenActualUrl es null),
    // entonces la URL de la imagen del producto debe ser null.
    imagen_url = null;
  }


  const productoData = {
    nombre,
    detalle,
    precio,
    stock,
    imagen_url, // Incluye la URL de la imagen en los datos del producto
  }

  try {
    if (productoActual && productoActual.id) {
      // Si hay un producto actual, se está editando
      console.log(`guardarProducto: Intentando actualizar producto con ID: ${productoActual.id}`)
      const success = await modificarProductosAPI(productoActual.id, productoData) // Llama a la API para modificar
      if (success) {
        showToast("Producto actualizado exitosamente.")
        cerrarYLimpiarModales()
        console.log("Producto actualizado. Re-renderizando tabla de administración.")
        await renderizarProductosAdmin() // Vuelve a renderizar la tabla
      } else {
        console.log("Fallo al actualizar producto.")
      }
    } else {
      // Si no hay producto actual, se está creando uno nuevo
      console.log("guardarProducto: Intentando agregar nuevo producto.")
      const newProduct = await agregarProductoAPI(productoData) // Llama a la API para agregar
      if (newProduct) {
        showToast(`Producto agregado exitosamente con ID: ${newProduct.id}.`)
        cerrarYLimpiarModales()
        console.log("Producto agregado. Re-renderizando tabla de administración.")
        await renderizarProductosAdmin() // Vuelve a renderizar la tabla
      } else {
        console.log("Fallo al agregar producto.")
      }
    }
  } catch (error) {
    console.error("Error al guardar producto:", error)
    showToast(`Error al guardar producto: ${error.message}`, "error")
  } finally {

    if (spinnerGuardar) spinnerGuardar.style.display = "none"
    if (textoGuardar) textoGuardar.textContent = "Guardar"
    if (btnGuardarProducto) btnGuardarProducto.disabled = false
  }
}

// Elimina un producto y su imagen asociada.
async function eliminarProducto() {
  if (productoActual && productoActual.id) {
    console.log(`eliminarProducto: Llamando a eliminarProductoAPI para ID: ${productoActual.id}`)

    // Eliminar imagen a través de tu API si existe una URL de imagen asociada al producto
    if (productoActual.imagen_url) {
      await eliminarImagen(productoActual.imagen_url) // Llama a la función para eliminar la imagen
    }

    const success = await eliminarProductoAPI(productoActual.id) // Llama a la API para eliminar el producto
    console.log(`eliminarProducto: Resultado de eliminarProductoAPI: ${success}`)
    if (success) {
      showToast("Producto eliminado exitosamente.")
      cerrarYLimpiarModales()
      console.log("eliminarProducto: Producto eliminado. Re-renderizando tabla de administración.")
      await renderizarProductosAdmin() // Vuelve a renderizar la tabla
    } else {
      console.log("eliminarProducto: Fallo al eliminar producto.")
    }
  } else {
    showToast("No hay producto seleccionado para eliminar.", "error")
    cerrarYLimpiarModales()
  }
}

// Renderiza la tabla de productos en el panel de administración.
async function renderizarProductosAdmin() {
  const cuerpoTabla = document.getElementById("cuerpo-tabla-productos-admin")
  if (!cuerpoTabla) return

  console.log("Iniciando renderizado de productos en el panel de administración...")
  cuerpoTabla.innerHTML = `<tr><td colspan="7" style="height:6rem; text-align:center; color:var(--texto-mutado);">Cargando productos...</td></tr>`
  const productos = await fetchProductosAPI() // Obtiene los productos de la API
  console.log("Productos obtenidos de la API para admin:", productos)

  cuerpoTabla.innerHTML = "" // Limpia el cuerpo de la tabla
  if (productos.length === 0) {
    cuerpoTabla.innerHTML = `<tr><td colspan="7" style="height:6rem; text-align:center; color:var(--texto-mutado);">No hay productos.</td></tr>`
    console.log("No hay productos para mostrar.")
    return
  }

  productos.forEach((producto) => {
    let displayId = producto.id
    if (typeof producto.id === "string" && producto.id.includes(":")) {
      displayId = producto.id.split(":")[0]
    }

    const fila = document.createElement("tr")
    fila.innerHTML = `
          <td><img src="${producto.imagen_url || "/placeholder.svg?height=50&width=50"}" alt="${producto.nombre}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem;"></td>
          <td style="font-weight:500;">${producto.nombre}</td>
          <td class="texto-derecha">$${producto.precio.toFixed(2)}</td>
          <td class="texto-derecha">${producto.stock}</td>
          <td class="acciones">
              <button class="boton boton-contorno boton-icono boton-editar-producto" data-product-id="${displayId}">
                <svg class="icono" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="boton boton-destructivo boton-icono boton-eliminar-producto" data-product-id="${displayId}">
                <svg class="icono" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
          </td>
      `
    cuerpoTabla.appendChild(fila) // Añade la fila a la tabla
  })
  console.log("Renderizado de productos en el panel de administración completado.")
}

// --- Event Listeners (Manejadores de Eventos) ---

// Se ejecuta cuando el DOM ha sido completamente cargado.
document.addEventListener("DOMContentLoaded", () => {
  cargarCarrito() // Carga el carrito al iniciar la página

  // Delegación de eventos para cerrar modales al hacer clic en botones de cierre.
  document.body.addEventListener("click", (event) => {
    const closeButton = event.target.closest(".close, .boton-cerrar, .cerrar-modal")
    if (closeButton) {
      const modalElement = closeButton.closest(".modal")
      if (modalElement) {
        cerrarModal(modalElement.id)
      }
    }
  })

  // Cierra el modal al hacer clic fuera de su contenido.
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        cerrarModal(modal.id)
      }
    })
  })

  // Manejador de eventos para el input de archivo de imagen.
  if (inputImagen) {
    inputImagen.addEventListener("change", (event) => {
      const file = event.target.files[0] // Obtiene el archivo seleccionado
      if (file) {
        // Validación de tipo de archivo
        if (!file.type.startsWith("image/")) {
          showToast("Por favor seleccione un archivo de imagen válido.", "error")
          inputImagen.value = "" // Limpia el input
          return
        }

        // Validación de tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
          showToast("La imagen debe ser menor a 5MB.", "error")
          inputImagen.value = "" // Limpia el input
          return
        }

        nuevaImagenFile = file // Almacena el archivo para su posterior subida
        mostrarPreviewImagen(file) // Muestra la previsualización
      }
    })
  }

  // Manejador de eventos para el botón "Remover Imagen".
  if (removerImagenBtn) {
    removerImagenBtn.addEventListener("click", () => {
      if (inputImagen) inputImagen.value = "" // Limpia el input de archivo
      nuevaImagenFile = null // No hay nueva imagen
      imagenActualUrl = null; // Indica que la imagen actual ha sido removida
      limpiarPreviewImagen() // Oculta la previsualización
    })
  }

  // Lógica específica para la página principal (index.html)
  if (document.getElementById("grilla-productos")) {
    renderizarProductos() // Renderiza los productos en la página principal

    // Delegación de eventos para los botones "Agregar al Carrito".
    if (listaProductos) {
      listaProductos.addEventListener("click", (event) => {
        const addButton = event.target.closest(".boton-agregar-carrito")
        if (addButton) {
          const productId = Number(addButton.dataset.productId)
          fetchProductosAPI().then((products) => {
            const productToAdd = products.find((p) => p.id === productId)
            if (productToAdd) {
              agregarAlCarrito(productToAdd)
            } else {
              console.error("Producto no encontrado con ID:", productId)
            }
          })
        }
      })
    }

    // Abre el modal del carrito.
    document.getElementById("cart-button").onclick = () => {
      renderizarModalCarrito()
      abrirModal("modal-carrito")
    }
    // Abre el modal de inicio de sesión.
    document.getElementById("login-button").onclick = () => abrirModal("modal-login")

    // Delegación de eventos para los botones de cantidad y eliminar en el carrito.
    const contenedorItemsCarrito = document.getElementById("contenedor-items-carrito")
    if (contenedorItemsCarrito) {
      contenedorItemsCarrito.addEventListener("click", (event) => {
        const targetButton = event.target.closest("button[data-action]")
        if (targetButton) {
          const productId = Number(targetButton.dataset.productId)
          const action = targetButton.dataset.action
          const itemIndex = itemsCarrito.findIndex((i) => i.id === productId)

          if (itemIndex > -1) {
            if (action === "increase") {
              itemsCarrito[itemIndex].quantity++
            } else if (action === "decrease") {
              if (itemsCarrito[itemIndex].quantity > 1) {
                itemsCarrito[itemIndex].quantity--
              } else {
                itemsCarrito.splice(itemIndex, 1)
              }
            } else if (action === "remove") {
              itemsCarrito.splice(itemIndex, 1)
            }
            guardarCarrito()
            renderizarModalCarrito()
          }
        }
      })
    }

    // Lógica para las opciones de entrega en el formulario de checkout.
    const radioDomicilio = document.getElementById("entrega-domicilio")
    const radioSucursal = document.getElementById("entrega-sucursal")
    const campoDireccion = document.getElementById("campo-direccion")
    const inputDireccion = document.getElementById("direccion")
    const infoRetiro = document.getElementById("info-retiro-sucursal")

    if (radioDomicilio && radioSucursal && campoDireccion && infoRetiro) {
      radioDomicilio.addEventListener("change", () => {
        if (radioDomicilio.checked) {
          campoDireccion.style.display = "grid"
          inputDireccion.required = true
          infoRetiro.style.display = "none"
        }
      })
      radioSucursal.addEventListener("change", () => {
        if (radioSucursal.checked) {
          campoDireccion.style.display = "none"
          inputDireccion.required = false
          infoRetiro.style.display = "block"
        }
      })

      // Establece el estado inicial basado en la opción seleccionada por defecto
      if (radioDomicilio.checked) {
        campoDireccion.style.display = "grid"
        inputDireccion.required = true
        infoRetiro.style.display = "none"
      } else if (radioSucursal.checked) {
        campoDireccion.style.display = "none"
        inputDireccion.required = false
        infoRetiro.style.display = "block"
      }
    }

    // Manejador de envío del formulario de checkout.
    document.getElementById("formulario-checkout").onsubmit = (e) => {
      e.preventDefault()
      if (itemsCarrito.length === 0) {
        showToast("Tu carrito está vacío.", "error")
        return
      }

      const formulario = e.target
      const metodoEntrega = formulario.metodo_entrega.value
      const datosPedido = {
        metodoEntrega,
        nombre: formulario.nombre.value,
        telefono: formulario.telefono.value,
        notas: formulario.notas.value,
        items: itemsCarrito,
        total: itemsCarrito.reduce((sum, item) => sum + item.precio * item.quantity, 0),
      }

      if (metodoEntrega === "domicilio") {
        datosPedido.direccion = formulario.direccion.value
      }

      showToast("Pedido finalizado con éxito (simulación).")
      itemsCarrito = []
      guardarCarrito()
      cerrarModal("modal-carrito")
      formulario.reset()
    }

    // Manejador de envío del formulario de login (usa la función serverless).
    document.getElementById("formulario-login").onsubmit = async (e) => {
      /*      
            const username = e.target.usuario.value
            const password = e.target.contrasena.value
      
            console.log("Client attempting login with:", { username, password })
      
             try {
              const response = await fetch("/api/login", { // Llama a tu función serverless de login
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
              })
      
              if (response.ok) {
                console.log("Login successful on client side.")
                localStorage.setItem("is_admin_logged_in", "true") // Marca como logueado
                window.location.href = "crud.html" // Redirige al panel de administración
              } else {
                const errorData = await response.json()
                console.error("Login failed on client side:", errorData)
                showToast(`Credenciales inválidas: ${errorData.message || "Usuario o contraseña incorrectos."}`, "error")
              }
            } catch (error) {
              console.error("Error during login fetch:", error)
              showToast("Error al intentar iniciar sesión. Intente de nuevo.", "error")
            } 
       */
      e.preventDefault()
      if (e.target.usuario.value === CONFIG.ADMIN_USERNAME && e.target.contrasena.value === CONFIG.ADMIN_PASSWORD) {
        localStorage.setItem("is_admin_logged_in", "true")
        window.location.href = "crud.html"
      } else {
        showToast(
          `Credenciales inválidas. para probar.`,
          "error",
        )
      }
    }
  } else if (document.getElementById("cuerpo-tabla-productos-admin")) {
    // --- Lógica específica para la página de administración (crud.html) ---
    const cuerpoTablaAdmin = document.getElementById("cuerpo-tabla-productos-admin")
    // Verifica si el usuario está logueado como administrador
    if (localStorage.getItem("is_admin_logged_in") !== "true") {
      showToast("Acceso denegado. Por favor, inicia sesión.", "error")
      window.location.href = "index.html" // Redirige si no está logueado
      return
    }
    renderizarProductosAdmin() // Renderiza la tabla de productos en el admin

    // Delegación de eventos para los botones "Editar" y "Eliminar" en la tabla de administración.
    if (cuerpoTablaAdmin) {
      cuerpoTablaAdmin.addEventListener("click", (event) => {
        const editButton = event.target.closest(".boton-editar-producto")
        const deleteButton = event.target.closest(".boton-eliminar-producto")

        if (editButton) {
          const productId = Number(editButton.dataset.productId)
          abrirModalEditar(productId) // Abre el modal de edición
        } else if (deleteButton) {
          const productId = Number(deleteButton.dataset.productId)
          abrirModalEliminar(productId) // Abre el modal de eliminación
        }
      })
    }

    // Asigna el manejador de clic al botón "Agregar Nuevo Producto".
    if (btnAgregarProducto) btnAgregarProducto.onclick = abrirModalCrear

    // Asigna el manejador de envío al formulario de CRUD de producto.
    const productForm = document.getElementById("formulario-crud-producto")
    if (productForm) {
      productForm.onsubmit = (e) => {
        e.preventDefault() // Previene el envío por defecto del formulario
        guardarProducto() // Llama a la función para guardar el producto
      }
    }

    // Asigna el manejador de clic al botón "Cerrar Sesión".
    document.getElementById("boton-logout-admin").onclick = () => {
      localStorage.removeItem("is_admin_logged_in") // Elimina la marca de logueado
      showToast("Sesión cerrada.")
      window.location.href = "index.html" // Redirige a la página principal
    }
  }
})
