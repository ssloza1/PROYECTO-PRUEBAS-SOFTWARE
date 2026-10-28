/**
 * Lógica del Frontend para el Sistema de Inventario y Ventas
 */

const API_BASE = '/api';

// Estado global de la aplicación
const state = {
  productos: [],
  categorias: [],
  proveedores: [],
  clientes: [],
  ventas: [],
  carrito: [], // [{ id_producto, nombre, precio, stock, cantidad, subtotal }]
};

// ================= UTILIDADES =================
function formatCurrency(val) {
  const num = Number(val) || 0;
  return `$${num.toFixed(2)}`;
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ================= NAVEGACIÓN POR PESTAÑAS =================
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.tab-section');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-tab');

      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach((sec) => {
        sec.style.display = sec.id === targetId ? 'block' : 'none';
      });

      // Recargas específicas al entrar en pestaña
      if (targetId === 'tab-dashboard') loadDashboardData();
      if (targetId === 'tab-inventario') loadProductos();
      if (targetId === 'tab-pos') preparePOS();
      if (targetId === 'tab-ventas') loadVentas();
      if (targetId === 'tab-clientes') loadClientes();
    });
  });

  document.getElementById('btn-quick-sale')?.addEventListener('click', () => {
    document.getElementById('nav-pos').click();
  });
}

// ================= DASHBOARD =================
async function loadDashboardData() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/metricas`);
    const data = await res.json();
    if (!data.exito) throw new Error(data.error);

    const { ventas, inventario, clientes, ultimas_ventas } = data.datos;

    document.getElementById('stat-total-ingresos').textContent = formatCurrency(ventas.total_ingresos);
    document.getElementById('stat-total-ventas').textContent = `${ventas.total_ventas} ventas (${ventas.total_anuladas} anuladas)`;
    
    document.getElementById('stat-total-productos').textContent = inventario.total_productos;
    document.getElementById('stat-valor-inventario').textContent = `Valor: ${formatCurrency(inventario.valor_inventario)}`;

    document.getElementById('stat-stock-bajo').textContent = Number(inventario.productos_stock_bajo) + Number(inventario.productos_agotados);
    document.getElementById('stat-productos-agotados').textContent = `${inventario.productos_agotados} agotados | ${inventario.productos_stock_bajo} críticos`;

    document.getElementById('stat-total-clientes').textContent = clientes.total_clientes;

    // Renderizar últimas ventas
    const tbody = document.getElementById('tbody-ultimas-ventas');
    if (!ultimas_ventas || ultimas_ventas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 30px;">Aún no hay transacciones registradas.</td></tr>';
      return;
    }

    tbody.innerHTML = ultimas_ventas.map((v) => `
      <tr>
        <td><strong>#${v.id_venta}</strong></td>
        <td>${v.nombre_cliente}</td>
        <td>${formatDate(v.fecha)}</td>
        <td><strong>${formatCurrency(v.total)}</strong></td>
        <td>
          <span class="badge ${v.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}">
            ${v.estado}
          </span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="verDetalleVenta(${v.id_venta})">Ver Detalle</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(`Error al cargar dashboard: ${err.message}`, 'error');
  }
}

// ================= INVENTARIO =================
async function loadProductos() {
  try {
    const busqueda = document.getElementById('filtro-buscar-producto').value;
    const cat = document.getElementById('filtro-categoria').value;
    const stockBajo = document.getElementById('filtro-stock-bajo').checked;

    let url = `${API_BASE}/productos?`;
    if (busqueda) url += `q=${encodeURIComponent(busqueda)}&`;
    if (cat) url += `id_categoria=${encodeURIComponent(cat)}&`;
    if (stockBajo) url += `stock_bajo=true&`;

    const res = await fetch(url);
    const json = await res.json();
    if (!json.exito) throw new Error(json.error);

    state.productos = json.datos;
    renderProductosTable();
  } catch (err) {
    showToast(`Error cargando inventario: ${err.message}`, 'error');
  }
}

function renderProductosTable() {
  const tbody = document.getElementById('tbody-productos');
  if (state.productos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--text-dim);">No se encontraron productos con los filtros aplicados.</td></tr>';
    return;
  }

  tbody.innerHTML = state.productos.map((p) => {
    let badgeClass = 'badge-success';
    if (p.nivel_stock === 'CRITICO') badgeClass = 'badge-warning';
    if (p.nivel_stock === 'AGOTADO') badgeClass = 'badge-danger';

    return `
      <tr>
        <td>#${p.id_producto}</td>
        <td>
          <strong>${p.nombre}</strong>
          ${p.descripcion ? `<div style="font-size: 11px; color: var(--text-dim);">${p.descripcion}</div>` : ''}
        </td>
        <td><span class="badge badge-neutral">${p.nombre_categoria || '-'}</span></td>
        <td>${p.nombre_proveedor || '-'}</td>
        <td><strong>${formatCurrency(p.precio)}</strong></td>
        <td><strong>${p.stock}</strong> u.</td>
        <td style="color: var(--text-dim);">${p.stock_minimo} u.</td>
        <td>
          <span class="badge ${badgeClass}">${p.nivel_stock}</span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="prepararVentaDirecta(${p.id_producto})" ${p.stock <= 0 ? 'disabled' : ''}>
            🛒 Vender
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ================= CATÁLOGOS =================
async function loadCatalogos() {
  try {
    const [resCat, resProv] = await Promise.all([
      fetch(`${API_BASE}/catalogos/categorias`),
      fetch(`${API_BASE}/catalogos/proveedores`),
    ]);

    const dataCat = await resCat.json();
    const dataProv = await resProv.json();

    state.categorias = dataCat.datos || [];
    state.proveedores = dataProv.datos || [];

    // Llenar selectores
    const selFiltro = document.getElementById('filtro-categoria');
    const selProdCat = document.getElementById('prod-categoria');
    const selProdProv = document.getElementById('prod-proveedor');

    if (selFiltro) {
      selFiltro.innerHTML = '<option value="">Todas las categorías</option>' +
        state.categorias.map((c) => `<option value="${c.id_categoria}">${c.nombre}</option>`).join('');
    }

    if (selProdCat) {
      selProdCat.innerHTML = '<option value="">Seleccione una categoría...</option>' +
        state.categorias.map((c) => `<option value="${c.id_categoria}">${c.nombre}</option>`).join('');
    }

    if (selProdProv) {
      selProdProv.innerHTML = '<option value="">Seleccione un proveedor...</option>' +
        state.proveedores.map((pr) => `<option value="${pr.id_proveedor}">${pr.nombre}</option>`).join('');
    }
  } catch (err) {
    console.error('Error cargando catálogos:', err);
  }
}

// ================= CLIENTES =================
async function loadClientes() {
  try {
    const res = await fetch(`${API_BASE}/clientes`);
    const json = await res.json();
    if (!json.exito) throw new Error(json.error);

    state.clientes = json.datos;
    renderClientesTable();
    updatePosClientSelect();
  } catch (err) {
    showToast(`Error al cargar clientes: ${err.message}`, 'error');
  }
}

function renderClientesTable() {
  const tbody = document.getElementById('tbody-clientes');
  if (!tbody) return;

  if (state.clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-dim);">No hay clientes registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = state.clientes.map((c) => `
    <tr>
      <td>#${c.id_cliente}</td>
      <td><strong>${c.nombre}</strong></td>
      <td><code>${c.cedula || '-'}</code></td>
      <td>${c.telefono || '-'}</td>
      <td>${c.correo || '-'}</td>
      <td>${c.direccion || '-'}</td>
      <td>
        <span class="badge ${c.activo ? 'badge-success' : 'badge-danger'}">
          ${c.activo ? 'ACTIVO' : 'INACTIVO'}
        </span>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="seleccionarClienteVenta(${c.id_cliente})" ${!c.activo ? 'disabled' : ''}>
          Facturar
        </button>
      </td>
    </tr>
  `).join('');
}

function updatePosClientSelect() {
  const sel = document.getElementById('pos-cliente');
  if (!sel) return;
  sel.innerHTML = '<option value="">Seleccione un cliente...</option>' +
    state.clientes
      .filter((c) => c.activo)
      .map((c) => `<option value="${c.id_cliente}">${c.nombre} (${c.cedula || 'Sin cédula'})</option>`)
      .join('');
}

// ================= PUNTO DE VENTA (POS) =================
async function preparePOS() {
  await Promise.all([loadClientes(), loadProductos()]);

  const selProd = document.getElementById('pos-producto-select');
  if (selProd) {
    selProd.innerHTML = '<option value="">Seleccione un producto disponible...</option>' +
      state.productos
        .filter((p) => p.activo && p.stock > 0)
        .map((p) => `<option value="${p.id_producto}" data-stock="${p.stock}" data-precio="${p.precio}">${p.nombre} - $${p.precio} (Stock: ${p.stock})</option>`)
        .join('');
  }
}

function setupPOS() {
  const selProd = document.getElementById('pos-producto-select');
  const cantInput = document.getElementById('pos-cantidad');
  const infoStock = document.getElementById('pos-stock-info');

  selProd?.addEventListener('change', () => {
    const opt = selProd.selectedOptions[0];
    if (opt && opt.value) {
      const stock = Number(opt.dataset.stock);
      const precio = Number(opt.dataset.precio);
      infoStock.textContent = `Disponible: ${stock} unidades | Precio: ${formatCurrency(precio)}`;
      cantInput.max = stock;
      cantInput.value = 1;
    } else {
      infoStock.textContent = '';
    }
  });

  document.getElementById('btn-add-to-cart')?.addEventListener('click', () => {
    const prodId = Number(selProd.value);
    const cantidad = Number(cantInput.value);

    if (!prodId) {
      showToast('Seleccione un producto para agregar', 'error');
      return;
    }

    if (cantidad <= 0 || !Number.isInteger(cantidad)) {
      showToast('La cantidad debe ser un entero mayor a cero', 'error');
      return;
    }

    const prod = state.productos.find((p) => p.id_producto === prodId);
    if (!prod) return;

    if (cantidad > prod.stock) {
      showToast(`Stock insuficiente. Disponible: ${prod.stock}`, 'error');
      return;
    }

    // Verificar si ya está en carrito
    const idx = state.carrito.findIndex((item) => item.id_producto === prodId);
    if (idx >= 0) {
      const nuevaCantidad = state.carrito[idx].cantidad + cantidad;
      if (nuevaCantidad > prod.stock) {
        showToast(`No puede agregar más del stock disponible (${prod.stock})`, 'error');
        return;
      }
      state.carrito[idx].cantidad = nuevaCantidad;
      state.carrito[idx].subtotal = Number((nuevaCantidad * prod.precio).toFixed(2));
    } else {
      state.carrito.push({
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        precio: prod.precio,
        stock: prod.stock,
        cantidad,
        subtotal: Number((cantidad * prod.precio).toFixed(2)),
      });
    }

    renderCarrito();
    showToast(`"${prod.nombre}" agregado al carrito`, 'success');
  });

  document.getElementById('pos-descuento-pct')?.addEventListener('input', calculatePOSTotals);
  document.getElementById('pos-iva-check')?.addEventListener('change', calculatePOSTotals);

  document.getElementById('btn-procesar-venta')?.addEventListener('click', procesarVenta);
}

function renderCarrito() {
  const container = document.getElementById('cart-items-container');
  if (state.carrito.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px 20px;">El carrito está vacío. Agregue productos desde el panel izquierdo.</div>';
    calculatePOSTotals();
    return;
  }

  container.innerHTML = state.carrito.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${item.nombre}</h4>
        <span>${formatCurrency(item.precio)} c/u &bull; Stock máx: ${item.stock}</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="ajustarCantidadCarrito(${idx}, -1)">&minus;</button>
        <span class="qty-display">${item.cantidad}</span>
        <button class="qty-btn" onclick="ajustarCantidadCarrito(${idx}, 1)">&plus;</button>
        <strong style="min-width: 60px; text-align: right;">${formatCurrency(item.subtotal)}</strong>
        <button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${idx})" style="padding: 4px 8px;">&times;</button>
      </div>
    </div>
  `).join('');

  calculatePOSTotals();
}

window.ajustarCantidadCarrito = function (idx, delta) {
  const item = state.carrito[idx];
  if (!item) return;

  const nuevaCant = item.cantidad + delta;
  if (nuevaCant <= 0) {
    state.carrito.splice(idx, 1);
  } else if (nuevaCant > item.stock) {
    showToast(`Stock máximo alcanzado (${item.stock})`, 'error');
    return;
  } else {
    item.cantidad = nuevaCant;
    item.subtotal = Number((nuevaCant * item.precio).toFixed(2));
  }
  renderCarrito();
};

window.eliminarDelCarrito = function (idx) {
  state.carrito.splice(idx, 1);
  renderCarrito();
};

function calculatePOSTotals() {
  let subtotal = 0;
  for (const item of state.carrito) {
    subtotal += item.subtotal;
  }
  subtotal = Number(subtotal.toFixed(2));

  const descPct = Number(document.getElementById('pos-descuento-pct')?.value) || 0;
  const aplicarIva = document.getElementById('pos-iva-check')?.checked || false;

  const descuento = Number((subtotal * (descPct / 100)).toFixed(2));
  const base = Number((subtotal - descuento).toFixed(2));
  const iva = aplicarIva ? Number((base * 0.15).toFixed(2)) : 0;
  const total = Number((base + iva).toFixed(2));

  document.getElementById('pos-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('pos-total-general').textContent = formatCurrency(total);

  return { subtotal, descuento, iva, total };
}

async function procesarVenta() {
  const idCliente = Number(document.getElementById('pos-cliente').value);
  if (!idCliente) {
    showToast('Seleccione un cliente para la venta', 'error');
    return;
  }

  if (state.carrito.length === 0) {
    showToast('El carrito debe contener al menos un producto', 'error');
    return;
  }

  const descPct = Number(document.getElementById('pos-descuento-pct')?.value) || 0;
  const aplicarIva = document.getElementById('pos-iva-check')?.checked || false;

  const payload = {
    id_cliente: idCliente,
    items: state.carrito.map((i) => ({
      id_producto: i.id_producto,
      cantidad: i.cantidad,
    })),
    porcentajeDescuento: descPct,
    porcentajeIVA: aplicarIva ? 15 : 0,
  };

  const btn = document.getElementById('btn-procesar-venta');
  btn.disabled = true;
  btn.textContent = 'Procesando en Supabase...';

  try {
    const res = await fetch(`${API_BASE}/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.exito) throw new Error(json.error);

    showToast(`¡Venta #${json.datos.id_venta} registrada exitosamente!`, 'success');

    // Limpiar carrito
    state.carrito = [];
    renderCarrito();
    document.getElementById('pos-cliente').value = '';
    document.getElementById('pos-stock-info').textContent = '';

    // Mostrar el recibo
    verDetalleVenta(json.datos.id_venta);

    // Actualizar datos
    await Promise.all([loadDashboardData(), loadProductos()]);
  } catch (err) {
    showToast(`Error al procesar venta: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💳 Confirmar y Registrar Venta';
  }
}

window.prepararVentaDirecta = function (idProducto) {
  document.getElementById('nav-pos').click();
  setTimeout(() => {
    const sel = document.getElementById('pos-producto-select');
    if (sel) {
      sel.value = idProducto;
      sel.dispatchEvent(new Event('change'));
    }
  }, 200);
};

window.seleccionarClienteVenta = function (idCliente) {
  document.getElementById('nav-pos').click();
  setTimeout(() => {
    const sel = document.getElementById('pos-cliente');
    if (sel) sel.value = idCliente;
  }, 200);
};

// ================= HISTORIAL VENTAS =================
async function loadVentas() {
  try {
    const estado = document.getElementById('filtro-ventas-estado')?.value;
    let url = `${API_BASE}/ventas?`;
    if (estado) url += `estado=${encodeURIComponent(estado)}`;

    const res = await fetch(url);
    const json = await res.json();
    if (!json.exito) throw new Error(json.error);

    state.ventas = json.datos;
    renderVentasTable();
  } catch (err) {
    showToast(`Error cargando ventas: ${err.message}`, 'error');
  }
}

function renderVentasTable() {
  const tbody = document.getElementById('tbody-ventas');
  if (!tbody) return;

  if (state.ventas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 30px;">No se encontraron registros de ventas.</td></tr>';
    return;
  }

  tbody.innerHTML = state.ventas.map((v) => `
    <tr>
      <td><strong>#${v.id_venta}</strong></td>
      <td><strong>${v.nombre_cliente}</strong></td>
      <td><code>${v.cedula_cliente || '-'}</code></td>
      <td>${formatDate(v.fecha)}</td>
      <td><strong>${formatCurrency(v.total)}</strong></td>
      <td>${v.cantidad_items || 0} prod.</td>
      <td>
        <span class="badge ${v.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}">
          ${v.estado}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" onclick="verDetalleVenta(${v.id_venta})">Detalle</button>
          ${v.estado === 'COMPLETADA' ? `<button class="btn btn-danger btn-sm" onclick="anularVenta(${v.id_venta})">Anular</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

window.verDetalleVenta = async function (idVenta) {
  try {
    const res = await fetch(`${API_BASE}/ventas/${idVenta}`);
    const json = await res.json();
    if (!json.exito) throw new Error(json.error);

    const v = json.datos;
    document.getElementById('modal-detalle-title').textContent = `Recibo de Venta #${v.id_venta}`;

    const body = document.getElementById('modal-detalle-body');
    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
        <div>
          <h4 style="font-size: 15px;">Cliente: ${v.nombre_cliente}</h4>
          <div style="font-size: 13px; color: var(--text-muted);">Cédula: ${v.cedula_cliente || 'N/A'}</div>
          ${v.correo_cliente ? `<div style="font-size: 13px; color: var(--text-muted);">Email: ${v.correo_cliente}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: var(--text-dim);">${formatDate(v.fecha)}</div>
          <span class="badge ${v.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}" style="margin-top: 6px;">
            ${v.estado}
          </span>
        </div>
      </div>

      <h5 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 10px;">Artículos Facturados</h5>
      <table class="custom-table" style="font-size: 13px; margin-bottom: 18px;">
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">P. Unit</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${(v.detalles || []).map((d) => `
            <tr>
              <td>${d.nombre_producto}</td>
              <td style="text-align: center;">${d.cantidad}</td>
              <td style="text-align: right;">${formatCurrency(d.precio_unitario)}</td>
              <td style="text-align: right;"><strong>${formatCurrency(d.subtotal)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 18px; font-weight: 800; border-top: 1px dashed var(--border-color); padding-top: 14px;">
        Total: <span style="color: #60a5fa;">${formatCurrency(v.total)}</span>
      </div>
    `;

    document.getElementById('modal-detalle-venta').classList.add('show');
  } catch (err) {
    showToast(`Error al ver detalle: ${err.message}`, 'error');
  }
};

window.anularVenta = async function (idVenta) {
  if (!confirm(`¿Está seguro de anular la venta #${idVenta}? El stock de los productos será restituido automáticamente en Supabase.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/ventas/${idVenta}/anular`, { method: 'POST' });
    const json = await res.json();
    if (!json.exito) throw new Error(json.error);

    showToast(json.mensaje, 'success');
    await Promise.all([loadVentas(), loadDashboardData(), loadProductos()]);
  } catch (err) {
    showToast(`Error al anular venta: ${err.message}`, 'error');
  }
};

// ================= MODALES =================
function setupModals() {
  // Modal Producto
  const modalProd = document.getElementById('modal-producto');
  document.getElementById('btn-modal-nuevo-producto')?.addEventListener('click', () => {
    document.getElementById('form-producto').reset();
    modalProd.classList.add('show');
  });
  document.getElementById('modal-producto-close')?.addEventListener('click', () => modalProd.classList.remove('show'));
  document.getElementById('modal-producto-cancel')?.addEventListener('click', () => modalProd.classList.remove('show'));

  document.getElementById('modal-producto-save')?.addEventListener('click', async () => {
    const nombre = document.getElementById('prod-nombre').value;
    const descripcion = document.getElementById('prod-descripcion').value;
    const precio = document.getElementById('prod-precio').value;
    const stock = document.getElementById('prod-stock').value;
    const stock_minimo = document.getElementById('prod-stock-minimo').value;
    const id_categoria = document.getElementById('prod-categoria').value;
    const id_proveedor = document.getElementById('prod-proveedor').value;

    try {
      const res = await fetch(`${API_BASE}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion,
          precio,
          stock,
          stock_minimo,
          id_categoria,
          id_proveedor,
        }),
      });
      const json = await res.json();
      if (!json.exito) throw new Error(json.error);

      showToast('¡Producto registrado con éxito!', 'success');
      modalProd.classList.remove('show');
      loadProductos();
      loadDashboardData();
    } catch (err) {
      showToast(`Error al guardar producto: ${err.message}`, 'error');
    }
  });

  // Modal Cliente
  const modalCli = document.getElementById('modal-cliente');
  document.getElementById('btn-modal-nuevo-cliente')?.addEventListener('click', () => {
    document.getElementById('form-cliente').reset();
    modalCli.classList.add('show');
  });
  document.getElementById('modal-cliente-close')?.addEventListener('click', () => modalCli.classList.remove('show'));
  document.getElementById('modal-cliente-cancel')?.addEventListener('click', () => modalCli.classList.remove('show'));

  document.getElementById('modal-cliente-save')?.addEventListener('click', async () => {
    const nombre = document.getElementById('cli-nombre').value;
    const cedula = document.getElementById('cli-cedula').value;
    const telefono = document.getElementById('cli-telefono').value;
    const correo = document.getElementById('cli-correo').value;
    const direccion = document.getElementById('cli-direccion').value;

    try {
      const res = await fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, cedula, telefono, correo, direccion }),
      });
      const json = await res.json();
      if (!json.exito) throw new Error(json.error);

      showToast('¡Cliente registrado con éxito!', 'success');
      modalCli.classList.remove('show');
      loadClientes();
    } catch (err) {
      showToast(`Error al guardar cliente: ${err.message}`, 'error');
    }
  });

  // Modal Detalle Venta
  const modalDetalle = document.getElementById('modal-detalle-venta');
  document.getElementById('modal-detalle-close')?.addEventListener('click', () => modalDetalle.classList.remove('show'));
  document.getElementById('modal-detalle-btn-close')?.addEventListener('click', () => modalDetalle.classList.remove('show'));
}

// ================= TEST RUNNER LIVE =================
function setupTestTab() {
  document.getElementById('btn-run-live-health')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-live-health');
    btn.disabled = true;
    btn.textContent = 'Verificando servicios...';

    try {
      const start = performance.now();
      const res = await fetch(`${API_BASE}/health`);
      const latency = Math.round(performance.now() - start);
      const json = await res.json();

      if (json.exito && json.estado === 'UP') {
        showToast(`✅ Verificación en vivo exitosa: API y Supabase operativos (${latency}ms)`, 'success');
      } else {
        showToast(`⚠️ Respuesta inesperada: ${JSON.stringify(json)}`, 'error');
      }
    } catch (err) {
      showToast(`❌ Error al conectar: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🩺 Ejecutar Verificación en Vivo';
    }
  });
}

// ================= INICIALIZACIÓN =================
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupPOS();
  setupModals();
  setupTestTab();

  // Filtros dinámicos
  document.getElementById('btn-refresh-dashboard')?.addEventListener('click', loadDashboardData);
  document.getElementById('btn-recargar-productos')?.addEventListener('click', loadProductos);
  document.getElementById('filtro-buscar-producto')?.addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(loadProductos, 300);
  });
  document.getElementById('filtro-categoria')?.addEventListener('change', loadProductos);
  document.getElementById('filtro-stock-bajo')?.addEventListener('change', loadProductos);

  document.getElementById('filtro-ventas-estado')?.addEventListener('change', loadVentas);
  document.getElementById('btn-recargar-ventas')?.addEventListener('click', loadVentas);

  // Carga inicial paralela
  await Promise.all([
    loadCatalogos(),
    loadDashboardData(),
    loadProductos(),
  ]);
});
