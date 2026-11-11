/* =====================================================================
   Priority One y Papa's Store · Tienda en línea conectada a Supabase
   No necesitas editar este archivo: la configuración está en config.js
   ===================================================================== */
'use strict';
const T = window.TIENDA || {};
const BRAND = Object.assign({legal:'', ciudad:'Caracas'}, T.marca || {});

/* ===================== utilidades ===================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2 = n => Math.round((+n + Number.EPSILON) * 100) / 100;
const usd = n => '$' + Number(n || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const bs = n => 'Bs. ' + Number(n || 0).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2});
const addMonths = (d,n) => { const x = new Date(d); x.setMonth(x.getMonth()+n); return x; };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const dayStart = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const days = (a,b) => Math.round((dayStart(b) - dayStart(a)) / 864e5);
const fd = d => d ? new Date(d).toLocaleDateString('es-VE',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fdt = d => d ? new Date(d).toLocaleString('es-VE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
const dateOnly = s => s ? new Date(String(s).slice(0,10) + 'T12:00:00') : null;
const sum = (a,f) => a.reduce((s,x)=>s+(+f(x)||0),0);
const parseAmt = s => { s = String(s ?? '').trim().replace(/\s/g,''); if(/,\d{1,2}$/.test(s)) s = s.replace(/\./g,'').replace(',','.'); else s = s.replace(/,/g,''); return +s; };
const ICO = {
  upload:'<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  cart:'<path d="M3 4h2l2.4 11h11l2-8H6.2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
  bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  store:'<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  grid:'<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  chat:'<path d="M4 20l1.5-4A8 8 0 1 1 9 19.5z"/>',
};
const ico = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg>`;

/* ===================== imágenes de producto ===================== */
let gid = 0;
function shade(hex, amt){
  hex = /^#[0-9a-f]{3}$/i.test(hex) ? '#' + hex.slice(1).split('').map(c=>c+c).join('') : hex;
  if(!/^#[0-9a-f]{6}$/i.test(hex)) hex = '#777777';
  const n = parseInt(hex.slice(1),16); const ch=[n>>16, n>>8&255, n&255];
  return '#' + ch.map(v=>Math.max(0,Math.min(255,Math.round(amt<0 ? v*(1+amt) : v+(255-v)*amt)))).map(x=>x.toString(16).padStart(2,'0')).join('');
}
function img(p, colorIdx=0){
  if(p.img) return `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">`;
  const id='g'+(gid++); const c=p.colors[colorIdx]?.hex || p.colors[0]?.hex || '#777'; const d=shade(c,-.32), l=shade(c,.28);
  const wall = p.wall && p.wall.length===2 ? p.wall : ['#888','#222'];
  const defs = `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${l}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${esc(wall[0])}"/><stop offset="1" stop-color="${esc(wall[1])}"/></linearGradient></defs>`;
  const shadow = `<ellipse cx="120" cy="232" rx="78" ry="5" fill="#0b1626" opacity=".10"/>`;
  let g='';
  if(p.shape==='tablet') g = `
    <rect x="30" y="38" width="196" height="140" rx="14" fill="url(#${id}b)"/>
    <rect x="18" y="56" width="200" height="142" rx="14" fill="#1b1d22"/>
    <rect x="24" y="62" width="188" height="130" rx="9" fill="url(#${id}s)"/>
    <text x="118" y="125" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="300" fill="#fff">10:30</text>
    <rect x="44" y="150" width="34" height="26" rx="6" fill="#fff" opacity=".16"/><rect x="84" y="150" width="34" height="26" rx="6" fill="#fff" opacity=".16"/><rect x="124" y="150" width="34" height="26" rx="6" fill="#fff" opacity=".16"/><rect x="164" y="150" width="34" height="26" rx="6" fill="#fff" opacity=".16"/>`;
  else if(p.shape==='watch') g = `
    <rect x="94" y="14" width="52" height="212" rx="12" fill="${d}"/>
    <rect x="94" y="14" width="52" height="212" rx="12" fill="url(#${id}b)" opacity=".55"/>
    <rect x="76" y="62" width="88" height="110" rx="26" fill="url(#${id}b)"/>
    <rect x="84" y="70" width="72" height="94" rx="20" fill="#08090b"/>
    <rect x="164" y="98" width="6" height="20" rx="3" fill="${d}"/>
    <text x="120" y="115" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="300" fill="#fff">10:30</text>
    <circle cx="104" cy="138" r="7" fill="none" stroke="#e1543e" stroke-width="3"/><circle cx="120" cy="138" r="7" fill="none" stroke="#5ac46a" stroke-width="3"/><circle cx="136" cy="138" r="7" fill="none" stroke="#3aa0e6" stroke-width="3"/>`;
  else if(p.shape==='buds') g = `
    <rect x="60" y="102" width="120" height="100" rx="46" fill="url(#${id}b)"/>
    <path d="M62 132 H178" stroke="${d}" stroke-width="1.5" opacity=".6"/>
    <rect x="112" y="150" width="16" height="5" rx="2.5" fill="${d}" opacity=".7"/>
    <g><circle cx="92" cy="70" r="20" fill="url(#${id}b)"/><rect x="84" y="72" width="15" height="44" rx="7.5" fill="url(#${id}b)"/><circle cx="96" cy="66" r="7" fill="${d}" opacity=".55"/></g>
    <g><circle cx="148" cy="70" r="20" fill="url(#${id}b)"/><rect x="141" y="72" width="15" height="44" rx="7.5" fill="url(#${id}b)"/><circle cx="144" cy="66" r="7" fill="${d}" opacity=".55"/></g>`;
  else if(p.shape==='charger') g = `
    <rect x="102" y="30" width="8" height="26" rx="2" fill="#a9adb6"/><rect x="128" y="30" width="8" height="26" rx="2" fill="#a9adb6"/>
    <rect x="72" y="54" width="94" height="104" rx="14" fill="url(#${id}b)"/>
    <rect x="104" y="112" width="30" height="9" rx="4.5" fill="#2b2e35"/>
    <path d="M119 158 C119 214 196 214 192 150" fill="none" stroke="${shade(c,-.12)}" stroke-width="7" stroke-linecap="round"/>
    <rect x="184" y="118" width="16" height="34" rx="5" fill="url(#${id}b)"/>`;
  else if(p.shape==='case') g = `
    <rect x="58" y="18" width="100" height="204" rx="21" fill="url(#${id}b)"/>
    <rect x="68" y="30" width="48" height="68" rx="15" fill="#e9ecf1"/>
    <rect x="58" y="18" width="100" height="204" rx="21" fill="none" stroke="${d}" stroke-width="3"/>
    <rect x="108" y="36" width="94" height="194" rx="19" fill="#d7e3f1" opacity=".75" stroke="#a9bbd2" stroke-width="1.5"/>
    <path d="M118 120 L192 70 L192 98 L118 148 Z" fill="#fff" opacity=".45"/>`;
  else g = `
    <rect x="50" y="16" width="96" height="202" rx="19" fill="url(#${id}b)"/>
    <rect x="60" y="28" width="44" height="64" rx="14" fill="${d}" opacity=".85"/>
    <circle cx="75" cy="45" r="10" fill="#14161b" stroke="#3a3e47" stroke-width="3"/><circle cx="75" cy="45" r="4" fill="#26406b"/>
    <circle cx="75" cy="75" r="10" fill="#14161b" stroke="#3a3e47" stroke-width="3"/><circle cx="75" cy="75" r="4" fill="#26406b"/>
    <circle cx="94" cy="60" r="3.5" fill="#f3efe2"/>
    <rect x="96" y="24" width="98" height="204" rx="19" fill="#17191e"/>
    <rect x="194" y="70" width="3" height="30" rx="1.5" fill="${d}"/>
    <rect x="100" y="28" width="90" height="196" rx="16" fill="url(#${id}s)"/>
    <rect x="132" y="36" width="26" height="8" rx="4" fill="#07080a"/>
    <text x="145" y="84" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="300" fill="#fff">10:30</text>
    <path d="M100 150 L190 92 L190 128 L100 186 Z" fill="#fff" opacity=".06"/>`;
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)}">${defs}${shadow}${g}</svg>`;
}

/* ===================== catálogos fijos ===================== */
// categorías que el admin puede usar; en la tienda solo se muestran las que tienen productos
const CATS = ['Teléfonos','Tablets','Smartwatch','Audio','Accesorios'];
const catsEnUso = () => CATS.filter(c=>S.products.some(p=>p.active!==false && p.cat===c));
const METODOS = {
  pago_movil:{n:'Pago móvil', cur:'Bs'}, transferencia:{n:'Transferencia bancaria', cur:'Bs'},
  usdt:{n:'USDT (Binance)', cur:'USD'}, efectivo:{n:'Efectivo', cur:'USD', sinComprobante:true}
};
// métodos con los que el cliente sube un comprobante (el efectivo lo registra la tienda)
const METODOS_COMP = Object.keys(METODOS).filter(k=>!METODOS[k].sinComprobante);
// pedidos viejos que se pagaron en efectivo
const metN = k => METODOS[k]?.n || ({efectivo:'Efectivo', zelle:'Zelle'})[k] || k;
const BANKS = ['Banesco','Mercantil','Provincial','Banco de Venezuela','BNC','Bancamiga','Bancaribe','Banco del Tesoro','Banplus','Exterior','Otro'];
const PED = {pendiente_pago:'Pendiente de pago', pago_en_revision:'Pago en revisión', credito_en_evaluacion:'Crédito en evaluación', pago_rechazado:'Pago rechazado',
  preparando:'Preparando', listo_retiro:'Listo para retiro', enviado:'Enviado', entregado:'Entregado', cancelado:'Cancelado'};
const CRE = {evaluacion:'En evaluación', activo:'Activo', en_mora:'En mora', liquidado:'Liquidado', rechazado:'Rechazado', cancelado:'Cancelado'};

/* ===================== estado ===================== */
const S = {
  today: new Date(), cfg:null, products:[], session:null, me:null,
  users:[], orders:[], credits:[], payments:[], notifs:[], audit:[], cupo:null,
  cart: loadCart(), coupon:'', route:{v:'inicio'}, after:null,
  f:{store:null, cat:null, brands:[], max:'', fin:'', stock:false, sort:'rel', q:''}, homeFin:'', coStore:null, logoFile:null,
  pd:{color:0, storage:0, qty:1}, sim:null,
  co:null, acct:'resumen', adm:'resumen', admF:{pagos:'todos', cred:'todos', ped:'activos', cli:'pendiente', pos:'activas', ven:'todas'},
  busy:false, ready:false, kyc:null, post:null, posts:[],
  stores:[], cupos:{}, admStore:0, cfgStore:0, encs:[], enc:null,
};
let sb = null;
const P = id => S.products.find(p=>p.id===id);
const U = id => S.users.find(u=>u.id===id);
const O = id => S.orders.find(o=>o.id===id);
const C = id => S.credits.find(c=>c.id===id);
const me = () => S.me;
const isAdmin = () => S.me?.role==='admin';
const myStore = () => isAdmin() ? (S.me.store ?? null) : null;          // tienda del admin (null = admin general)
const isGenAdmin = () => isAdmin() && S.me.store == null;
const ST = id => S.stores.find(t=>t.id===id) || {id, name:'Tienda', short:'T', pay:{}, frases:[], whatsapp:'', slogan:''};
const finStores = () => S.stores.filter(t=>t.cuotas);
const cashStores = () => S.stores.filter(t=>!t.cuotas);
const siteName = () => S.stores.map(t=>t.name).join(' y ') || 'la tienda';
// lo que ve el admin: su tienda, o la elegida en el selector si es admin general
const inAdm = x => { const t = myStore() ?? (S.admStore || null); return t==null || x.store===t; };
const admStoreId = () => myStore() ?? (S.admStore || null);
// ¿la tienda del panel vende en cuotas? (Papa's Store no: se ocultan créditos, cuotas y mora)
const admCuo = () => { const t = admStoreId(); return t==null || ST(t).cuotas; };
const unitPrice = (p, si=0, acc=false) => p.price + (p.storages && p.storages[si] ? +p.storages[si].d || 0 : 0) + (acc && p.acc!=null ? p.acc : 0);
// precio en bolívares: el precio en dólares, más el ajuste para pagos en Bs, a la tasa
// cada tienda publica su tasa y su ajuste para pagos en bolívares; sin tasa no se cobra en Bs
const tasaOk = store => !!ST(store).tasa;
const bsPrice = (u, store) => { const t = ST(store); return t.tasa ? r2(u*(1+(t.recargoBs||0))*t.tasa) : null; };
const bsTxt = (u, store) => { const v = bsPrice(u, store); return v==null ? 'por confirmar' : bs(v); };
// métodos que la tienda tiene configurados (y los de bolívares solo si publicó su tasa)
const storeMethods = store => { const t = ST(store), d = t.pay || {};
  const l = Object.keys(METODOS).filter(k => (d[k]||'').trim() && (METODOS[k].cur!=='Bs' || t.tasa));
  return l.length ? l : ['efectivo']; };
const LEGAL_VERSION = '2026-11';

function loadCart(){ try{ const c = JSON.parse(localStorage.getItem('carrito') || '[]'); return Array.isArray(c) ? c : []; }catch(e){ return []; } }
function saveCart(){ try{ localStorage.setItem('carrito', JSON.stringify(S.cart)); }catch(e){} }

/* ===================== conversión de datos ===================== */
function mapCfg(c){
  return { tasa:+c.tasa, recargoBs:+(c.recargo_bs||0), mora:+c.mora, inicialMin:+c.inicial_min, inicialMax:+c.inicial_max, minFin:+c.min_financiable,
    plans:Object.fromEntries(Object.entries(c.planes).map(([k,v])=>[k,+v])), reservaHoras:c.reserva_horas,
    cupoBase:+c.cupo_base, cupoPorLiq:+c.cupo_por_liquidado, cupoMax:+c.cupo_max, maxCreditos:c.max_creditos,
    envio:Object.fromEntries(Object.entries(c.envio).map(([k,v])=>[k,{n:v.nombre, c:+v.costo, d:v.detalle}])),
    envioGratis:+c.envio_gratis_desde, cupon:{code:c.cupon_codigo||'', pct:+c.cupon_pct}, datosPago:c.datos_pago||{}, postulacion:c.postulacion||null };
}
function mapStore(t){
  const ini = String(t.nombre||'').replace(/[^A-Za-z0-9 ]/g,'').split(/\s+/).filter(Boolean).map(w=>/^one$/i.test(w)?'1':w[0]).join('').slice(0,2).toUpperCase();
  return { id:t.id, slug:t.slug, name:t.nombre, short:ini||'T', logo:t.logo_url||'', color:t.color||'#D2AE3E', slogan:t.eslogan||'',
    frases:Array.isArray(t.frases)?t.frases:[], cuotas:t.acepta_cuotas!==false, whatsapp:t.whatsapp||'', correo:t.correo||'', rif:t.rif||'', addr:t.direccion||'', horario:t.horario||'', pay:t.datos_pago||{}, rep:t.representante||'', repCed:t.rep_cedula||'',
    tasa:t.tasa!=null&&+t.tasa>0?+t.tasa:null, recargoBs:+(t.recargo_bs||0), tasaAt:t.tasa_actualizada_en?new Date(t.tasa_actualizada_en):null,
    garCubre:t.garantia_cubre||'60 días por fallas ocultas (bocina, cámaras, pantalla y pin de carga).',
    garExcluye:t.garantia_excluye||'Equipos que ingresen mojados, quemados, partidos, con caídas o manipulados por otro técnico sin nuestra autorización.' };
}
function mapProduct(p){
  return { id:p.id, store:p.tienda_id||1, brand:p.marca, name:p.nombre, cat:p.categoria, shape:p.forma, price:+p.precio, stock:p.stock,
    colors:(p.colores && p.colores.length ? p.colores : [{n:'Único', hex:'#777'}]), storages:(p.capacidades && p.capacidades.length ? p.capacidades : null),
    specs:p.specs||{}, desc:p.descripcion||'', wall:p.pantalla, img:p.imagen_url||'', active:p.activo, fin:p.financiable!==false,
    ini:p.inicial_min!=null?+p.inicial_min:null, plans:Array.isArray(p.planes)&&p.planes.length?p.planes.map(Number):null,
    cond:p.condicion||'nuevo', bat:p.bateria??null, gar:p.garantia_meses??null, cs:p.cuotas_semanal??null, cq:p.cuotas_quincenal??null,
    gama:p.gama||(+p.precio<200?'baja':+p.precio<500?'media':'alta'), acc:p.accesorios_extra!=null?+p.accesorios_extra:null, accDesc:p.accesorios_desc||'' };
}
function mapUser(u){ return {id:u.id, store:u.tienda_id ?? null, name:u.nombre, sexo:u.sexo||'', cedula:u.cedula, phone:u.telefono||'', email:u.email||'', addr:u.direccion||'', city:u.ciudad||'', role:u.rol, created:new Date(u.creado_en),
  verif:u.verificacion || (u.rol==='admin'?'verificado':'incompleto'), verifNota:u.verificacion_nota||'', nac:u.fecha_nacimiento||'', estadoVzla:u.estado_vzla||'', ocup:u.ocupacion||'', trabajo:u.lugar_trabajo||'',
  ingreso:u.ingreso_rango||'', refNom:u.ref_nombre||'', refTel:u.ref_telefono||'', refPar:u.ref_parentesco||'', cedulaFoto:u.cedula_foto||'', selfieFoto:u.selfie_foto||'',
  legalAt:u.legal_aceptado_en?new Date(u.legal_aceptado_en):null, legalV:u.legal_version||'', lat:u.ubic_lat!=null?+u.ubic_lat:null, lng:u.ubic_lng!=null?+u.ubic_lng:null, acc:u.ubic_precision}; }

/* ===================== carga de datos ===================== */
async function q(table, order){
  let qb = sb.from(table).select('*');
  if(order) qb = qb.order(order[0], {ascending: order[1] !== false});
  const {data, error} = await qb;
  if(error) throw error;
  return data || [];
}
async function loadPublic(){
  const [prods, cfg, tds] = await Promise.all([q('productos', ['orden']), q('configuracion'), q('tiendas', ['orden'])]);
  S.stores = tds.filter(t=>t.activo!==false).map(mapStore);
  if(!S.stores.length) throw new Error('No se encontraron las tiendas. ¿Ejecutaste supabase/instalar_todo.sql en Supabase?');
  S.products = prods.map(mapProduct);
  if(!cfg[0]) throw new Error('No se encontró la configuración. ¿Ejecutaste supabase/instalar_todo.sql en Supabase?');
  S.cfg = mapCfg(cfg[0]);
}
async function loadPrivate(){
  S.users=[]; S.orders=[]; S.credits=[]; S.payments=[]; S.notifs=[]; S.audit=[]; S.cupo=null; S.cupos={}; S.me=null; S.encs=[];
  if(!S.session) return;
  const uid = S.session.user.id;
  const [pf, pe, it, cr, cu, pa, pc, no] = await Promise.all([q('perfiles'), q('pedidos',['id',false]), q('pedido_items'), q('creditos',['id',false]),
    q('cuotas',['numero']), q('pagos',['id',false]), q('pago_cuotas'), q('notificaciones',['id',false])]);
  S.users = pf.map(mapUser);
  S.me = S.users.find(u=>u.id===uid) || null;
  if(!S.me){ toast('Tu cuenta no tiene perfil. Escribe a la tienda para revisarlo.'); return; }
  S.orders = pe.map(o=>({ id:o.id, store:o.tienda_id||1, code:o.codigo, userId:o.usuario_id, mode:o.modalidad, method:o.metodo_pago,
    ship:{method:o.envio_metodo, addr:o.direccion, city:o.ciudad}, subtotal:+o.subtotal, discount:+o.descuento, shipCost:+o.envio_costo, total:+o.total,
    st:o.estado, status:PED[o.estado]||o.estado, created:new Date(o.creado_en), deadline:o.reservado_hasta?new Date(o.reservado_hasta):null,
    tracking:o.guia, courier:o.transporte, cancelReason:o.motivo_cancelacion, creditId:null,
    items: it.filter(i=>i.pedido_id===o.id).map(i=>({pid:i.producto_id, name:i.nombre, color:i.color, ci:i.color_idx, storage:i.capacidad, si:i.cap_idx, qty:i.cantidad, unit:+i.precio_unitario, acc:!!i.accesorios})) }));
  const cuotaById = {};
  S.credits = cr.map(c=>{
    const cuotas = cu.filter(x=>x.credito_id===c.id).map(x=>{ const q={id:x.id, n:x.numero, due:dateOnly(x.vence), amount:+x.monto, mora:+x.mora, moraAt:dateOnly(x.mora_aplicada_en), status:x.estado, paidAt:dateOnly(x.pagada_en)}; cuotaById[x.id]=q; return q; });
    return { id:c.id, store:c.tienda_id||1, code:c.codigo, orderId:c.pedido_id, userId:c.usuario_id, base:+c.monto_base, down:+c.inicial, iniPct:+c.inicial_pct,
      financed:+c.monto_financiado, n:c.n_cuotas, freq:({semanal:'semanales', quincenal:'quincenales'})[c.frecuencia]||'mensuales', pct:+c.recargo_pct, st:c.estado, status:CRE[c.estado]||c.estado, approved:c.aprobado_en?new Date(c.aprobado_en):null, contrato:c.contrato||null, cuotas };
  });
  S.credits.forEach(c=>{ const o=O(c.orderId); if(o) o.creditId=c.id; });
  S.payments = pa.map(g=>({ id:g.id, store:g.tienda_id||1, code:g.codigo, userId:g.usuario_id, orderId:g.pedido_id, creditId:g.credito_id, kind:g.tipo, method:g.metodo,
    currency:g.moneda==='VES'?'Bs':'USD', bank:g.banco, ref:g.referencia, expected:+g.monto_esperado_usd, reported:+g.monto_reportado, tasa:+g.tasa, recargo:+(g.recargo_bs||0),
    path:g.comprobante_path, status:g.estado, note:g.nota, reviewedAt:g.revisado_en?new Date(g.revisado_en):null, created:new Date(g.creado_en),
    cuotas: pc.filter(x=>x.pago_id===g.id).map(x=>cuotaById[x.cuota_id]?.n).filter(Boolean).sort((a,b)=>a-b) }));
  S.notifs = no.map(n=>({id:n.id, at:new Date(n.creado_en), text:n.texto, read:n.leida}));
  try{ S.encs = (await q('encargos',['id',false])).map(e=>({id:e.id, store:e.tienda_id, userId:e.usuario_id, codigo:e.codigo, nombre:e.nombre, telefono:e.telefono, ciudad:e.ciudad, marca:e.marca, modelo:e.modelo,
    capacidad:e.capacidad, color:e.color, pago:e.pago, presupuesto:e.presupuesto!=null?+e.presupuesto:null, notas:e.notas, estado:e.estado, nota:e.nota_interna, creado:new Date(e.creado_en)})); }
  catch(e){ S.encs = []; }
  if(S.me.role==='admin'){
    const bt = await q('bitacora',['id',false]);
    try{ S.tasas = (await q('tasas_historial',['id',false])).map(h=>({store:h.tienda_id, tasa:+h.tasa, rec:+h.recargo_bs, by:h.actor, at:new Date(h.creado_en)})); }catch(e){ S.tasas = []; }
    S.audit = bt.slice(0,400).map(a=>({at:new Date(a.creado_en), by:a.actor, msg:a.accion, store:a.tienda_id}));
    try{ S.posts = (await q('postulaciones',['id',false])).map(p=>({id:p.id, store:p.tienda_id, codigo:p.codigo, nombre:p.nombre, cedula:p.cedula, telefono:p.telefono, ciudad:p.ciudad, respuestas:p.respuestas||{}, estado:p.estado, nota:p.nota, creado:new Date(p.creado_en)})); }
    catch(e){ S.posts = []; }
  } else {
    S.cupos = {};
    await Promise.all(S.stores.map(async t=>{ const {data, error} = await sb.rpc('mi_cupo', {financiado:null, p_tienda:t.id}); if(!error) S.cupos[t.id] = data; }));
    S.cupo = S.cupos[S.stores[0]?.id] || null;
  }
}
async function refresh(){
  S.today = new Date();
  await Promise.all([loadPublic(), loadPrivate()]);
  render();
}

/* ===================== reglas que se muestran en pantalla =====================
   (el servidor vuelve a calcular y validar todo al crear el pedido) */
function shipPrice(m, base){ if(m==='nacional' && base>=S.cfg.envioGratis) return 0; return S.cfg.envio[m]?.c ?? 0; }
const cuotaDue = q => r2(q.amount + q.mora);
const saldo = c => ['activo','en_mora'].includes(c.st) ? r2(sum(c.cuotas.filter(q=>q.status!=='pagada'), cuotaDue)) : 0;
const pendingCuotas = c => c.cuotas.filter(q=>q.status==='pendiente');
const reportedUSD = p => p.currency==='Bs' ? r2(p.reported / (p.tasa*(1+(p.recargo||0)))) : r2(p.reported);
function eligibility(financed, store){
  const k = (store && S.cupos[store]) || S.cupo || {limite:0, usado:0, disponible:0, activos:0, en_mora:false};
  const why = [];
  if(k.en_mora) why.push('Tienes un crédito con cuotas vencidas. Ponte al día para solicitar uno nuevo.');
  if(k.activos >= S.cfg.maxCreditos) why.push(`Ya tienes ${k.activos} créditos abiertos en esta tienda (máximo ${S.cfg.maxCreditos}).`);
  return {limite:+k.limite, usado:+k.usado, disp:+k.disponible, ok:!why.length, why};
}
const cartOf = store => S.cart.filter(i=>P(i.pid)?.store===store);
const cartStores = () => [...new Set(S.cart.map(i=>P(i.pid)?.store).filter(Boolean))];
function cartTotals(store){
  const items = store ? cartOf(store) : S.cart;
  const subtotal = r2(sum(items, i=>i.unit*i.qty));
  let couponOk = false, couponMsg = '';
  if(S.coupon){
    if(!S.cfg.cupon.code || S.coupon !== S.cfg.cupon.code.toUpperCase()) couponMsg = 'El cupón no existe.';
    else if(!me()) couponMsg = 'Se aplicará al iniciar sesión si es tu primera compra.';
    else if(S.orders.some(o=>o.userId===me().id && o.st!=='cancelado')) couponMsg = 'El cupón es solo para la primera compra.';
    else couponOk = true;
  }
  const discount = couponOk ? r2(subtotal*S.cfg.cupon.pct) : 0;
  return {subtotal, discount, couponOk, couponMsg, units: sum(items,i=>i.qty), items};
}
function coCalc(){
  const co = S.co, t = cartTotals(co.store);
  const base = r2(t.subtotal - t.discount);
  const ship = shipPrice(co.ship, base);
  t.items = t.items || [];
  const k = {...t, base, ship, total: r2(base+ship)};
  if(co.mode==='financiado'){
    k.down = r2(base*co.ini); k.financed = r2((base-k.down)*(1+rec(co.n))); k.cuota = r2(k.financed/co.n);
    k.hoy = r2(k.down + ship); k.costoTotal = r2(k.down + k.financed + ship);
  } else k.hoy = k.total;
  return k;
}

/* ===================== componentes ===================== */
const BADGE = {'Pendiente de pago':'warn','Pago en revisión':'warn','Crédito en evaluación':'warn','Pago rechazado':'bad','Preparando':'info','Listo para retiro':'info','Enviado':'info','Entregado':'ok','Cancelado':'',
  'Activo':'info','En mora':'bad','Liquidado':'ok','En evaluación':'warn','Rechazado':'bad', pendiente:'warn', verificado:'ok', aprobado:'ok', rechazado:'bad'};
const LABEL = {pendiente:'Por verificar', verificado:'Verificado', aprobado:'Aprobado', rechazado:'Rechazado'};
const tag = s => `<span class="tag ${BADGE[s]||''}">${esc(LABEL[s]||s)}</span>`;
// recargo opcional según el número de cuotas (si no está en Configuración, no lleva recargo)
const rec = n => +(S.cfg.plans[n] ?? 0);
const finCuota = (price, n=6, ini=S.cfg.inicialMin) => r2(r2(price*(1-ini)*(1+rec(n)))/n);
const allPlans = () => Object.keys(S.cfg.plans).map(Number).sort((a,b)=>a-b);
// inicial y cuotas propias de cada equipo (si el admin no las fijó, se usan las generales)
const pIni = p => p.ini ?? S.cfg.inicialMin;
// el admin define en cuántas cuotas se paga cada equipo (una sola opción); si no lo definió, se usa el plan intermedio
// opciones de cuotas que el admin habilitó para el equipo: [{f:'semanal', n:8}, {f:'quincenal', n:4}]
const pOpts = p => [['semanal', p.cs], ['quincenal', p.cq]].filter(([,n])=>+n>0).map(([f,n])=>({f, n:+n}));
const pPlan = p => pOpts(p)[0]?.n ?? midPlan();
const pPlans = p => [pPlan(p)];
const pShowPlan = p => pPlan(p);
const FREQ = {semanal:'semanales', quincenal:'quincenales', mensual:'mensuales'};
// fecha de la cuota k según la frecuencia (igual que en la base de datos)
const venceCuota = (freq, k, base=S.today) => freq==='semanales'||freq==='semanal' ? addDays(base, 7*k) : freq==='quincenales'||freq==='quincenal' ? addDays(base, 15*k) : addMonths(base, k);
const pFreq = p => FREQ[pOpts(p)[0]?.f] || 'quincenales';
// etiqueta de estado del equipo: "Usado · batería 90% · garantía 2 meses"
const CONDS = {nuevo:'Nuevo', clase_a:'Clase A', clase_b:'Clase B', clase_c:'Clase C', usado:'Usado'};
const GAMAS = {baja:'Gama baja', media:'Gama media', alta:'Gama alta'};
const condN = p => CONDS[p.cond] || 'Nuevo';
const condTxt = p => [condN(p), p.bat?`batería ${p.bat}%`:''].filter(Boolean).join(' · ');
// el mismo monto en bolívares y en dólares; el método elegido queda resaltado
const dualBox = (amt, method, store) => { const isBs = METODOS[method]?.cur==='Bs'; if(!tasaOk(store)) return `<div class="dual"><div class="on"><span>Monto a pagar<small>USDT o efectivo</small></span><b class="num">${usd(amt)}</b></div><div><span>En bolívares<small>Pago móvil o transferencia</small></span><b class="num muted">Pronto</b></div><p>Por ahora esta compra se paga en dólares (USDT o efectivo). Si prefieres pagar en bolívares, escríbenos por WhatsApp.</p></div>`; return `<div class="dual">
  <div class="${isBs?'on':''}"><span>En bolívares<small>Pago móvil o transferencia</small></span><b class="num">${bs(bsPrice(amt, store))}</b></div>
  <div class="${isBs?'':'on'}"><span>En dólares<small>USDT o efectivo</small></span><b class="num">${usd(amt)}</b></div>
  <p><b>Importante:</b> el monto en bolívares y el monto en dólares son distintos. Paga el que corresponde al método que elegiste.</p></div>`; };
// para un pedido con varios equipos: la inicial más alta y las cuotas que todos permiten
const cartFin = items => { const ps = items.map(i=>P(i.pid)).filter(Boolean);
  // frecuencias que todos los equipos del carrito permiten, con el mismo número de cuotas
  const opts = ['semanal','quincenal'].map(f=>{ const ns = ps.map(p=>pOpts(p).find(o=>o.f===f)?.n); return ns.length && ns.every(n=>n && n===ns[0]) ? {f, n:ns[0]} : null; }).filter(Boolean);
  return { ini: Math.max(S.cfg.inicialMin, ...ps.map(pIni)), opts, plans: opts.map(o=>o.n), freq: FREQ[opts[0]?.f]||'quincenales' }; };
// números de cuotas que usan los equipos a la venta (cada admin los escribe por equipo)
const usedPlans = () => [...new Set(S.products.filter(p=>p.active!==false && p.fin).flatMap(p=>pOpts(p).map(o=>o.n)))].sort((a,b)=>a-b);
const midPlan = () => { const ks = usedPlans(); return ks.length ? ks[Math.floor(ks.length/2)] : 8; };
function historial(uid){
  const ords = S.orders.filter(o=>o.userId===uid && o.st!=='cancelado');
  const cr = S.credits.filter(c=>c.userId===uid);
  const quotas = cr.flatMap(c=>c.cuotas);
  return { n:ords.length, vol:r2(sum(S.payments.filter(p=>p.userId===uid && ['verificado','aprobado'].includes(p.status)), reportedUSD)),
    deuda:r2(sum(cr,saldo)), enMora:cr.some(c=>c.st==='en_mora'), moras:quotas.filter(q=>q.moraAt).length,
    pagadas:quotas.filter(q=>q.status==='pagada').length, liq:cr.filter(c=>c.st==='liquidado').length };
}
const concept = p => { const o=O(p.orderId), c=C(p.creditId);
  return p.kind==='contado' ? `Pago de contado · ${o?.code||''}` : p.kind==='inicial' ? `Inicial + envío · ${c?.code||''}` : `Cuota${p.cuotas.length>1?'s':''} ${p.cuotas.join(', ')} · ${c?.code||''}`; };
// botón para subir archivos, siempre en español (el del navegador cambia según su idioma)
const fileBtn = (id, accept, attrs, txt, file) => `<label class="filebtn" for="${id}"><input id="${id}" type="file" accept="${accept}" ${attrs}><span class="fb">${ico('upload')} ${txt}</span><span class="fn ${file?'ok':''}">${file?'✓ '+esc(file.name):'Ningún archivo elegido'}</span></label>`;
const amtTxt = p => p.currency==='Bs' ? `${bs(p.reported)} <span class="muted small">(${usd(reportedUSD(p))})</span>` : usd(p.reported);
const waLink = (txt, store) => { const n = store ? ST(store).whatsapp : (S.stores.find(t=>t.whatsapp)||{}).whatsapp; return n ? `https://wa.me/${encodeURIComponent(n)}?text=${encodeURIComponent(txt)}` : ''; };
// logo de una tienda: la imagen subida o un monograma con sus iniciales
const storeMark = (t, size=30) => t.logo ? `<img class="smark" src="${esc(t.logo)}" alt="${esc(t.name)}" style="height:${size}px">` : `<span class="smark mono" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.4)}px">${esc(t.short)}</span>`;
const storeChip = id => { const t = ST(id); return `<span class="stchip">${storeMark(t,18)}${esc(t.name)}</span>`; };
// texto con formato mínimo (<br> y <em>) para eslóganes escritos en el panel
const richTxt = s => esc(s).replace(/&lt;br\s*\/?&gt;/gi,'<br>').replace(/&lt;(\/?)em&gt;/gi,'<$1em>');

function pcard(p){
  const out = p.stock<=0; const n = pShowPlan(p);
  const opts = p.colors.length>1 || p.storages;
  return `<article class="pc">
    <button class="ph" data-act="pd" data-id="${p.id}" aria-label="Ver ${esc(p.name)}">${img(p)}${out?'<span class="tag">Agotado</span>':p.fin?'<span class="tag ok">Contado o cuotas</span>':'<span class="tag dark">Solo contado</span>'}</button>
    <div class="bd">
      <span class="brandname">${esc(p.brand)} · <span class="by">${esc(ST(p.store).name)}</span></span>
      <button class="nm" data-act="pd" data-id="${p.id}">${esc(p.name)}${p.storages?` ${esc(p.storages[0].n)}`:''}</button>
      <span class="cond ${p.cond!=='nuevo'?'us':''}">${esc(condTxt(p))}</span>
      <span class="pr num">${usd(p.price)}</span>
      ${!ST(p.store).cuotas?'<span class="sp">Pago de contado</span>':p.fin&&p.price>=S.cfg.minFin?(pOpts(p).length?`<span class="cuo">o ${pOpts(p).map(o=>`${o.n} cuotas ${FREQ[o.f]} de ${usd(finCuota(p.price, o.n, pIni(p)))}`).join(' · ')}</span>`:'<span class="sp">Solo pago de contado</span>'):p.fin?`<span class="sp">En cuotas si tu compra suma ${usd(S.cfg.minFin)}</span>`:'<span class="sp">Solo pago de contado</span>'}
      ${!out && p.stock<=5?`<span class="stk">${p.stock===1?'Última unidad':`Últimas ${p.stock} unidades`}</span>`:''}
      <button class="btn ${out?'':'buy'}" ${out?'disabled':''} data-act="${opts?'pd':'add'}" data-id="${p.id}">${out?'Sin existencia':opts?'Ver opciones':'Agregar al carrito'}</button>
    </div></article>`;
}
function track(o){
  if(o.st==='cancelado') return `<div class="note">Pedido cancelado${o.cancelReason?': '+esc(o.cancelReason):''}.</div>`;
  const fin = o.mode==='financiado', ret = o.ship.method==='retiro';
  const st = [fin?'Solicitud recibida':'Pedido recibido', fin?'Crédito aprobado':'Pago verificado', ret?'Listo para retiro':'Preparando', ...(ret?[]:['Enviado']), 'Entregado'];
  const map = {pendiente_pago:1, pago_en_revision:1, credito_en_evaluacion:1, pago_rechazado:1, preparando:2, listo_retiro:2, enviado:3, entregado:st.length};
  const cur = map[o.st] ?? 1;
  return `<div class="track">${st.map((s,i)=>{
    const cls = i<cur ? 'done' : i===cur ? (o.st==='pago_rechazado'?'bad':'cur') : '';
    const label = i===cur && o.st==='pago_rechazado' ? 'Pago rechazado' : i===cur && o.st==='pendiente_pago' ? 'Esperando pago' : i===cur && ['pago_en_revision','credito_en_evaluacion'].includes(o.st) ? (fin?'En evaluación':'Verificando pago') : s;
    return `<span class="${cls}">${label}</span>`;}).join('')}</div>`;
}
const modoN = t => t.cuotas ? 'Compras en cuotas' : 'Compras de contado';
// botón flotante de WhatsApp: el cliente elige con quién hablar según cómo quiere comprar
function renderFab(){
  let el = $('#fabwa'); const list = S.stores.filter(t=>t.whatsapp);
  const hide = !list.length || ['admin','checkout'].includes(S.route.v) || isAdmin();
  if(!el){ el = document.createElement('div'); el.id = 'fabwa'; document.body.appendChild(el); }
  el.hidden = hide; if(hide) return;
  const pst = S.route.v==='producto' && P(S.route.id) ? P(S.route.id).store : null;
  const opts = pst ? list.filter(t=>t.id===pst) : list;
  el.innerHTML = `${S.fab?`<div class="fab-m" role="menu"><b>¿Cómo podemos ayudarte?</b>${opts.map(t=>`<a role="menuitem" href="${waLink(pst?`Hola, quiero información sobre el ${P(S.route.id).name}.`:'Hola, quiero información sobre un teléfono.', t.id)}" target="_blank" rel="noopener">${storeMark(t,26)}<span><b>${modoN(t)}</b><small>${esc(t.name)}${t.horario?' · '+esc(t.horario):''}</small></span></a>`).join('')}</div>`:''}
    <button class="fab-b" data-act="fabwa" aria-expanded="${!!S.fab}" aria-label="Escríbenos por WhatsApp">${ico('chat')}<span>${S.fab?'Cerrar':'Escríbenos'}</span></button>`;
}
function logoHTML(){
  return `<span class="duo">${S.stores.map(t=>`<span class="duo-i">${storeMark(t,32)}<b>${esc(t.name)}</b></span>`).join('<span class="duo-x" aria-hidden="true">×</span>')}</span>`;
}

/* ===================== cabecera / pie ===================== */
function renderChrome(){
  const u = me(); const cnt = sum(S.cart,i=>i.qty);
  const un = u ? S.notifs.filter(n=>!n.read).length : 0;
  $('#strip').innerHTML = ''; $('#strip').parentElement.hidden = true;
  $('#hd').innerHTML = `
    <button class="logo" data-act="go" data-v="inicio" aria-label="Inicio: ${esc(siteName())}">${logoHTML()}</button>
    <form class="search" id="searchf" role="search"><input id="q" placeholder="Buscar un teléfono por marca o modelo…" value="${esc(S.f.q)}" aria-label="Buscar"><button type="submit" aria-label="Buscar">${ico('search')}</button></form>
    <div class="hact">
      ${isAdmin() ? `<button class="hbtn" data-act="go" data-v="admin">${ico('grid')}<span class="lb">Panel<small>${myStore()?esc(ST(myStore()).name):'Administración'}</small></span></button>` : ''}
      ${u && !isAdmin() ? `<button class="hbtn" data-act="acct" data-v="notificaciones" aria-label="Notificaciones">${ico('bell')}${un?`<span class="cnt">${un}</span>`:''}</button>` : ''}
      <button class="hbtn" data-act="${u?(isAdmin()?'go':'acct'):'go'}" data-v="${u?(isAdmin()?'admin':'resumen'):'login'}">${ico('user')}<span class="lb">${u?`Hola, ${esc(u.name.split(' ')[0])}<small>${isAdmin()?'Administrador':'Mi cuenta'}</small>`:'Ingresar'}</span></button>
      ${u?'':`<button class="btn buy sm hreg" data-act="go" data-v="registro">Crear cuenta</button>`}
      <button class="hbtn" data-act="go" data-v="carrito">${ico('cart')}${cnt?`<span class="cnt">${cnt}</span>`:''}<span class="lb">Carrito<small class="num">${usd(sum(S.cart,i=>i.unit*i.qty))}</small></span></button>
    </div>`;
  const v = S.route.v;
  const cu = catsEnUso();
  $('#cats').innerHTML = (cu.length>1 ? cu.map(c=>`<button data-act="cat" data-v="${c}" aria-current="${v==='catalogo' && S.f.cat===c}">${c}</button>`).join('') : '')
    + `<button data-act="cat" data-v="" aria-current="${v==='catalogo' && !S.f.cat && !S.f.store}">${cu.length>1?'Todo el catálogo':'Catálogo'}</button>${S.stores.map(t=>`<button class="stb" data-act="tienda" data-v="${t.id}" aria-current="${v==='catalogo' && S.f.store===t.id}">${esc(t.name)}</button>`).join('')}<button class="sp" data-act="go" data-v="financiamiento" aria-current="${v==='financiamiento'}">Financiamiento</button><button data-act="go" data-v="encargo" aria-current="${v==='encargo'}">Encargos</button><button data-act="go" data-v="trabaja" aria-current="${v==='trabaja'}">Empleos</button>`;
  $('#foot').innerHTML = `<div class="wrap cols">
      <div><div class="logo">${logoHTML()}</div>
        <p style="margin-top:10px;max-width:36ch">Teléfonos originales con garantía, en cuotas o de contado. Pagas desde tu cuenta y te lo enviamos a todo el país.</p></div>
      <div><h4>Ayuda</h4><ul><li><button data-act="go" data-v="financiamiento">Cómo funciona el financiamiento</button></li><li><button data-act="acct" data-v="pedidos">Seguir mi pedido</button></li><li><button data-act="acct" data-v="creditos">Pagar una cuota</button></li><li><button data-act="go" data-v="trabaja">Trabaja con nosotros</button></li></ul></div>
      <div><h4>Legal</h4><ul><li><button data-act="go" data-v="terminos">Términos de uso</button></li><li><button data-act="go" data-v="privacidad">Política de privacidad</button></li><li><button data-act="legal" data-v="terminos" data-s="garantia">Garantía</button></li><li><button data-act="legal" data-v="terminos" data-s="compras">Condiciones de compra</button></li></ul></div>
      ${S.stores.map(t=>{ const wa = waLink('Hola, quiero información sobre un equipo.', t.id); return `<div><h4>${modoN(t)}</h4><ul>
        <li><b>${esc(t.name)}</b></li>${t.horario?`<li>Atención: ${esc(t.horario)}</li>`:''}
        ${wa?`<li><a class="wa" style="color:var(--gold-l)" href="${wa}" target="_blank" rel="noopener">${ico('chat')} WhatsApp</a></li>`:''}${t.correo?`<li>${esc(t.correo)}</li>`:''}${t.rif?`<li>RIF ${esc(t.rif)}</li>`:''}
        <li><button data-act="tienda" data-v="${t.id}">${t.cuotas?'Ver equipos en cuotas':'Ver equipos de contado'}</button></li></ul></div>`; }).join('')}
    </div>
    <div class="wrap bot"><span>© ${new Date().getFullYear()} ${esc(BRAND.legal || siteName())}. Todos los derechos reservados.</span></div>`;
}

/* ===================== vistas: tienda ===================== */
function storyHTML(){
  const n = midPlan(), plans = usedPlans(), iniPct = Math.round(S.cfg.inicialMin*100);
  // dos frases por tienda, alternadas: Priority One, Papa's Store, Priority One, Papa's Store
  const fr = [];
  for(let i=0;i<2;i++) S.stores.forEach(t=>{ const f = t.frases[i]; if(f && (f.t||f.p)) fr.push({t, f}); });
  const slots = [['left','0.12,0.25'],['right','0.28,0.42'],['left','0.50,0.60'],['right','0.60,0.70']];
  const says = fr.slice(0,4).map(({t,f},i)=>`<div class="say ${slots[i][0]}" data-r="${slots[i][1]}"><span class="k">${esc(f.k||t.name)}</span><h2>${richTxt(f.t||t.slogan)}</h2>${f.p?`<p>${esc(f.p)}</p>`:''}</div>`).join('');
  const u = me();
  return `<section class="story" id="story" aria-label="Presentación de ${esc(siteName())}">
  <div class="stage" id="stage">
    <canvas class="dust" id="dust" aria-hidden="true"></canvas>
    <div class="hero-copy" id="hero">
      <span class="eyebrow">Teléfonos originales · Garantía · Envíos a todo el país</span>
      <h1>${['Cuotas','o','contado.'].map((w,i)=>`<span class="w" style="animation-delay:${.05+i*.09}s">${w}</span>`).join(' ')} <em>${['Tú','decides','cómo','pagar.'].map((w,i)=>`<span class="w g" style="animation-delay:${.35+i*.09}s">${w}</span>`).join(' ')}</em></h1>
      <ul class="hero-st">${S.stores.map(t=>`<li>${storeMark(t,26)}<div><b>${esc(t.name)}</b><span class="lg">${t.cuotas?'Das una inicial y el resto lo pagas en cuotas. También de contado.':'Solo de contado: pagas el precio completo, sin recargos.'}</span><span class="sh">${t.cuotas?'cuotas o contado':'solo de contado'}</span></div></li>`).join('')}</ul>
      <div class="row">${S.stores.map((t,i)=>`<button class="btn ${i?'ghost':'buy'}" data-act="tienda" data-v="${t.id}">${t.cuotas?'Comprar en cuotas':'Comprar de contado'} →</button>`).join('')}</div>
    </div>
    <div class="scene" id="scene" aria-hidden="true"><div class="scene-scale">
      <div class="halo" id="halo"></div><div class="rings" id="rings"><i></i><i></i><i></i></div>
      <div class="floor" id="floor"></div>
      <div class="rig" id="rig">
        <div class="phone" id="phone">
          <div class="f side r"></div><div class="f side l"></div>
          <div class="f back"><div class="cam"><div class="lens a"></div><div class="lens b"></div><div class="lens c"></div><div class="flash"></div></div></div>
          <div class="f front"><div class="screen" id="screen"><div class="isl"></div><div class="time">10:30</div><div class="date">${new Date().toLocaleDateString('es-VE',{weekday:'long',day:'numeric',month:'long'})}</div>
            <div class="offer"><small>${esc(finStores()[0]?.name||'Llévalo hoy')}</small><b class="num">Inicial desde ${iniPct}%</b><span>en equipos seleccionados</span></div><div class="glare"></div></div></div>
        </div>
        <div class="layers" id="layers">
          <div class="lay l-back"><span class="lbl">Equipos originales</span></div>
          <div class="lay l-bat" data-t="Tienda confiable"><span class="lbl">Atención por WhatsApp</span></div>
          <div class="lay l-board"><span class="lbl">Inicial desde ${iniPct}%</span></div>
          <div class="lay l-frame"><span class="lbl">Garantía en cada equipo</span></div>
          <div class="lay l-screen" data-t="Cuotas o contado"><span class="lbl">Envíos a todo el país</span></div>
        </div>
      </div>
    </div></div>
    ${says}
    <div class="say final" data-r="0.80,1.01"><span class="k">Compra segura</span><h2>Pagas seguro,<br><em>lo recibes en casa.</em></h2>
      <p>Cada pago queda registrado en tu cuenta, cada equipo tiene garantía y te atendemos por WhatsApp antes y después de la compra.</p>
      <div class="row">${S.stores.map((t,i)=>`<button class="btn ${i?'ghost':'buy'}" data-act="tienda" data-v="${t.id}">${t.cuotas?'Ver equipos en cuotas':'Ver equipos de contado'}</button>`).join('')}</div></div>
    <div class="scroll-hint" id="hint"><i></i>Desliza para descubrirlo</div>
    <nav class="progress" id="prog" aria-label="Partes de la presentación"><button data-go="0" aria-label="Inicio"></button><button data-go="0.18" aria-label="En cuotas"></button><button data-go="0.35" aria-label="De contado"></button><button data-go="0.56" aria-label="Por dentro"></button><button data-go="0.9" aria-label="Tiendas"></button></nav>
  </div>
  </section>`;
}
function jobCard(inTrabaja){
  const pc = S.cfg.postulacion; if(!pc || pc.activo===false) return '';
  return `<section class="job">
    <div><h2>¿Quieres vender con nosotros?</h2><p>Buscamos personas para vender nuestros equipos por redes sociales y WhatsApp, a comisión. Completa el formulario y te escribimos.</p>
      <div class="row" style="margin-top:22px"><button class="btn buy" ${inTrabaja?'data-act="topost"':'data-act="go" data-v="trabaja"'}>Postularme</button></div></div>
    <ul><li>Trabajas desde tu teléfono, en tu horario</li><li>Ganas por cada venta que cierres</li><li>Te damos fotos, precios y planes de cuotas para compartir</li></ul>
  </section>`;
}
function vInicio(){
  const plans = Object.keys(S.cfg.plans).map(Number).sort((a,b)=>a-b), iniPct = Math.round(S.cfg.inicialMin*100);
  const tick = [`Equipos <b>originales</b>`, ...(finStores().length?[`Cuotas <b>semanales o quincenales</b>`]:[]), `Pago <b>de contado</b> sin recargos`, `Garantía en <b>cada equipo</b>`, `Envíos a <b>todo el país</b>`, `Atención por <b>WhatsApp</b>`];
  const hf = S.homeFin || '';
  const feat = S.products.filter(p=>p.stock>0 && (!hf || (hf==='si')===p.fin)).sort((a,b)=>(a.cat==='Teléfonos'?0:1)-(b.cat==='Teléfonos'?0:1)).slice(0,8);
  const cnt = f => S.products.filter(p=>!f || (f==='si')===p.fin).length;
  return `${storyHTML()}
  <div class="ticker" aria-hidden="true"><div class="track">${[...tick,...tick].map(t=>`<span>${t}</span>`).join('')}</div></div>
  <div class="dk">
  <section class="blk" id="tiendas"><div class="wrap">
    <div class="reveal"><span class="eyebrow">Formas de comprar</span><h2 class="big">¿Cómo quieres<br>pagarlo?</h2><p class="lead">En cuotas, con una inicial y pagos semanales o quincenales, o de contado, pagando el precio completo sin recargos. Tú eliges.</p></div>
    <div class="stores">${S.stores.map(t=>{ const np = S.products.filter(p=>p.store===t.id).length; const wa = waLink('Hola, quiero información sobre un equipo.', t.id);
      return `<article class="storecard reveal"><div class="sc-top">${storeMark(t,56)}<div><h3>${t.cuotas?'En cuotas':'De contado'}</h3><p>${esc(t.slogan)} <span class="muted">· ${esc(t.name)}</span></p></div></div>
        <div class="sc-meta"><span class="tag ${t.cuotas?'ok':'dark'}">${t.cuotas?'Inicial + cuotas, o contado':'Precio completo, sin recargos'}</span><span><b class="num">${np}</b> equipo${np===1?'':'s'}</span>${t.horario?`<span>${esc(t.horario)}</span>`:''}</div>
        <div class="row"><button class="btn buy" data-act="tienda" data-v="${t.id}">${t.cuotas?'Ver equipos en cuotas':'Ver equipos de contado'} →</button>${wa?`<a class="btn ghost" href="${wa}" target="_blank" rel="noopener">${ico('chat')} Hablar con un asesor</a>`:''}</div></article>`; }).join('')}</div>
  </div></section>
  <section class="blk" id="cuotas"><div class="wrap">
    <div class="reveal"><span class="eyebrow">Cómo comprar en cuotas${finStores().length===1?' en '+esc(finStores()[0].name):''}</span><h2 class="big">Tres pasos y<br>te lo llevas.</h2><p class="lead">Creas tu cuenta en un minuto y solo verificamos tu identidad si eliges pagar en cuotas.</p></div>
    <div class="steps">
      <article class="step reveal"><span class="n">01</span><h3>Crea tu cuenta</h3><p>Nombre, cédula, teléfono y correo. Con eso ya puedes comprar de contado.</p></article>
      <article class="step reveal"><span class="n">02</span><h3>Elige tu equipo</h3><p>Cada equipo muestra su inicial y sus cuotas. Envías una foto tuya y de tu cédula, y pagas la inicial. Tus fotos y tu ubicación quedan privadas.</p></article>
      <article class="step reveal"><span class="n">03</span><h3>Recíbelo</h3><p>La tienda aprueba tu crédito y te lo envía. Pagas cada cuota desde tu cuenta.</p></article>
    </div>
    <div class="stats reveal">
      <div><b class="num" data-count="${iniPct}" data-suf="%">${iniPct}%</b><span>de inicial, en equipos seleccionados</span></div>
      <div><b class="num" data-count="${plans[plans.length-1]||9}">${plans[plans.length-1]||9}</b><span>cuotas como máximo</span></div>
      <div><b class="num" data-count="${S.cfg.reservaHoras}" data-suf=" h">${S.cfg.reservaHoras} h</b><span>de reserva sin pagar</span></div>
      <div><b class="num" data-count="${Math.round(S.cfg.mora)}" data-pre="$">${usd(S.cfg.mora).replace('.00','')}</b><span>de mora fija por cuota atrasada</span></div>
    </div>
  </div></section>
  <section class="blk" id="elige"><div class="wrap">
    <div class="reveal"><span class="eyebrow">Catálogo</span><h2 class="big">Elige el tuyo.</h2><p class="lead">Los equipos con financiamiento también los puedes pagar de contado. Los de “Solo contado” se pagan completos en una sola vez.</p></div>
    <div class="filt" role="group" aria-label="Forma de pago">
      ${[['','Todos','Contado y cuotas'],['si','Con financiamiento','Pagas en cuotas o de contado'],['no','Solo contado','Pago completo']].map(([k,l,d])=>`<button data-act="homefin" data-v="${k}" aria-pressed="${hf===k}"><b>${l}</b><span>${d}</span><i class="num">${cnt(k)}</i></button>`).join('')}
    </div>
    ${feat.length?`<div class="pgrid">${feat.map(pcard).join('')}</div>`:'<div class="empty">No hay equipos en este filtro.</div>'}
    <div style="margin-top:22px"><button class="btn ghost" data-act="cat" data-v="">Ver todo el catálogo →</button></div>
  </div></section>
  <section class="blk"><div class="wrap"><div class="encta reveal"><div><span class="eyebrow">Encargos</span><h2>¿No encuentras el teléfono que buscas?</h2>
    <p>Dinos qué modelo, capacidad y color quieres, y a qué tienda se lo encargas. Te escribimos por WhatsApp con el precio y la fecha de llegada.</p></div>
    <button class="btn buy" data-act="encargar">Encargar un teléfono →</button></div></div></section>
  <section class="blk"><div class="wrap">${jobCard(false)}</div></section>
  </div>`;
}

/* ---------- animación de la portada (avanza con el scroll) ---------- */
const STORY = {raf:0, cur:0, mx:0, my:0};
function setHH(){ const h = $('header.main'); if(h) document.documentElement.style.setProperty('--hh', h.offsetHeight + 'px'); }
window.addEventListener('resize', setHH);
function storyStop(){ cancelAnimationFrame(STORY.raf); STORY.raf = 0; document.body.classList.remove('is-home'); }
function storyStart(){
  storyStop();
  const story = $('#story'); if(!story) return;
  document.body.classList.add('is-home');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v,a=0,b=1) => Math.min(b, Math.max(a, v));
  const seg = (p,a,b) => clamp((p-a)/(b-a));
  const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  const lerp = (a,b,t) => a+(b-a)*t;
  const stage = $('#stage'), scene = $('#scene'), rig = $('#rig'), phone = $('#phone'), layers = $('#layers'), screen = $('#screen'), hero = $('#hero'), hint = $('#hint'), floor = $('#floor'), halo = $('#halo'), rings = $('#rings');
  dust($('#dust'), reduce);
  const says = [...story.querySelectorAll('.say')].map(el=>({el, r:el.dataset.r.split(',').map(Number)}));
  const lays = [...layers.querySelectorAll('.lay')];
  const dots = [...story.querySelectorAll('#prog button')];
  dots.forEach(b=>b.onclick = ()=>{ const hh = $('header.main').offsetHeight; scrollTo({top: story.offsetTop - hh + (story.offsetHeight - stage.offsetHeight) * +b.dataset.go, behavior:'smooth'}); });
  function progress(){ const hh = $('header.main').offsetHeight, r = story.getBoundingClientRect(); return clamp((hh - r.top) / (r.height - stage.offsetHeight)); }
  STORY.cur = progress();
  function draw(p){
    const W = stage.clientWidth, H = stage.clientHeight, narrow = W < 900;
    const s0 = clamp(Math.min(H/(narrow?1050:760), narrow ? W/560 : 1), .38, 1);
    scene.style.setProperty('--s', s0);
    const k = 1 - ease(seg(p,.02,.13)), g1 = ease(seg(p,.13,.26));
    const z = ease(seg(p,.27,.36)) - ease(seg(p,.40,.47)), g2 = ease(seg(p,.40,.47));
    const ex = ease(seg(p,.47,.58)) - ease(seg(p,.70,.78)), showLayers = seg(p,.45,.49) - seg(p,.74,.78);
    const fin = ease(seg(p,.78,.88));
    let gx = 0, gy = 0;
    if(narrow){ gy = (k*H*.31 - (1-k)*(1-fin)*H*.17 - fin*H*.16)/s0; } else { gx = (k*W*.2 + fin*W*.2)/s0; }
    const look = reduce ? 0 : 1;
    floor.style.transform = `translate(${gx}px,${gy}px)`; floor.style.opacity = String(1 - z);
    halo.style.transform = `translate(${gx}px,${gy}px) scale(${1 + .25*z})`; halo.style.opacity = String(.6 + .4*fin + .3*k);
    rings.style.transform = `translate(${gx}px,${gy}px) rotate(${p*90}deg)`; rings.style.opacity = String(1 - .7*z);
    const ry = lerp(-22 + STORY.mx*16*look*k, 180, g1) + 180*g2, rx = 6 - STORY.my*8*look*k - 6*g1 + 6*fin;
    const float = reduce ? 0 : Math.sin(performance.now()/1400)*6*(1-z);
    let sc = 1 + (narrow?1.1:1.75)*z - .06*ex; if(narrow) sc *= 1 - .3*fin;
    rig.style.transform = `translate3d(${gx - 62*z}px,${gy + (narrow?110:175)*z + float}px,40px) rotateX(${rx - 4*ex}deg) rotateY(${ry}deg) scale(${sc})`;
    phone.style.opacity = String(1 - showLayers); layers.style.opacity = String(showLayers);
    layers.style.transform = `rotateY(${-360 + 30*ex}deg) rotateX(${52*ex}deg) rotateZ(${-24*ex}deg)`;
    lays.forEach((l,i)=>{ l.style.transform = `translateZ(${(i-2)*86*ex}px)`; l.style.setProperty('--lbl', String(seg(ex,.6,1))); });
    screen.style.setProperty('--offer', String(fin));
    const h = seg(p,.02,.1);
    hero.style.opacity = String(1-h); hero.style.filter = h ? `blur(${h*10}px)` : ''; hero.style.transform = `translateY(${-h*50}px)`; hero.style.visibility = h>.98 ? 'hidden' : '';
    hint.style.opacity = String(1 - seg(p,0,.04));
    for(const s of says){ const [a,b] = s.r, len = b-a, fi = seg(p,a,a+len*.25), fo = seg(p,b-len*.25,b), v = fi*(1-fo);
      s.el.style.opacity = String(v); s.el.style.filter = v<1 ? `blur(${(1-v)*12}px)` : ''; s.el.style.transform = `translateY(${(1-fi)*36 - fo*36}px)`;
      s.el.classList.toggle('on', v>.6); s.el.style.visibility = v<.02 ? 'hidden' : ''; }
    const sec = p<.12?0:p<.27?1:p<.47?2:p<.78?3:4; dots.forEach((d,i)=>d.classList.toggle('on', i===sec));
  }
  const loop = () => { if(!document.body.contains(story)) return storyStop(); const t = progress(); STORY.cur += (t - STORY.cur) * (reduce ? 1 : .12); draw(STORY.cur); STORY.raf = requestAnimationFrame(loop); };
  STORY.raf = requestAnimationFrame(loop);
}
window.addEventListener('pointermove', e=>{ STORY.mx = e.clientX/innerWidth - .5; STORY.my = e.clientY/innerHeight - .5; });
// polvo dorado de fondo (liviano: pocas partículas y a resolución normal)
function dust(c, reduce){
  if(!c || reduce) return; const x = c.getContext('2d'); let W, H, pts = [];
  const size = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight;
    pts = Array.from({length: Math.round(c.offsetWidth/22)}, ()=>({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.4+.3, v:Math.random()*.25+.05, a:Math.random()*.6+.15})); };
  size(); window.addEventListener('resize', size);
  (function tick(){ if(!document.body.contains(c)) return; x.clearRect(0,0,W,H);
    for(const p of pts){ p.y -= p.v; if(p.y < -5){ p.y = H+5; p.x = Math.random()*W; } x.globalAlpha = p.a; x.fillStyle = '#E8CC72'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill(); }
    requestAnimationFrame(tick); })();
}
// aparición de secciones y contadores de la portada
function homeFx(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = document.querySelectorAll('.dk .reveal'), cnts = document.querySelectorAll('[data-count]');
  const run = el => { const to = +el.dataset.count, pre = el.dataset.pre||'', suf = el.dataset.suf||''; if(reduce){ el.textContent = pre+to+suf; return; }
    const t0 = performance.now(); (function f(t){ const k = Math.min(1,(t-t0)/1400); el.textContent = pre + Math.round(to*(1-Math.pow(1-k,3))) + suf; if(k<1) requestAnimationFrame(f); })(t0); };
  if(!('IntersectionObserver' in window) || reduce){ els.forEach(e=>e.classList.add('in')); return; }
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); e.target.querySelectorAll('[data-count]').forEach(run); io.unobserve(e.target); } }), {threshold:.15});
  els.forEach(e=>io.observe(e));
}

function vCatalogo(){
  const f = S.f; const qs = f.q.trim().toLowerCase();
  let list = S.products.filter(p=>(!f.store||p.store===f.store) && (!f.cat||p.cat===f.cat) && (!f.brands.length||f.brands.includes(p.brand)) && (!f.gama||p.gama===f.gama) && (!f.fin||(f.fin==='si'?p.fin:!p.fin)) && (!f.stock||p.stock>0)
    && (!qs || (p.name+' '+p.brand+' '+p.cat+' '+Object.values(p.specs).join(' ')).toLowerCase().includes(qs)));
  if(f.sort==='asc') list.sort((a,b)=>a.price-b.price);
  if(f.sort==='desc') list.sort((a,b)=>b.price-a.price);
  if(f.sort==='az') list.sort((a,b)=>a.name.localeCompare(b.name));
  list.sort((a,b)=>(a.stock<=0)-(b.stock<=0));
  const brands = [...new Set(S.products.filter(p=>(!f.store||p.store===f.store) && (!f.cat||p.cat===f.cat)).map(p=>p.brand))];
  const stT = f.store ? ST(f.store) : null;
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›${stT?`<button data-act="tienda" data-v="${stT.id}">${esc(stT.name)}</button>›`:''}<span>${esc(f.cat||'Catálogo')}</span>${qs?`›<span>“${esc(f.q)}”</span>`:''}</div>
  <div class="catalog">
    <aside class="filters">
      <div><h4>Vendido por</h4><label class="ck"><input type="radio" name="fs" data-on="fstore" value="" ${!f.store?'checked':''}>Todas</label>${S.stores.map(t=>`<label class="ck"><input type="radio" name="fs" data-on="fstore" value="${t.id}" ${f.store===t.id?'checked':''}>${esc(t.name)}</label>`).join('')}</div>
      ${catsEnUso().length<2?'':`<div><h4>Categoría</h4>${['',...catsEnUso()].map(c=>`<label class="ck"><input type="radio" name="fc" data-on="fcat" value="${c}" ${(f.cat||'')===c?'checked':''}>${c||'Todas'}</label>`).join('')}</div>`}
      <div><h4>Marca</h4>${brands.map(b=>`<label class="ck"><input type="checkbox" data-on="fbrand" value="${esc(b)}" ${f.brands.includes(b)?'checked':''}>${esc(b)}</label>`).join('')}</div>
      <div><h4>Gama</h4><div class="field"><select data-on="fgama" aria-label="Gama"><option value="">General</option>${Object.entries(GAMAS).map(([k,v])=>`<option value="${k}" ${f.gama===k?'selected':''}>${v}</option>`).join('')}</select></div></div>
      <div><h4>Disponibilidad</h4>
        <label class="ck"><input type="checkbox" data-on="fstock" ${f.stock?'checked':''}>Disponible</label></div>
      ${(f.brands.length||f.gama||f.fin||f.stock||f.q)?`<button class="link" data-act="clearf">Limpiar filtros</button>`:''}
    </aside>
    <div>
      ${stT?`<div class="storehead">${storeMark(stT,44)}<div><b>${esc(stT.name)}</b><span class="muted small">${esc(stT.slogan)}</span></div></div>`:''}
      <div class="toolbar"><div><h1 style="font-size:24px">${esc(f.cat||(stT?'Catálogo de '+stT.name:'Todo el catálogo'))}</h1><span class="muted small">${list.length} producto${list.length===1?'':'s'}</span></div>
        <div class="chips">${(stT&&!stT.cuotas?[]:[['','Todos'],['si','Con financiamiento'],['no','Solo contado']]).map(([k,l])=>`<button class="chip" data-act="ffin" data-v="${k}" aria-pressed="${(f.fin||'')===k}">${l}</button>`).join('')}</div>
        <label class="row small">Ordenar por <select data-on="fsort" aria-label="Ordenar"><option value="rel">Relevancia</option><option value="asc" ${f.sort==='asc'?'selected':''}>Menor precio</option><option value="desc" ${f.sort==='desc'?'selected':''}>Mayor precio</option><option value="az" ${f.sort==='az'?'selected':''}>Nombre A–Z</option></select></label></div>
      ${list.length?`<div class="pgrid">${list.map(pcard).join('')}</div>`:`<div class="empty"><h2>No encontramos productos</h2><p>Prueba con otra búsqueda o quita algunos filtros. Si buscas un modelo que no tenemos, puedes encargarlo.</p><div class="row" style="justify-content:center"><button class="btn" data-act="clearf">Limpiar filtros</button><button class="btn buy" data-act="encargar" data-q="${esc(f.q)}">Encargar un teléfono</button></div></div>`}
    </div>
  </div>`;
}
function vProducto(){
  const p = P(S.route.id); if(!p) return `<div class="empty"><h2>Producto no encontrado</h2><button class="btn" data-act="cat" data-v="">Ver catálogo</button></div>`;
  const pd = S.pd; const price = unitPrice(p, pd.storage, pd.acc); const out = p.stock<=0;
  const rel = S.products.filter(x=>x.id!==p.id && x.store===p.store && (x.cat===p.cat || x.cat==='Accesorios')).slice(0,4);
  const wa = waLink(`Hola, quiero información sobre el ${p.name}.`, p.store);
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<button data-act="cat" data-v="${esc(p.cat)}">${esc(p.cat)}</button>›<span>${esc(p.name)}</span></div>
  <section class="pdp">
    <div class="gal">${img(p, pd.color)}</div>
    <div class="inf">
      <button class="soldby" data-act="tienda" data-v="${p.store}">Vendido por ${storeChip(p.store)}</button>
      <span class="brandname">${esc(p.brand)} · Código ${String(p.id).padStart(4,'0')}</span>${p.fin?'<span class="tag ok" style="justify-self:start">Contado o cuotas</span>':'<span class="tag dark" style="justify-self:start">Solo contado</span>'}
      <h1>${esc(p.name)}${p.storages?' '+esc(p.storages[pd.storage].n):''}</h1>
      <div class="condbox"><span class="tag ${p.cond==='nuevo'?'ok':'warn'}">${condN(p)}</span><span class="tag">${GAMAS[p.gama]||''}</span>${p.bat?`<span>Batería <b>${p.bat}%</b></span>`:''}</div>
      <div class="note small"><b>Garantía:</b> ${esc(ST(p.store).garCubre)} <span class="muted">No cubre: ${esc(ST(p.store).garExcluye.replace(/\.$/,'').toLowerCase())}.</span></div>
      <div><span class="pr num">${usd(price)}</span><div class="muted small">${tasaOk(p.store)?`En bolívares: <b class="num">${bs(bsPrice(price, p.store))}</b> · el monto en Bs es distinto al de dólares`:'Precio en dólares · paga con USDT o efectivo'}</div></div>
      ${p.acc!=null?`<div><h4 style="margin-bottom:8px">Accesorios</h4><div class="opts"><button class="ob" data-act="pacc" data-v="0" aria-pressed="${!pd.acc}">Sin accesorios</button><button class="ob" data-act="pacc" data-v="1" aria-pressed="${!!pd.acc}">Con accesorios <span class="muted">+${usd(p.acc)}</span></button></div>${p.accDesc?`<div class="muted small" style="margin-top:6px">Incluye: ${esc(p.accDesc)}</div>`:''}</div>`:''}
      <div><h4 style="margin-bottom:8px">Color: <span class="muted" style="font-weight:500">${esc(p.colors[pd.color]?.n)}</span></h4>
        <div class="opts">${p.colors.map((c,i)=>`<button class="sw" style="background:${esc(c.hex)}" data-act="pcolor" data-i="${i}" aria-pressed="${pd.color===i}" aria-label="${esc(c.n)}"></button>`).join('')}</div></div>
      ${p.storages?`<div><h4 style="margin-bottom:8px">Almacenamiento</h4><div class="opts">${p.storages.map((s,i)=>`<button class="ob" data-act="pstor" data-i="${i}" aria-pressed="${pd.storage===i}">${esc(s.n)}${+s.d?` <span class="muted">+${usd(s.d)}</span>`:''}</button>`).join('')}</div></div>`:''}
      <div class="row">
        ${out?'<span class="tag">Agotado</span>':`<div class="qty"><button data-act="pqty" data-d="-1" aria-label="Menos">−</button><span class="num">${pd.qty}</span><button data-act="pqty" data-d="1" aria-label="Más">+</button></div>
        <span class="small ${p.stock<=5?'stk':'muted'}">${p.stock===1?'Última unidad':p.stock<=5?`Últimas ${p.stock} unidades`:`${p.stock} disponibles`}</span>`}
      </div>
      <div class="row"><button class="btn brand" style="flex:1" ${out?'disabled':''} data-act="buynow" data-id="${p.id}">Comprar ahora</button><button class="btn buy" style="flex:1" ${out?'disabled':''} data-act="add" data-id="${p.id}">Agregar al carrito</button></div>
      <ul class="trust"><li>${ico('shield')} Garantía en cada equipo</li><li>${ico('check')} Se revisa contigo al entregar</li><li>${ico('truck')} Envíos a todo el país</li></ul>
      ${out?`<div class="note warn"><b>Está agotado.</b> Puedes encargarlo y ${esc(ST(p.store).name)} te avisa por WhatsApp cuando llegue. <div style="margin-top:8px"><button class="btn sm brand" data-act="encargar" data-id="${p.id}">Encargar este equipo</button></div></div>`:''}
      ${p.fin&&pOpts(p).length&&price>=S.cfg.minFin?(()=>{ const down = r2(price*pIni(p));
        return `<div class="finbox"><div class="h">Llévalo financiado</div>
        <table class="t"><tbody><tr><td>Inicial (${Math.round(pIni(p)*100)}%)</td><td class="r num"><b>${usd(down)}</b></td></tr>
        ${pOpts(p).map((o,i)=>{ const fin = r2(price*(1-pIni(p))*(1+rec(o.n))); return `<tr><td>${i?'o ':''}${o.n} cuotas ${FREQ[o.f]} de</td><td class="r num"><b>${usd(r2(fin/o.n))}</b></td></tr>`; }).join('')}
        </tbody></table>${pOpts(p).length>1?'<div class="muted small" style="margin-top:6px">Eliges semanal o quincenal al pagar.</div>':''}
        ${out?'':`<button class="btn buy block" style="margin-top:12px" data-act="buyfin" data-id="${p.id}">Lo quiero en cuotas →</button>`}</div>`; })():p.fin?`<div class="note">Puedes comprarlo en cuotas si tu carrito suma ${usd(S.cfg.minFin)} o más.</div>`:`<div class="note"><b>Solo de contado.</b> ${ST(p.store).cuotas?'Este equipo no está disponible en cuotas.':esc(ST(p.store).name)+' vende sus equipos de contado.'}</div>`}
      ${wa?`<div class="pdp-help">${ico('chat')}<div><b>¿Dudas sobre este equipo?</b><span>Te respondemos por WhatsApp${ST(p.store).horario?', '+esc(ST(p.store).horario.toLowerCase()):''}.</span></div><a class="btn sm" href="${wa}" target="_blank" rel="noopener">Escribir</a></div>`:''}
    </div>
  </section>
  ${out?'':`<div class="buybar"><div><b class="num">${usd(price)}</b><span class="muted small">${p.fin&&pOpts(p).length&&price>=S.cfg.minFin?`o inicial de ${usd(r2(price*pIni(p)))}`:'Pago de contado'}</span></div><button class="btn brand" data-act="buynow" data-id="${p.id}">Comprar ahora</button></div>`}
  <div class="two eq">
    <section class="box"><h2>Especificaciones</h2><table class="spec">${Object.entries(p.specs).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table></section>
    <section class="box"><h2>Descripción</h2>${p.desc?`<p>${esc(p.desc)}</p>`:''}<div class="note">El equipo se revisa contigo al momento de la entrega.</div></section>
  </div>
  ${rel.length?`<section class="sec" style="margin-top:28px"><h2>También te puede interesar</h2><div class="pgrid">${rel.map(pcard).join('')}</div></section>`:''}`;
}
function vCarrito(){
  S.cart = S.cart.filter(i=>P(i.pid));
  if(!S.cart.length) return `<div class="empty"><h2>Tu carrito está vacío</h2><p>Encuentra tu próximo teléfono, en cuotas o de contado.</p><div class="row" style="justify-content:center">${S.stores.map((t,i)=>`<button class="btn ${i?'ghost':'buy'}" data-act="tienda" data-v="${t.id}">${t.cuotas?'Ver equipos en cuotas':'Ver equipos de contado'}</button>`).join('')}</div></div>`;
  const groups = cartStores();
  const item = i => { const ix = S.cart.indexOf(i), p = P(i.pid); return `
      <div class="citem"><div class="th">${img(p,i.ci)}</div>
        <div style="min-width:0"><span class="brandname">${esc(p.brand)}</span><div style="font-weight:600">${esc(p.name)}</div>
          <div class="muted small">${esc(i.color)}${i.storage?' · '+esc(i.storage):''}${i.acc?' · Con accesorios':''} · ${usd(i.unit)} c/u</div>
          ${i.qty>p.stock?`<div class="err">Solo quedan ${p.stock} unidades</div>`:''}
          <div class="row" style="margin-top:6px"><div class="qty"><button data-act="cqty" data-i="${ix}" data-d="-1" aria-label="Menos">−</button><span class="num">${i.qty}</span><button data-act="cqty" data-i="${ix}" data-d="1" aria-label="Más">+</button></div>
          <button class="link small" data-act="crem" data-i="${ix}">Eliminar</button></div></div>
        <div class="pr num" style="margin:0;font-size:18px">${usd(i.unit*i.qty)}</div></div>`; };
  const finNote = (items, t) => { if(!ST(P(items[0].pid).store).cuotas) return `<div class="note small">${esc(ST(P(items[0].pid).store).name)} vende de contado: pagas el total y te lo llevas.</div>`; const nf = items.filter(i=>!P(i.pid).fin);
    return nf.length ? `<div class="note small">${nf.map(i=>esc(i.name)).join(', ')} ${nf.length>1?'se venden':'se vende'} solo de contado. Para pagar en cuotas, quítalo de este pedido.</div>`
      : !cartFin(items).plans.length ? `<div class="note small">Estos equipos no tienen un plan de cuotas en común. Para pagar en cuotas, cómpralos en pedidos separados.</div>`
      : t.subtotal>=S.cfg.minFin ? `<div class="note ok small">Este pedido se puede pagar en cuotas: inicial desde ${usd(r2((t.subtotal-t.discount)*cartFin(items).ini))} y ${cartFin(items).opts.map(o=>`${o.n} cuotas ${FREQ[o.f]}`).join(' o ')}.</div>`
      : `<div class="note small">Agrega ${usd(S.cfg.minFin-t.subtotal)} más de esta tienda para poder pagar en cuotas.</div>`; };
  return `<h1 style="margin-bottom:6px">Carrito de compras</h1>
  ${groups.length>1?`<p class="muted" style="margin-bottom:16px">Estos productos se despachan por separado, así que harás un pago por cada grupo.</p>`:'<div style="height:12px"></div>'}
  <div class="cgroups">${groups.map(g=>{ const t = cartTotals(g), items = t.items, bad = items.some(i=>i.qty>P(i.pid).stock);
    return `<section class="box cgroup"><div class="cg-h">${storeChip(g)}<span class="muted small">${t.units} artículo${t.units===1?'':'s'}</span></div>
      ${items.map(item).join('')}
      <div class="cg-f"><div><div class="sl tot"><span>Total ${esc(ST(g).name)}</span><span class="num">${usd(t.subtotal-t.discount)}</span></div>
        ${t.discount?`<div class="small" style="color:var(--ok)">Cupón ${esc(S.coupon)} aplicado (−${usd(t.discount)})</div>`:''}
        <div class="muted small">${tasaOk(g)?`En bolívares: ${bs(bsPrice(t.subtotal-t.discount, g))} · `:''}el envío se calcula al pagar</div>
        ${finNote(items, t)}</div>
        <button class="btn buy" data-act="tocheckout" data-s="${g}" ${bad?'disabled':''}>Continuar al pago →</button></div>
    </section>`; }).join('')}</div>
  <aside class="box sum" style="margin-top:16px;max-width:460px">
    ${S.cfg.cupon.code?`<form id="couponf" class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><input id="cp" placeholder="Código de cupón" value="${esc(S.coupon)}" aria-label="Cupón"></div><button class="btn" type="submit">Aplicar</button></form>
    ${(()=>{const t=cartTotals(groups[0]); return t.couponMsg?`<div class="small ${t.couponOk?'':'err'}">${t.couponMsg}</div>`:''})()}<span class="muted small">El cupón aplica en tu primera compra.</span>`:''}
    <button class="link" data-act="cat" data-v="">Seguir comprando</button>
  </aside>`;
}
function payInfo(method, store){
  const d = (store && ST(store).pay) || S.cfg.datosPago || {};
  return `<b>${METODOS[method].n}</b><span>${esc(d[method] || '')}</span>`;
}
function vCheckout(){
  const u = me();
  if(!u){ S.after = 'checkout'; return vLogin('Inicia sesión o crea tu cuenta para completar tu compra o solicitar financiamiento.'); }
  if(isAdmin()) return `<div class="empty"><h2>Estás conectado como administrador</h2><p>Cierra sesión y entra con una cuenta de cliente para comprar.</p></div>`;
  if(!S.cart.length) return vCarrito();
  const gs = cartStores();
  if(!S.co || !gs.includes(S.co.store)){ const st = gs.includes(S.coStore) ? S.coStore : gs.length===1 ? gs[0] : null; if(!st) return vCarrito(); S.co = null; S.coStore = st; }
  if(!S.co){ S.co = {store:S.coStore, ship:'local', addr:u.addr||'', city:u.city||'', mode:S.coMode||'contado', n:midPlan(), ini:S.cfg.inicialMin, method:'pago_movil', later:false, when:'ahora', bank:BANKS[0], ref:'', amount:'', file:null, err:'', showPlan:false}; S.coMode = null; }
  const co = S.co, k = coCalc();
  const items = cartOf(co.store), tS = ST(co.store);
  if(!(S.termsOk||{})[co.store] && M.type!=='terms') setTimeout(()=>{ if(location.hash.includes('checkout') && !(S.termsOk||{})[co.store] && M.type!=='terms') termsModal(co.store); }, 0);
  const noFin = items.filter(i=>!P(i.pid).fin);
  const cf = cartFin(items);
  const canFin = tS.cuotas && k.base >= S.cfg.minFin && !noFin.length && cf.plans.length > 0;
  if(co.ini < cf.ini) co.ini = cf.ini;
  if(!cf.opts.find(o=>o.f===co.freq)) co.freq = cf.opts[0]?.f || 'quincenal';
  const opt = cf.opts.find(o=>o.f===co.freq); if(opt) co.n = opt.n;
  cf.freq = FREQ[co.freq];
  if(!canFin) co.mode='contado';
  co.when = (co.later || co.method==='efectivo') ? 'despues' : 'ahora';
  if(!S.cfg.envio[co.ship]) co.ship = Object.keys(S.cfg.envio)[0];
  const fin = co.mode==='financiado';
  const needV = fin && ['incompleto','rechazado'].includes(u.verif);
  const el = fin ? eligibility(k.financed, co.store) : null;
  if(el && needV){ el.ok = false; }
  const mets = storeMethods(co.store); if(!mets.includes(co.method)) co.method = mets[0];
  const cur = METODOS[co.method].cur;
  const hoyCur = cur==='Bs' ? bs(bsPrice(k.hoy, co.store)) : usd(k.hoy);
  const plans = cf.plans.length ? cf.plans : usedPlans();
  const down = r2(k.base*co.ini);
  const cuotaDe = n => r2(r2((k.base-down)*(1+rec(n)))/n);
  const nMax = plans[plans.length-1];
  const minCuota = canFin ? r2(r2((k.base-r2(k.base*cf.ini))*(1+rec(nMax)))/nMax) : 0;
  const short = {pago_movil:'Pago móvil', transferencia:'Transferencia', usdt:'USDT', efectivo:'Efectivo'};
  const payTxt = (tS.pay||{})[co.method] || '';
  return `<div class="crumbs"><button data-act="go" data-v="carrito">Carrito</button>›<span>Finalizar compra</span></div>
  <div class="row between" style="margin-bottom:18px"><h1>Finalizar compra</h1><span class="row small">Pedido para ${storeChip(co.store)}</span></div>
  ${gs.length>1?`<div class="note info small" style="margin-bottom:14px">Este pedido lo despacha ${esc(tS.name)}. Los demás productos de tu carrito se pagan en un pedido aparte.</div>`:''}
  <div class="two">
  <div class="costeps">
    <section class="box"><h2><span class="stepn">1</span>Entrega</h2>
      <div class="seg seg${Math.min(3,Object.keys(S.cfg.envio).length)}">${Object.entries(S.cfg.envio).map(([key,e])=>{const c=shipPrice(key,k.base);return `
        <label class="so"><input type="radio" name="ship" value="${key}" data-on="ship" ${co.ship===key?'checked':''}><span class="ot">${esc(e.n)}</span><span class="os">${c?usd(c):'Gratis'}</span></label>`}).join('')}</div>
      ${`<div class="fg"><div class="field" style="grid-column:1/-1"><label for="co-addr">Dirección</label><input id="co-addr" data-in="addr" value="${esc(co.addr)}" placeholder="Calle, edificio, piso, punto de referencia" autocomplete="street-address"></div>
        <div class="field"><label for="co-city">Ciudad</label><input id="co-city" data-in="city" value="${esc(co.city)}" autocomplete="address-level2"></div>
        <div class="field"><label>Recibe</label><input value="${esc(u.name)}" disabled></div></div>
        <p class="muted small">${esc(S.cfg.envio[co.ship]?.d||'')}</p>`}
    </section>

    <section class="box"><h2><span class="stepn">2</span>Forma de pago</h2>
      <div class="seg seg2">
        <label class="so"><input type="radio" name="mode" value="contado" data-on="mode" ${!fin?'checked':''}><span class="ot">De contado</span><span class="os">${usd(k.total)}</span></label>
        <label class="so ${canFin?'':'dis'}"><input type="radio" name="mode" value="financiado" data-on="mode" ${fin?'checked':''} ${canFin?'':'disabled'}><span class="ot">En cuotas</span><span class="os">${canFin?`${co.n} cuotas de ${usd(cuotaDe(co.n))}`:!tS.cuotas?`${esc(tS.name)} vende solo de contado`:!cf.plans.length?'Estos equipos tienen cuotas distintas: cómpralos por separado':noFin.length?`${esc(noFin[0].name)} es solo de contado`:`Desde ${usd(S.cfg.minFin)} de compra`}</span></label>
      </div>
      ${fin?`
        ${cf.opts.length>1?`<div class="seg seg2 frq">${cf.opts.map(o=>`<label class="so"><input type="radio" name="frq" value="${o.f}" data-on="frq" ${co.freq===o.f?'checked':''}><span class="ot">${o.n} cuotas ${FREQ[o.f]}</span><span class="os">${usd(cuotaDe(o.n))} c/u</span></label>`).join('')}</div>`
          :`<div class="note info small">Este equipo se paga en <b>${co.n} cuotas ${cf.freq} de ${usd(cuotaDe(co.n))}</b>.</div>`}
        <div class="field rng"><label for="co-ini">Inicial: <b id="ini-l">${Math.round(co.ini*100)}% · ${usd(k.down)}</b></label><input id="co-ini" type="range" min="${Math.round(cf.ini*100)}" max="${Math.round(S.cfg.inicialMax*100)}" step="5" value="${Math.round(co.ini*100)}" data-on="ini"></div>
        <p class="muted small">Primera cuota hacia el ${fd(venceCuota(cf.freq,1))}. Si pagas una cuota después de su fecha, se suma ${usd(S.cfg.mora)}. <button class="link small" data-act="toggleplan">${co.showPlan?'Ocultar fechas':'Ver todas las fechas'}</button></p>
        ${co.showPlan?`<div class="tbl"><table class="t"><tbody>${Array.from({length:co.n},(_,i)=>`<tr><td>Cuota ${i+1}</td><td>${fd(venceCuota(cf.freq,i+1))}</td><td class="r num">${usd(i===co.n-1?r2(k.financed-k.cuota*(co.n-1)):k.cuota)}</td></tr>`).join('')}</tbody></table></div>`:''}
        <p class="muted small">Recuerda: ${usd(S.cfg.mora)} de mora por cuota pagada tarde; el equipo es de ${esc(tS.name)} hasta que termines de pagar; con más de 3 cuotas vencidas la tienda puede recuperarlo. <button class="link small" data-act="termsver">Ver términos</button></p>
        ${needV?`<div class="note warn small">${u.verif==='rechazado'?'Tu verificación fue rechazada. Vuelve a enviar tus documentos para comprar en cuotas.':'Para comprar en cuotas necesitamos verificar tu identidad. Toma unos 2 minutos y luego vuelves aquí.'}<div style="margin-top:8px"><button class="btn sm brand" data-act="goverif">Verificar mi identidad</button></div></div>`
          :el.why.length?`<div class="note bad small">${el.why.map(esc).join('<br>')}</div>`:''}`:''}
    </section>

    <section class="box"><h2><span class="stepn">3</span>${fin?'Pago de la inicial':'Pago'}</h2>
      <div class="seg seg${Math.min(4,mets.length)}">${mets.map(key=>`<label class="so"><input type="radio" name="met" value="${key}" data-on="method" ${co.method===key?'checked':''}><span class="ot">${short[key]}</span><span class="os">${key==='usdt'?'Binance':METODOS[key].cur==='Bs'?'Bolívares':'Dólares'}</span></label>`).join('')}</div>
      <div class="bankdata"><span class="muted small">Datos para pagar a ${esc(tS.name)}</span><span>${esc(payTxt)}</span></div>
      ${dualBox(k.hoy, co.method, co.store)}
      <div class="small">Vas a pagar con <b>${short[co.method]}</b>: <b class="num">${hoyCur}</b></div>
      ${co.method==='efectivo'?`<div class="note info small">Al confirmar, ${esc(tS.name)} te escribe por WhatsApp para coordinar el pago en efectivo. Guardamos tus productos ${S.cfg.reservaHoras} horas.</div>`
        :`<label class="ck small"><input type="checkbox" data-on="later" ${co.later?'checked':''}>Pagaré después (guardamos tus productos ${S.cfg.reservaHoras} horas)</label>`}
      ${co.when==='ahora'?`<div class="fg">
        ${cur==='Bs'?`<div class="field"><label for="co-bank">Banco de origen</label><select id="co-bank" data-in="bank">${BANKS.map(b=>`<option ${co.bank===b?'selected':''}>${b}</option>`).join('')}</select></div>`:''}
        <div class="field"><label for="co-ref">${cur==='Bs'?'Referencia':'ID de la orden (Binance)'}</label><input id="co-ref" data-in="ref" value="${esc(co.ref)}" placeholder="${cur==='Bs'?'Ej. 00418833':'ID de la orden en Binance'}"></div>
        <div class="field"><label for="co-amt">Monto pagado (${cur==='USD'?'USDT':cur})</label><input id="co-amt" data-in="amount" inputmode="decimal" value="${esc(co.amount)}" placeholder="${cur==='Bs'?bsPrice(k.hoy, co.store):k.hoy}"></div>
        <div class="field"><span class="lbl">Comprobante</span>${fileBtn('co-file', 'image/*,application/pdf', 'data-on="file"', 'Subir captura del pago', co.file)}<span class="hint">Captura o PDF del pago. Máximo 5 MB.</span></div>
      </div>`:''}
    </section>
  </div>

  <aside class="box sum"><h2>Resumen</h2>
    ${items.map(i=>`<div class="sl small"><span>${i.qty} × ${esc(P(i.pid).name)}${i.storage?' '+esc(i.storage):''}</span><span class="num">${usd(i.unit*i.qty)}</span></div>`).join('')}
    <div class="sl" style="border-top:1px solid var(--line);padding-top:10px"><span>Envío</span><span class="num">${k.ship?usd(k.ship):'Gratis'}</span></div>
    ${k.discount?`<div class="sl" style="color:var(--ok)"><span>Cupón</span><span class="num">−${usd(k.discount)}</span></div>`:''}
    ${fin?`<div class="sl"><span>Luego, ${co.n} cuotas ${cf.freq} de</span><span class="num">${usd(k.cuota)}</span></div>`:''}
    <div class="sl tot"><span>${fin?'Pagas hoy':'Total'}</span><span class="num">${usd(k.hoy)}</span></div>
    ${cur==='Bs'?`<div class="muted small" style="text-align:right">${hoyCur}</div>`:''}
    ${co.err?`<div class="note bad small">${esc(co.err)}</div>`:''}
    <button class="btn buy block" data-act="placeorder" ${el&&!el.ok?'disabled':''}>${S.busy?'Procesando…':fin?'Solicitar crédito':'Confirmar pedido'}</button>
    ${fin?`<span class="muted small">Total del crédito: ${usd(k.costoTotal)}${rec(co.n)?` (recargo ${Math.round(rec(co.n)*100)}%)`:' (sin recargo)'}.</span>`:''}
  </aside>
  </div>`;
}

function vLogin(msg){
  return `<div class="auth">
    <section class="box"><h2>Ingresar</h2>${msg?`<div class="note info small">${esc(msg)}</div>`:''}
      <form id="loginf" class="field" style="gap:14px" novalidate>
        <div class="field"><label for="l-email">Correo electrónico</label><input id="l-email" type="email" autocomplete="username"></div>
        <div class="field"><label for="l-pass">Contraseña</label><input id="l-pass" type="password" autocomplete="current-password"></div>
        <div class="err" id="l-err"></div>
        <button class="btn brand" type="submit">Ingresar</button>
        <button class="link small" type="button" data-act="forgot">¿Olvidaste tu contraseña?</button>
      </form>
    </section>
    <section class="box"><h2>¿Eres nuevo?</h2><p class="muted">Crear tu cuenta toma 1 minuto: nombre, cédula, teléfono y correo. Con ella compras de contado de inmediato.</p>
      <ul class="checklist plain"><li>Cédula y teléfono solo con números</li><li>Seguimiento de tus pedidos y pagos</li><li>Si quieres pagar en cuotas, verificas tu identidad en ese momento</li></ul>
      <button class="btn buy" data-act="go" data-v="registro">Crear cuenta</button>
    </section></div>`;
}
function vNuevaClave(){
  return `<div class="auth" style="grid-template-columns:1fr;max-width:480px"><section class="box"><h2>Nueva contraseña</h2>
    <form id="newpassf" class="field" style="gap:14px" novalidate>
      <div class="field"><label for="np-pass">Escribe tu nueva contraseña</label><input id="np-pass" type="password" autocomplete="new-password"><span class="hint">Mínimo 8 caracteres, con al menos un número.</span></div>
      <div class="err" id="np-err"></div><button class="btn brand" type="submit">Guardar contraseña</button></form></section></div>`;
}

// términos y condiciones de compra (y del financiamiento, si la tienda vende en cuotas)
function terminosHTML(t){
  const fin = t.cuotas;
  return `<div class="terms-txt">
    <h3>Al comprar en ${esc(t.name)}</h3>
    <ol>
      <li><b>Condición del equipo.</b> En la ficha de cada teléfono se indica si es nuevo o usado (Clase A, B o C, según su estado) y el estado de la batería.</li>
      <li><b>Garantía.</b> ${esc(t.garCubre)} <b>No se aceptan como garantía:</b> ${esc(t.garExcluye.charAt(0).toLowerCase()+t.garExcluye.slice(1))}</li>
      <li><b>Revisión al entregar.</b> El equipo se revisa contigo al momento de la entrega (pantalla, cornetas, Face ID, pin de carga, botones y liberación).</li>
      <li><b>Pagos.</b> ${storeMethods(t.id).map(k=>METODOS[k].n).join(', ')}. Los pagos con comprobante se verifican antes de enviar el equipo. El efectivo lo registra la tienda cuando lo recibe.</li>
      <li><b>Precio en bolívares.</b> Los precios están en dólares. Si pagas en bolívares, el monto se calcula con la tasa de ${esc(t.name)} del día del pago${t.recargoBs?' e incluye un ajuste por pago en bolívares':''}; por eso es distinto al monto en dólares.</li>
      <li><b>Reserva.</b> Tus productos quedan reservados ${S.cfg.reservaHoras} horas mientras se confirma el pago; si no se paga, el pedido se cancela.</li>
    </ol>
    ${fin?`<h3>Si compras en cuotas</h3>
    <ol>
      <li><b>Inicial y cuotas.</b> Pagas una inicial y el resto en cuotas semanales o quincenales, según lo que permita cada equipo.</li>
      <li><b>Mora.</b> Si pagas una cuota después de su fecha, se suman <b>${usd(S.cfg.mora)}</b> a esa cuota.</li>
      <li><b>Propiedad del equipo.</b> El equipo sigue siendo de ${esc(t.name)} hasta que termines de pagar todas las cuotas.</li>
      <li><b>Falta de pago.</b> Si acumulas <b>más de 3 cuotas vencidas</b> sin pagar, la tienda puede recuperar el equipo.</li>
      <li><b>Contrato.</b> Al recibir el equipo firmas un contrato de compraventa con estos datos (incluido el IMEI del equipo).</li>
      <li><b>Verificación.</b> Para comprar en cuotas verificamos tu identidad una sola vez (foto tuya y de tu cédula). Esos datos no se divulgan.</li>
    </ol>`:''}
  </div>`;
}
/* ===================== legal: términos de uso y política de privacidad ===================== */
const LEGAL_FECHA = '10 de noviembre de 2026';
function legalWho(){
  return `<div class="tbl"><table class="t legal-who"><thead><tr><th>Comercio</th><th>RIF</th><th>Vende</th><th>Contacto</th></tr></thead><tbody>
    ${S.stores.map(t=>`<tr><td><b>${esc(t.name)}</b>${t.rep?`<div class="muted small">Representante: ${esc(t.rep)}</div>`:''}</td><td class="nw">${esc(t.rif||'—')}</td><td>${t.cuotas?'De contado y en cuotas':'De contado'}</td>
      <td>${t.whatsapp?`WhatsApp ${esc(fmtWa(t.whatsapp))}`:''}${t.correo?`<div>${esc(t.correo)}</div>`:''}</td></tr>`).join('')}
  </tbody></table></div>`;
}
const fmtWa = w => { const d = onlyDigits(w); return d.startsWith('58') && d.length===12 ? `+58 ${d.slice(2,5)}-${d.slice(5)}` : d; };
function legalLayout(title, intro, secs){
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<span>${title}</span></div>
  <div class="legal">
    <aside class="legal-toc box"><b>Contenido</b><ol>${secs.map(([id,h])=>`<li><button data-act="legal" data-v="${S.route.v}" data-s="${id}">${h}</button></li>`).join('')}</ol>
      <div class="legal-alt">${S.route.v==='terminos'?'<button class="link small" data-act="go" data-v="privacidad">Ver la Política de privacidad →</button>':'<button class="link small" data-act="go" data-v="terminos">Ver los Términos de uso →</button>'}</div></aside>
    <article class="legal-body">
      <h1>${title}</h1><p class="muted small">Versión ${LEGAL_VERSION} · Vigente desde el ${LEGAL_FECHA}</p>
      ${intro}
      ${secs.map(([id,h,body],i)=>`<section id="lg-${id}"><h2><span class="num">${i+1}.</span> ${h}</h2>${body}</section>`).join('')}
    </article>
  </div>`;
}
function vTerminos(){
  const fin = finStores(), mora = usd(S.cfg.mora), g = S.stores[0] || {};
  const secs = [
    ['quienes','Quiénes somos', `<p>Este sitio lo operan los comercios que se indican abajo. Cada producto muestra quién lo vende (“Vendido por”). Ese comercio es el que recibe tu pago, despacha el equipo, responde por la garantía y, si aplica, te otorga el crédito.</p>${legalWho()}`],
    ['aceptacion','Aceptación de estos términos', `<p>Al crear tu cuenta, marcar la casilla de aceptación o hacer un pedido, declaras que leíste y aceptas estos Términos de uso y la <button class="link" data-act="go" data-v="privacidad">Política de privacidad</button>. Esa aceptación electrónica tiene la misma validez que una firma escrita, conforme a la Ley sobre Mensajes de Datos y Firmas Electrónicas. Si no estás de acuerdo, no uses el sitio.</p>`],
    ['cuenta','Tu cuenta', `<ul><li>Debes ser <b>mayor de 18 años</b> y tener cédula de identidad venezolana o de extranjero residente.</li><li>Los datos que registras deben ser verdaderos y tuyos. Se permite una cuenta por cédula.</li><li>Tu contraseña es personal. Eres responsable de lo que se haga con tu cuenta; si sospechas que alguien más la usa, cámbiala y avísanos.</li><li>Podemos suspender o cerrar cuentas con datos falsos, comprobantes alterados, suplantación de identidad o uso fraudulento, sin perjuicio de las acciones legales que correspondan.</li></ul>`],
    ['productos','Productos y condición', `<p>Vendemos teléfonos y sus accesorios. Cada ficha indica la condición del equipo:</p><ul><li><b>Nuevo:</b> sin uso, en su empaque.</li><li><b>Clase A:</b> usado, en excelente estado, sin marcas visibles.</li><li><b>Clase B:</b> usado, con detalles estéticos leves que no afectan su funcionamiento.</li><li><b>Clase C:</b> usado, con marcas de uso visibles; funciona correctamente.</li></ul><p>En los equipos usados se indica, cuando se conoce, el estado de la batería. Las fotos pueden ser referenciales. La existencia es limitada y se confirma al verificar el pago.</p>`],
    ['precios','Precios, moneda y tasa', `<ul><li>Los precios se publican en <b>dólares de los Estados Unidos (USD)</b> como moneda de referencia.</li><li>Si pagas en <b>bolívares</b> (pago móvil o transferencia), el monto se calcula con la tasa que publica el comercio vendedor el día del pago y puede incluir un <b>ajuste por pago en bolívares</b>. Por eso <b>el monto en bolívares y el monto en dólares son distintos</b>. Antes de pagar ves los dos montos.</li><li>El monto que se te muestra al momento de pagar es el que debes pagar. Si pagas otro día, el monto en bolívares puede cambiar porque la tasa cambia.</li><li>Si pagas en <b>USDT</b> o en <b>efectivo</b>, pagas el monto en dólares.</li><li>Cada pago queda registrado con la tasa que se usó.</li><li>Los precios y promociones pueden cambiar sin aviso, pero no afectan los pedidos ya pagados ni los créditos ya aprobados.</li></ul>`],
    ['pedidos','Pedidos, reserva y pago', `<ul><li>Al confirmar un pedido, los productos quedan reservados por <b>${S.cfg.reservaHoras} horas</b>. Si en ese tiempo no se recibe el pago, el pedido se cancela solo.</li><li>Los pagos con comprobante (pago móvil, transferencia o USDT) los verifica el comercio antes de despachar. Si el comprobante no coincide con el dinero recibido, el pago se rechaza y te avisamos.</li><li>El pago en efectivo se coordina por WhatsApp y el comercio lo registra cuando lo recibe.</li><li>Enviar comprobantes falsos o alterados es motivo de cierre de la cuenta y puede ser denunciado ante las autoridades.</li><li>Puedes cancelar tu pedido desde tu cuenta mientras esté pendiente de pago. Si ya pagaste y quieres cancelar antes del despacho, escríbele por WhatsApp al comercio: si se cancela, te devuelve el dinero por el mismo medio y en la moneda en que pagaste.</li></ul>`],
    ['envios','Envíos y entrega', `<ul><li>Hacemos entregas por delivery en la ciudad y envíos nacionales por encomienda. El costo y el tiempo estimado se muestran antes de pagar.</li><li>Al recibir, <b>revisa el equipo con quien te lo entrega</b>: pantalla, cornetas, cámaras, Face ID o huella, pin de carga, botones y liberación. Cualquier falla visible debe reportarse en ese momento.</li><li>En envíos nacionales, el equipo viaja a nombre de la persona registrada en el pedido. Revisa el paquete al retirarlo de la empresa de encomiendas.</li></ul>`],
    ['garantia','Garantía', `<p><b>Cubre:</b> ${esc(g.garCubre||'')}</p><p><b>No cubre:</b> ${esc(g.garExcluye||'')}</p><p>Para usarla, escríbele por WhatsApp al comercio que te vendió el equipo con el código de tu pedido y una descripción de la falla. El comercio revisa el equipo y, según el diagnóstico, lo repara o lo cambia por uno de igual condición. La garantía corre desde la fecha de entrega.</p>`],
    ['devoluciones','Cambios y devoluciones', `<p>Si el equipo llega con una falla que se detecta en la revisión al entregar, o presenta una falla cubierta por la garantía, tienes derecho a la reparación o al cambio según lo indicado arriba. No se aceptan cambios por equipos dañados por el uso, golpes, humedad o manipulación de terceros. Esto no limita los derechos que te reconoce la legislación venezolana de protección a las personas en el acceso a bienes y servicios.</p>`],
    ...(fin.length?[['cuotas','Compras en cuotas', `<p>Solo ${fin.map(t=>esc(t.name)).join(' y ')} vende en cuotas, y solo en los equipos marcados “Contado o cuotas”.</p><ul><li><b>Verificación:</b> para pedir un crédito verificamos tu identidad una sola vez (foto tuya, foto de tu cédula, dirección y ubicación). La aprobación la decide una persona del comercio y puede negarse.</li><li><b>Inicial y cuotas:</b> pagas una inicial y el resto en cuotas semanales o quincenales, según lo que permita cada equipo. Antes de confirmar ves el número de cuotas, el monto de cada una y sus fechas.</li><li><b>Mora:</b> si pagas una cuota después de su fecha, se suma un cargo fijo de <b>${mora}</b> a esa cuota.</li><li><b>Reserva de dominio:</b> el equipo sigue siendo propiedad del comercio hasta que pagues todas las cuotas.</li><li><b>Falta de pago:</b> si acumulas más de 3 cuotas vencidas sin pagar, el comercio puede dar por terminado el crédito y recuperar el equipo.</li><li><b>Contrato:</b> al recibir el equipo firmas un contrato de compraventa a crédito con el IMEI del equipo y el cronograma de pagos.</li><li><b>Pago adelantado:</b> puedes adelantar cuotas o liquidar el crédito cuando quieras.</li><li><b>Recordatorios:</b> te podemos escribir por WhatsApp antes y después de cada vencimiento.</li></ul>`]]:[]),
    ['compras','Condiciones de compra por vendedor', `<p>Son las condiciones que aceptas antes de cada compra. Las de cada comercio:</p><div class="two">${S.stores.map(t=>`<section class="box">${storeChip(t.id)}${terminosHTML(t)}</section>`).join('')}</div>`],
    ['uso','Uso permitido del sitio', `<p>No está permitido usar el sitio para fines ilícitos, intentar acceder a cuentas o datos de otras personas, interferir con su funcionamiento, copiar el catálogo de forma automatizada ni publicar información falsa. Estas conductas pueden constituir delitos según la Ley Especial contra los Delitos Informáticos.</p>`],
    ['propiedad','Propiedad intelectual', `<p>Los nombres, logos, textos, fotos y diseño del sitio pertenecen a sus comercios o a sus respectivos titulares. Las marcas de los fabricantes de teléfonos pertenecen a ellos y se usan solo para identificar los productos.</p>`],
    ['responsabilidad','Responsabilidad', `<p>Hacemos lo posible para que el sitio funcione sin interrupciones y la información sea correcta, pero puede haber fallas técnicas o errores de publicación. Si un precio publicado tiene un error evidente, te avisaremos antes de despachar y podrás cancelar con devolución total. No respondemos por fallas de los bancos, de Binance o de las empresas de encomiendas, ni por casos de fuerza mayor.</p>`],
    ['cambios','Cambios a estos términos', `<p>Podemos actualizar estos términos. La versión y la fecha aparecen arriba. Si el cambio es importante, te lo mostraremos al entrar a tu cuenta y te pediremos aceptarlo. Los pedidos y créditos ya hechos se rigen por la versión que aceptaste en su momento.</p>`],
    ['ley','Ley aplicable', `<p>Estos términos se rigen por las leyes de la República Bolivariana de Venezuela. Antes de cualquier reclamo formal, escríbenos: casi todo se resuelve por WhatsApp. Si no hay acuerdo, las partes se someten a los tribunales competentes de ${esc(BRAND.ciudad||'Caracas')}.</p>`],
    ['contacto','Contacto', `<p>Para dudas sobre estos términos, escríbele por WhatsApp al comercio que corresponda:</p>${legalWho()}`]
  ];
  return legalLayout('Términos de uso', `<p class="lead-s">Estas son las reglas para usar este sitio y comprar en él. Están escritas en lenguaje sencillo; si algo no queda claro, pregúntanos por WhatsApp.</p>`, secs);
}
function vPrivacidad(){
  const fin = finStores();
  const secs = [
    ['responsables','Quién es responsable de tus datos', `<p>Los comercios que operan este sitio son responsables de los datos que les das al registrarte y al comprarles. Cada comercio trata los datos de los pedidos, pagos y créditos que recibe.</p>${legalWho()}`],
    ['datos','Qué datos recopilamos', `<ul>
      <li><b>Al crear tu cuenta:</b> nombre y apellido, sexo, cédula, teléfono, correo y contraseña. La contraseña se guarda cifrada y nadie del comercio puede verla.</li>
      <li><b>Al comprar:</b> productos, dirección y ciudad de entrega, forma de pago y método de envío.</li>
      <li><b>Al pagar:</b> banco de origen, número de referencia o ID de la orden de Binance, monto pagado y la captura o PDF del comprobante.</li>
      ${fin.length?`<li><b>Si pides un crédito:</b> fecha de nacimiento, estado, ciudad y dirección, tu ubicación en el momento de la solicitud (solo si la compartes), ocupación, lugar de trabajo, rango de ingreso, una referencia personal (nombre, teléfono y parentesco), una foto tuya y una foto de tu cédula.</li>`:''}
      <li><b>Si haces un encargo o te postulas para vender con nosotros:</b> los datos que escribas en el formulario.</li>
      <li><b>Al escribirnos por WhatsApp:</b> tu número y los mensajes que envíes.</li>
      <li><b>Datos técnicos:</b> tu navegador guarda tu carrito y tu sesión para que no los pierdas. No usamos publicidad ni herramientas de rastreo de terceros.</li></ul>`],
    ['uso','Para qué los usamos', `<ul><li>Crear y administrar tu cuenta.</li><li>Procesar tus pedidos, verificar tus pagos y enviarte los equipos.</li>${fin.length?'<li>Verificar tu identidad, evaluar y administrar tus créditos, preparar el contrato y recordarte tus cuotas por WhatsApp.</li>':''}<li>Atender la garantía, tus reclamos y tus consultas.</li><li>Prevenir fraudes, como comprobantes falsos o suplantación de identidad.</li><li>Cumplir obligaciones legales, fiscales y contables.</li></ul><p>No vendemos ni alquilamos tus datos. No los usamos para publicidad de terceros. Las decisiones sobre tu crédito las toma una persona, no un sistema automático.</p>`],
    ['base','Tu consentimiento', `<p>Tratamos tus datos con tu consentimiento libre, previo, informado e inequívoco, que das al crear tu cuenta y, para los créditos, al enviar tu verificación; y porque son necesarios para cumplir la compra que nos pides. Seguimos los principios fijados por la Sala Constitucional del Tribunal Supremo de Justicia (sentencia N.° 1318 del 4 de agosto de 2011): consentimiento, legalidad, finalidad, calidad, temporalidad, exactitud, previsión, seguridad, tutela y responsabilidad. Puedes revocar tu consentimiento cuando quieras (ver “Tus derechos”).</p>`],
    ['acceso','Quién puede ver tus datos', `<ul><li><b>El comercio al que le compras</b>, a través de su personal autorizado.</li>${fin.length?`<li><b>Los comercios de este sitio</b> pueden consultar el historial de tus compras en cuotas (créditos, cuotas y pagos) para administrar el riesgo de crédito. Las fotos de tu identidad solo las ve el comercio con el que compras.</li>`:''}<li><b>Proveedores que nos prestan servicios</b>: alojamiento del sitio y de la base de datos en la nube, y el proveedor de las fuentes tipográficas del sitio. Solo tratan los datos para prestar ese servicio.</li><li><b>Empresas de envío</b>: tu nombre, teléfono y dirección, solo para entregarte el paquete.</li><li><b>Autoridades</b>, cuando una ley o una orden judicial lo exija.</li></ul><p>Cada cliente solo puede ver sus propios datos. Los demás clientes nunca ven tu información.</p>`],
    ['internacional','Servidores fuera de Venezuela', `<p>La base de datos y el sitio se alojan en servicios en la nube que pueden tener sus servidores fuera de Venezuela. Elegimos proveedores con medidas de seguridad reconocidas. Al aceptar esta política autorizas ese alojamiento.</p>`],
    ['seguridad','Cómo protegemos tus datos', `<ul><li>Toda la comunicación con el sitio va cifrada (HTTPS).</li><li>Cada persona solo accede a lo que le corresponde: tú a tus datos, y el personal del comercio a los de sus clientes.</li><li>Las fotos de identidad y los comprobantes se guardan en un almacenamiento privado; solo se abren con enlaces temporales para el personal autorizado.</li><li>Los cambios que hace el personal quedan registrados en un historial.</li></ul><p>Ningún sistema es 100% invulnerable. Si ocurre un incidente que afecte tus datos, te avisaremos lo antes posible.</p>`],
    ['conservacion','Cuánto tiempo los guardamos', `<p>Mientras tengas tu cuenta y, después, por el tiempo que exijan las obligaciones legales, fiscales y contables, o hasta que termines de pagar un crédito y se cierre cualquier reclamo pendiente. Luego los eliminamos o los anonimizamos. Las postulaciones que no avanzan se eliminan cuando lo pidas.</p>`],
    ['derechos','Tus derechos', `<p>Según los artículos 28 y 60 de la Constitución, tienes derecho a:</p><ul><li><b>Saber</b> qué datos tenemos sobre ti y para qué los usamos.</li><li><b>Acceder</b> a ellos y recibir una copia.</li><li><b>Corregirlos o actualizarlos.</b> Tu teléfono y tu dirección los puedes cambiar tú en “Mi cuenta”.</li><li><b>Pedir que se eliminen</b> cuando ya no sean necesarios o cuando retires tu consentimiento, salvo los que debamos conservar por ley o por un crédito pendiente.</li><li><b>Revocar tu consentimiento</b> en cualquier momento, sin efecto sobre lo ya hecho.</li></ul><p>Para ejercerlos, escríbele por WhatsApp o por correo al comercio con el que compraste, desde el número o el correo de tu cuenta. Te respondemos en un máximo de 15 días hábiles.</p>`],
    ['terceros','Datos de otras personas', `<p>Si nos das los datos de una referencia personal o de otra persona que recibe tu pedido, confirmas que esa persona sabe que nos los das y está de acuerdo.</p>`],
    ['menores','Menores de edad', `<p>El sitio es solo para mayores de 18 años. No creamos cuentas a menores. Si detectamos una, la cerramos y eliminamos sus datos.</p>`],
    ['navegador','Datos guardados en tu navegador', `<p>Usamos el almacenamiento de tu navegador solo para tu carrito y para mantener tu sesión iniciada. No usamos cookies de publicidad. Si borras los datos del navegador, se vacía el carrito y tendrás que volver a ingresar.</p>`],
    ['cambios','Cambios a esta política', `<p>Si cambiamos esta política, actualizaremos la versión y la fecha de arriba. Si el cambio es importante, te lo mostraremos al entrar a tu cuenta y te pediremos aceptarlo.</p>`],
    ['contacto','Contacto', `${legalWho()}`]
  ];
  return legalLayout('Política de privacidad', `<p class="lead-s">Aquí te explicamos qué datos tuyos guardamos, para qué, quién los ve y cómo puedes controlarlos. Tus datos son tuyos.</p>`, secs);
}
function legalModal(){
  M = {type:'legal'};
  modal('Actualizamos nuestros términos', `<p>Publicamos una nueva versión de los <button class="link" data-act="legalgo" data-v="terminos">Términos de uso</button> y de la <button class="link" data-act="legalgo" data-v="privacidad">Política de privacidad</button> (versión ${LEGAL_VERSION}).</p><p class="muted small">Explican con más detalle cómo se calculan los montos en bolívares, la garantía, las compras en cuotas y cómo cuidamos tus datos.</p>`,
    `<button class="btn" data-act="logout">Salir</button><button class="btn buy" data-act="legalok">Leí y acepto</button>`);
}
function termsModal(store){
  const t = ST(store); M = {type:'terms', store};
  modal(`Antes de comprar en ${esc(t.name)}`, `<p class="muted small" style="margin:0">Lee las condiciones. Al continuar, aceptas que las conoces junto con los <button class="link small" data-act="legalgo" data-v="terminos">Términos de uso</button> y la <button class="link small" data-act="legalgo" data-v="privacidad">Política de privacidad</button>.</p>${terminosHTML(t)}`,
    `<button class="btn" data-act="termsno">Volver al carrito</button><button class="btn buy" data-act="termsok">Acepto y continuar</button>`, true);
}
function vFinanciamiento(){
  const eq = S.products.filter(p=>p.active!==false && p.fin && ST(p.store).cuotas && p.price>=S.cfg.minFin).sort((a,b)=>a.price-b.price);
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<span>Financiamiento</span></div>
  <h1 style="margin-bottom:6px">Financiamiento</h1><p class="muted" style="margin-bottom:20px;max-width:70ch">Compra tu teléfono pagando una inicial y el resto en cuotas. ${finStores().length?`Disponible en ${finStores().map(t=>esc(t.name)).join(' y ')}.`:''} La inicial y el número de cuotas de cada equipo los define la tienda.</p>
  <div class="two">
    <section class="box"><h2>Equipos en cuotas</h2>
      ${eq.length?`<div class="tbl"><table class="t"><thead><tr><th>Equipo</th><th class="r">Precio</th><th class="r">Inicial</th><th class="r">Cuotas</th></tr></thead><tbody>
      ${eq.filter(p=>pOpts(p).length).map(p=>{const n=pPlan(p);return `<tr><td><button class="link" data-act="pd" data-id="${p.id}">${esc(p.name)}</button></td><td class="r num">${usd(p.price)}</td><td class="r num">${usd(r2(p.price*pIni(p)))}</td><td class="r nw">${pOpts(p).map(o=>`${o.n} ${o.f==='semanal'?'semanales':'quincenales'} × ${usd(finCuota(p.price, o.n, pIni(p)))}`).join('<br>')}</td></tr>`}).join('')}
      </tbody></table></div>`:'<p class="muted">Por ahora no hay equipos en cuotas.</p>'}
    </section>
    <aside class="box"><h2>Condiciones</h2>
      <table class="spec">
        <tr><td>Inicial y cuotas</td><td>Las define la tienda para cada equipo</td></tr>
        <tr><td>Compra mínima</td><td>${usd(S.cfg.minFin)}</td></tr>
        <tr><td>Cuotas</td><td>Semanales o quincenales, según el equipo</td></tr>
        <tr><td>Mora</td><td>${usd(S.cfg.mora)} fijos por cada cuota pagada después de su vencimiento</td></tr>
        <tr><td>Propiedad</td><td>El equipo es de la tienda hasta que termines de pagar. Con más de 3 cuotas vencidas sin pagar, la tienda puede recuperarlo.</td></tr>
        <tr><td>Contrato</td><td>Firmas un contrato de compraventa al recibir el equipo</td></tr>
        <tr><td>Créditos simultáneos</td><td>Máximo ${S.cfg.maxCreditos} por tienda</td></tr>
        <tr><td>Requisitos</td><td>Cuenta registrada con cédula, verificación de identidad y no tener cuotas vencidas</td></tr>
      </table>
    </aside>
  </div>`;
}

/* ===================== vista: mi cuenta ===================== */
function vCuenta(){
  const u = me();
  if(!u){ S.after = 'cuenta'; return vLogin('Inicia sesión para ver tus pedidos, créditos y pagos.'); }
  if(isAdmin()) return vAdmin();
  const ords = S.orders;
  const cr = S.credits.filter(c=>c.st!=='cancelado');
  const pays = S.payments;
  const nf = S.notifs;
  const attn = ords.filter(o=>['pendiente_pago','pago_rechazado'].includes(o.st)).length + cr.filter(c=>c.st==='en_mora').length;
  const needV = ['incompleto','rechazado'].includes(u.verif);
  const tabs = [['resumen','Resumen',attn],['verificacion','Verificación',u.verif==='rechazado'?1:0],['pedidos','Mis pedidos',0],['creditos','Mis créditos',cr.filter(c=>c.st==='en_mora').length],['pagos','Mis pagos',0],['encargos','Mis encargos',0],['notificaciones','Notificaciones',nf.filter(n=>!n.read).length],['datos','Mis datos',0]];
  const t = S.acct;
  let body='';
  if(t==='resumen'){
    const k = S.cupo || {}; const deuda = sum(cr,saldo);
    const nxt = cr.filter(c=>['activo','en_mora'].includes(c.st)).flatMap(c=>c.cuotas.filter(q=>q.status!=='pagada').map(q=>({c,q}))).sort((a,b)=>a.q.due-b.q.due)[0];
    const act = ords.filter(o=>!['entregado','cancelado'].includes(o.st));
    body = `<h1>Hola, ${esc(u.name.split(' ')[0])}</h1>
      ${u.verif==='rechazado'?`<div class="note bad">No pudimos verificar tus documentos. Para comprar en cuotas vuelve a enviarlos. <button class="link" data-act="acct" data-v="verificacion">Enviar documentos</button></div>`:''}
      <div class="kpis">
        <div class="kpi"><div class="l">Pedidos en curso</div><div class="v num">${act.length}</div></div>
        <div class="kpi ${cr.some(c=>c.st==='en_mora')?'alert':''}"><div class="l">Saldo de créditos</div><div class="v num">${usd(deuda)}</div></div>
        <div class="kpi"><div class="l">Próxima cuota</div><div class="v num" style="font-size:18px">${nxt?`${usd(cuotaDue(nxt.q))}<div class="muted small" style="font-family:var(--f-body);font-weight:500">${nxt.q.due<dayStart(S.today)?'Vencida el ':'Vence el '}${fd(nxt.q.due)}</div>`:'—'}</div></div>
        <div class="kpi"><div class="l">Créditos abiertos</div><div class="v num">${cr.filter(c=>['evaluacion','activo','en_mora'].includes(c.st)).length}</div></div>
      </div>
      ${cr.filter(c=>c.st==='en_mora').map(c=>`<div class="note bad">Tu crédito ${c.code} tiene cuotas vencidas. Cada cuota vencida suma ${usd(S.cfg.mora)} de mora. <button class="link" data-act="acct" data-v="creditos">Pagar ahora</button></div>`).join('')}
      ${ords.filter(o=>o.st==='pendiente_pago').map(o=>`<div class="note warn">El pedido ${o.code} está reservado hasta el ${fdt(o.deadline)}. ${false?'':'<button class="link" data-act="payorder" data-o="'+o.id+'">Subir comprobante</button>'}</div>`).join('')}
      ${ords.filter(o=>o.st==='pago_rechazado').map(o=>`<div class="note bad">No pudimos verificar el pago del pedido ${o.code}. <button class="link" data-act="payorder" data-o="${o.id}">Subir nuevo comprobante</button></div>`).join('')}
      <h2>Pedidos en curso</h2>${act.length?act.map(orderCard).join(''):'<div class="empty">No tienes pedidos en curso.</div>'}`;
  }
  if(t==='verificacion') body = verifPanel();
  if(t==='pedidos') body = `<h1>Mis pedidos</h1>${ords.length?ords.map(orderCard).join(''):'<div class="empty">Aún no has hecho pedidos.</div>'}`;
  if(t==='creditos') body = `<h1>Mis créditos</h1>${cr.length?cr.map(creditCard).join(''):`<div class="empty"><h2>No tienes créditos</h2><p>Puedes financiar compras desde ${usd(S.cfg.minFin)}.</p></div>`}`;
  if(t==='pagos') body = `<h1>Mis pagos</h1>${pays.length?`<div class="tbl"><table class="t"><thead><tr><th>Pago</th><th>Fecha</th><th>Concepto</th><th>Método</th><th>Referencia</th><th>Estado</th><th class="r">Monto</th></tr></thead><tbody>
    ${pays.map(p=>`<tr><td class="nw">${p.code}</td><td class="nw">${fd(p.created)}</td><td>${concept(p)}${p.note?`<div class="err small">${esc(p.note)}</div>`:''}</td><td>${metN(p.method)}${p.bank?' · '+esc(p.bank):''}</td><td>${esc(p.ref)}</td><td>${tag(p.status)}</td><td class="r num nw">${amtTxt(p)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no has registrado pagos.</div>'}`;
  if(t==='notificaciones'){ body = `<h1>Notificaciones</h1><div class="tbl">${nf.length?nf.map(n=>`<div class="notif ${n.read?'':'unread'}">${ico('bell')}<span>${esc(n.text)}</span><span class="dt">${fdt(n.at)}</span></div>`).join(''):'<div class="notif">Sin notificaciones.</div>'}</div>`;
    if(nf.some(n=>!n.read)) setTimeout(async()=>{ const {error} = await sb.rpc('marcar_notificaciones_leidas'); if(!error){ nf.forEach(n=>n.read=true); renderChrome(); } }, 800); }
  if(t==='encargos'){ const mine = S.encs.filter(e=>e.userId===u.id);
    body = `<div class="row between"><h1>Mis encargos</h1><button class="btn buy sm" data-act="encargar">Nuevo encargo</button></div>
    ${mine.length?`<div class="tbl"><table class="t"><thead><tr><th>Encargo</th><th>Tienda</th><th>Equipo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>${mine.map(e=>{const [l,c]=ENCEST[e.estado]||['',''];return `<tr><td class="nw">${e.codigo}</td><td>${storeChip(e.store)}</td><td><b>${esc([e.marca,e.modelo].filter(Boolean).join(' '))}</b><div class="muted small">${esc([e.capacidad,e.color].filter(Boolean).join(' · '))}</div></td><td class="nw">${fd(e.creado)}</td><td><span class="tag ${c}">${l}</span></td><td>${waLink(encMsg(e), e.store)?`<a class="btn sm" href="${waLink(encMsg(e), e.store)}" target="_blank" rel="noopener">WhatsApp</a>`:''}</td></tr>`}).join('')}</tbody></table></div>`
      :'<div class="empty"><h2>No tienes encargos</h2><p>Si buscas un modelo que no está en el catálogo, encárgalo y te escribimos por WhatsApp.</p></div>'}`; }
  if(t==='datos') body = `<h1>Mis datos</h1><section class="box"><form id="dataf" class="field" style="gap:14px">
      <div class="fg"><div class="field"><label>Nombre</label><input value="${esc(u.name)}" disabled></div><div class="field"><label>Cédula</label><input value="${esc(u.cedula)}" disabled></div>
      <div class="field"><label>Correo</label><input value="${esc(u.email)}" disabled></div><div class="field"><label for="d-tel">Teléfono <span class="muted">(solo números)</span></label><input id="d-tel" data-digits="11" inputmode="numeric" value="${esc(u.phone)}"></div>
      <div class="field" style="grid-column:1/-1"><label for="d-addr">Dirección principal</label><input id="d-addr" value="${esc(u.addr)}"></div><div class="field"><label for="d-city">Ciudad</label><input id="d-city" value="${esc(u.city)}"></div></div>
      <div><button class="btn brand" type="submit">Guardar cambios</button></div><span class="muted small">Para cambiar tu nombre o cédula escríbenos; los usamos para validar tus pagos.</span></form></section>`;
  return `<div class="panel"><nav class="side"><div class="who"><b>${esc(u.name)}</b><div class="muted small">Cliente desde ${fd(u.created)}</div></div>
    ${tabs.map(([k,l,n])=>`<button data-act="acct" data-v="${k}" aria-current="${t===k}">${l}${n?`<span class="c">${n}</span>`:''}</button>`).join('')}
    <button data-act="logout">Cerrar sesión</button></nav><div class="content">${body}</div></div>`;
}
function orderCard(o){
  const c = o.creditId ? C(o.creditId) : null;
  return `<article class="ord"><div class="oh"><div class="meta">
      <div><span>Pedido</span><b>${o.code}</b></div><div><span>Tienda</span>${storeChip(o.store)}</div><div><span>Fecha</span>${fd(o.created)}</div><div><span>Total</span><b class="num">${usd(o.total)}</b></div>
      <div><span>Modalidad</span>${o.mode==='contado'?'Contado':'Financiado'+(c?` · ${c.n} cuotas ${c.freq}`:'')}</div><div><span>Entrega</span>${esc(S.cfg.envio[o.ship.method]?.n||o.ship.method)}</div></div>${tag(o.status)}</div>
    <div class="ob2">
      ${o.items.map(i=>{const p=P(i.pid)||{name:i.name,colors:[{hex:'#777'}],shape:'phone'}; return `<div class="citem" style="grid-template-columns:56px 1fr;border:0;padding:0"><div class="th" style="height:56px">${img(p,i.ci)}</div><div><b>${esc(i.name)}</b><div class="muted small">${esc(i.color||'')}${i.storage?' · '+esc(i.storage):''} · ${i.qty} × ${usd(i.unit)}</div></div></div>`}).join('')}
      ${track(o)}
      ${o.st==='enviado'&&o.courier==='Delivery propio'?`<div class="small">En camino con nuestro delivery${o.tracking?` · lo lleva <b>${esc(o.tracking)}</b>`:''}</div>`:o.tracking&&o.st!=='entregado'?`<div class="small">Envío por ${esc(o.courier||'')} · guía <b>${esc(o.tracking)}</b></div>`:''}
      ${o.st==='pendiente_pago'?`<div class="note warn small">Reservado hasta el ${fdt(o.deadline)}.</div>`:''}
      ${['pendiente_pago','pago_rechazado'].includes(o.st)?`<div class="row">${true?`<button class="btn buy sm" data-act="payorder" data-o="${o.id}">${o.st==='pago_rechazado'?'Subir nuevo comprobante':'Subir comprobante'}</button>`:''}<button class="btn danger sm" data-act="cancelask" data-o="${o.id}">Cancelar pedido</button></div>`:''}
    </div></article>`;
}
function creditCard(c){
  const pend = pendingCuotas(c); const today = dayStart(S.today);
  return `<article class="ord"><div class="oh"><div class="meta">
      <div><span>Crédito</span><b>${c.code}</b></div><div><span>Tienda</span>${storeChip(c.store)}</div><div><span>Pedido</span>${O(c.orderId)?.code||''}</div><div><span>Financiado</span><span class="num">${usd(c.financed)}</span></div>
      <div><span>Plan</span>${c.n} cuotas ${c.freq}${c.pct?` · +${Math.round(c.pct*100)}%`:''}</div><div><span>Saldo</span><b class="num">${usd(saldo(c))}</b></div></div>${tag(c.status)}</div>
    <div class="ob2">
    ${c.st==='evaluacion'?`<div class="note warn small">${O(c.orderId)?.st==='pendiente_pago'?'Sube el comprobante de tu inicial para que evaluemos tu solicitud.':'Estamos revisando tu inicial. Al aprobarla generamos tu cronograma y despachamos el pedido.'}</div>`
    : c.st==='rechazado'?`<div class="note bad small">La solicitud no fue aprobada. Te contactaremos para reintegrar la inicial.</div>`
    :`<div class="tbl"><table class="t"><thead><tr><th>Cuota</th><th>Vencimiento</th><th class="r">Monto</th><th class="r">Mora</th><th class="r">A pagar</th><th>Estado</th></tr></thead><tbody>
      ${c.cuotas.map(q=>{const late=q.status!=='pagada'&&q.due<today;return `<tr><td>${q.n} de ${c.n}</td><td class="nw">${fd(q.due)}</td><td class="r num">${usd(q.amount)}</td><td class="r num">${q.mora?`<span class="mora">${usd(q.mora)}</span>`:'—'}</td><td class="r num"><b>${q.status==='pagada'?'—':usd(cuotaDue(q))}</b></td>
      <td>${q.status==='pagada'?`<span class="tag ok">Pagada ${fd(q.paidAt)}</span>`:q.status==='en_revision'?'<span class="tag warn">En revisión</span>':late?'<span class="tag bad">Vencida</span>':'<span class="tag">Pendiente</span>'}</td></tr>`}).join('')}
      </tbody></table></div>
      ${pend.length?`<div class="row"><button class="btn buy sm" data-act="paycuotas" data-c="${c.id}" data-k="1">Pagar cuota ${pend[0].n} · ${usd(cuotaDue(pend[0]))}</button>
        ${pend.length>1?`<button class="btn sm" data-act="paycuotas" data-c="${c.id}" data-k="${pend.length}">Liquidar saldo · ${usd(sum(pend,cuotaDue))}</button>`:''}</div>`:''}`}
    </div></article>`;
}

/* ===================== vista: administración ===================== */
function vAdmin(){
  const u = me();
  if(!u){ S.after = 'admin'; return vLogin('Ingresa con una cuenta de administrador.'); }
  if(!isAdmin()) return `<div class="empty"><h2>Acceso restringido</h2><p>Esta sección es solo para administradores.</p></div>`;
  const pend = S.payments.filter(inAdm).filter(p=>p.status==='pendiente');
  const mora = S.credits.filter(inAdm).filter(c=>c.st==='en_mora');
  const toShip = S.orders.filter(inAdm).filter(o=>['preparando','listo_retiro','pendiente_pago'].includes(o.st));
  const low = S.products.filter(inAdm).filter(p=>p.stock<=5);
  const tabs = [['resumen','Resumen',0],['pagos','Pagos por verificar',pend.length],['creditos','Créditos y cuotas',mora.length],['ventas','Ventas',0],['pedidos','Pedidos y envíos',toShip.length],['clientes','Clientes',admCuo()?admUsers().filter(x=>x.verif==='pendiente').length:0],['encargos','Encargos',S.encs.filter(inAdm).filter(e=>e.estado==='nuevo').length],['postulaciones','Postulaciones',admPosts().filter(p=>p.estado==='nueva').length],['inventario','Inventario',low.length],['config','Configuración',0],['bitacora','Historial de cambios',0]].filter(([k])=>k!=='creditos'||admCuo());
  // Papa's Store ve el financiamiento de Priority One (solo lectura)
  const finSt = S.stores.filter(x=>x.cuotas);
  if(!admCuo() && finSt.length) tabs.splice(3, 0, ['finotra', 'Financiamiento '+finSt.map(x=>x.name).join(' / '), 0]);
  const fn = {resumen:aResumen, pagos:aPagos, creditos:aCreditos, pedidos:aPedidos, ventas:aVentas, inventario:aInventario, clientes:aClientes, encargos:aEncargos, postulaciones:aPostulaciones, config:aConfig, bitacora:aBitacora, finotra:()=>aCreditos(true)}[S.adm==='creditos'&&!admCuo()?'resumen':S.adm] || aResumen;
  const t = myStore() ? ST(myStore()) : null;
  return `<div class="panel"><nav class="side"><div class="who">${t?`<div class="row" style="gap:8px">${storeMark(t,28)}<b>${esc(t.name)}</b></div>`:'<b>Administración general</b>'}<div class="muted small">${esc(u.name)}</div></div>
    ${isGenAdmin()?`<div class="field" style="margin:4px 0 8px"><label for="adm-st" class="small">Ver tienda</label><select id="adm-st" data-on="admstore"><option value="0">Las dos tiendas</option>${S.stores.map(x=>`<option value="${x.id}" ${S.admStore===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`:''}
    ${tabs.map(([k,l,n])=>`<button data-act="adm" data-v="${k}" aria-current="${S.adm===k}">${l}${n?`<span class="c">${n}</span>`:''}</button>`).join('')}
    <button data-act="reload" title="Trae los pedidos y pagos que hayan llegado mientras tenías el panel abierto">Actualizar datos</button><button data-act="go" data-v="inicio">Ver tienda</button><button data-act="logout">Cerrar sesión</button></nav>
    <div class="content">${fn()}</div></div>`;
}
// clientes que compran en la tienda del panel (o en la elegida)
const admUsers = () => { const t = admStoreId(); const all = S.users.filter(u=>u.role==='cliente'); return t==null ? all : all.filter(u=>S.orders.some(o=>o.userId===u.id && o.store===t)); };
const admPosts = () => { const t = admStoreId(); return t==null ? S.posts : S.posts.filter(p=>p.store==null || p.store===t); };
const stCol = id => isGenAdmin() && !S.admStore ? `<div class="small" style="margin-top:3px">${storeChip(id)}</div>` : '';
function aResumen(){
  const pend = S.payments.filter(inAdm).filter(p=>p.status==='pendiente');
  const mora = S.credits.filter(inAdm).filter(c=>c.st==='en_mora');
  const cxc = sum(S.credits.filter(inAdm),saldo), morasT = sum(S.credits.filter(inAdm).filter(c=>['activo','en_mora'].includes(c.st)).flatMap(c=>c.cuotas.filter(q=>q.status!=='pagada')),q=>q.mora);
  const ok = S.payments.filter(inAdm).filter(p=>(p.status==='verificado'||p.status==='aprobado') && p.reviewedAt);
  const months = Array.from({length:6},(_,i)=>addMonths(new Date(S.today.getFullYear(),S.today.getMonth(),1),i-5));
  const vals = months.map(m=>r2(sum(ok.filter(p=>p.reviewedAt.getFullYear()===m.getFullYear()&&p.reviewedAt.getMonth()===m.getMonth()),reportedUSD)));
  const mx = Math.max(100,...vals); const top = Math.ceil(mx/250)*250;
  const W=640,H=220,L=56,B=28,bw=56,gap=(W-L-10-bw*6)/5;
  const bars = vals.map((v,i)=>{ const h=(H-B-14)*v/top; const x=L+i*(bw+gap); const y=H-B-h;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${i===5?'#C9A227':'#D6D3CB'}"/><text x="${x+bw/2}" y="${y-5}" text-anchor="middle" font-size="11" fill="#151515">${v?usd(Math.round(v)).replace('.00',''):''}</text>
    <text x="${x+bw/2}" y="${H-9}" text-anchor="middle" font-size="12" fill="#6A6A6A">${months[i].toLocaleDateString('es-VE',{month:'short'})}</text>`; }).join('');
  const grid = [0,.5,1].map(f=>{const y=H-B-(H-B-14)*f;return `<line x1="${L}" x2="${W-10}" y1="${y}" y2="${y}" stroke="#E3E2DF"/><text x="${L-8}" y="${y+4}" text-anchor="end" font-size="11" fill="#6A6A6A">${usd(top*f).replace('.00','')}</text>`}).join('');
  const today = dayStart(S.today);
  const soon = S.credits.filter(inAdm).filter(c=>['activo','en_mora'].includes(c.st)).flatMap(c=>c.cuotas.filter(q=>q.status!=='pagada' && days(S.today,q.due)<=7).map(q=>({c,q}))).sort((a,b)=>a.q.due-b.q.due);
  const low = S.products.filter(inAdm).filter(p=>p.stock<=5);
  const short = pend.filter(p=>reportedUSD(p) < p.expected-0.5);
  const cuo = admCuo();
  const toShip = S.orders.filter(inAdm).filter(o=>['preparando','listo_retiro'].includes(o.st)), unpaid = S.orders.filter(inAdm).filter(o=>['pendiente_pago','pago_rechazado'].includes(o.st));
  // según el contrato: más de 3 cuotas sin pagar = se puede recuperar el equipo
  const recup = S.credits.filter(inAdm).filter(c=>['activo','en_mora'].includes(c.st)).map(c=>({c, v:c.cuotas.filter(q=>q.status==='pendiente' && q.due<dayStart(S.today)).length})).filter(x=>x.v>3);
  const tsts = admStoreId()!=null ? [ST(admStoreId())] : S.stores;
  const tasaAl = tsts.map(t=>!t.tasa ? `<div class="note bad small"><b>${esc(t.name)} no ha publicado su tasa.</b> Sus clientes solo pueden pagar en dólares. <button class="link small" data-act="adm" data-v="config">Publicar tasa</button></div>`
    : (!t.tasaAt || dayStart(t.tasaAt).getTime()!==dayStart(new Date()).getTime()) ? `<div class="note warn small">La tasa de ${esc(t.name)} no se ha actualizado hoy (última: ${t.tasaAt?fd(t.tasaAt):'—'}). <button class="link small" data-act="adm" data-v="config">Actualizar</button></div>` : '').join('');
  // caja del mes por moneda: lo que realmente entró, separado de lo que se aplicó a las deudas
  const mes = ok.filter(p=>p.reviewedAt.getFullYear()===S.today.getFullYear() && p.reviewedAt.getMonth()===S.today.getMonth());
  const vesP = mes.filter(p=>p.currency==='Bs'), usdtP = mes.filter(p=>p.method==='usdt'), efP = mes.filter(p=>p.method==='efectivo');
  const vesBs = r2(sum(vesP,p=>p.reported)), vesUsd = r2(sum(vesP,p=>p.reported/p.tasa)), vesApl = r2(sum(vesP,reportedUSD));
  const caja = `<section class="box"><h3>Caja de este mes por moneda</h3>
    <div class="tbl"><table class="t"><thead><tr><th>Moneda</th><th class="r">Pagos</th><th class="r">Recibido</th><th class="r">Equivale a</th><th class="r">Aplicado a deudas</th></tr></thead><tbody>
      <tr><td>Bolívares (pago móvil y transferencia)</td><td class="r num">${vesP.length}</td><td class="r num">${bs(vesBs)}</td><td class="r num">${usd(vesUsd)}</td><td class="r num">${usd(vesApl)}</td></tr>
      <tr><td>USDT</td><td class="r num">${usdtP.length}</td><td class="r num">${usd(r2(sum(usdtP,p=>p.reported)))}</td><td class="r num">—</td><td class="r num">${usd(r2(sum(usdtP,reportedUSD)))}</td></tr>
      <tr><td>Efectivo (dólares)</td><td class="r num">${efP.length}</td><td class="r num">${usd(r2(sum(efP,p=>p.reported)))}</td><td class="r num">—</td><td class="r num">${usd(r2(sum(efP,reportedUSD)))}</td></tr>
    </tbody></table></div>
    <p class="muted small">"Equivale a" convierte los bolívares con la tasa guardada en cada pago. La diferencia con "Aplicado a deudas" es el ajuste por pagar en bolívares.</p></section>`;
  const alertas = `<section class="box"><h3>Alertas</h3>
        ${tasaAl}
        ${recup.map(({c,v})=>`<div class="note bad small"><b>${c.code} de ${esc(U(c.userId)?.name||'')}</b>: ${v} cuotas vencidas sin pagar. Según el contrato, la tienda puede recuperar el equipo.</div>`).join('')}
        ${short.map(p=>`<div class="note warn small">${p.code} de ${esc(U(p.userId)?.name||'')}: el monto reportado es menor al esperado por ${usd(r2(p.expected-reportedUSD(p)))}.</div>`).join('')}
        ${low.map(p=>`<div class="note ${p.stock<=0?'bad':'warn'} small">${esc(p.name)}: ${p.stock<=0?'sin existencia':`quedan ${p.stock} unidades`}.</div>`).join('')}
        ${!tasaAl&&!recup.length&&!short.length&&!low.length?'<p class="muted">Sin alertas.</p>':''}</section>`;
  return `<div class="row between"><h1>Resumen</h1><button class="btn sm" data-act="cierre">Ejecutar cierre diario ahora</button></div>
    <div class="kpis">
      <div class="kpi ${pend.length?'alert':''}"><div class="l">Comprobantes por verificar</div><div class="v num">${pend.length}</div></div>
      ${cuo?`<div class="kpi ${mora.length?'alert':''}"><div class="l">Créditos en mora</div><div class="v num">${mora.length}</div></div>
      <div class="kpi"><div class="l">Cuentas por cobrar</div><div class="v num">${usd(cxc)}</div><div class="muted small">incluye ${usd(morasT)} de mora</div></div>`
      :`<div class="kpi ${toShip.length?'alert':''}"><div class="l">Pedidos por entregar</div><div class="v num">${toShip.length}</div></div>
      <div class="kpi"><div class="l">Pedidos sin pagar</div><div class="v num">${unpaid.length}</div><div class="muted small">se cancelan solos al vencer la reserva</div></div>`}
      <div class="kpi"><div class="l">Cobrado este mes</div><div class="v num">${usd(vals[5])}</div></div>
    </div>
    <div class="chart"><h3 style="margin-bottom:8px">Pagos verificados por mes (USD aplicados a deudas)</h3><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pagos verificados por mes">${grid}${bars}</svg></div>
    ${caja}
    ${!cuo?alertas:`<div class="two eq">
      <section class="box"><h3>Cuotas vencidas y por vencer (7 días)</h3>
        ${soon.length?`<div class="tbl"><table class="t"><tbody>${soon.map(({c,q})=>`<tr><td>${esc(U(c.userId)?.name||'')}<div class="muted small">${c.code} · cuota ${q.n}</div></td><td class="nw">${fd(q.due)}</td><td class="r num">${usd(cuotaDue(q))}</td><td>${q.status==='en_revision'?'<span class="tag warn">En revisión</span>':q.due<today?'<span class="tag bad">Vencida</span>':'<span class="tag">Por vencer</span>'}</td><td class="nw">${q.status==='pendiente'?cuotaWa(c,q)+` <button class="btn sm" data-act="cajacuota" data-q="${q.id}">Registrar efectivo</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Nada pendiente en los próximos 7 días.</p>'}</section>
      ${alertas}
    </div>`}`;
}
function aPagos(){
  const f = S.admF.pagos;
  const list = S.payments.filter(inAdm).filter(p=>p.status==='pendiente' && (f==='todos'||p.kind===f)).sort((a,b)=>a.created-b.created);
  const recent = S.payments.filter(inAdm).filter(p=>p.status!=='pendiente' && p.reviewedAt).sort((a,b)=>b.reviewedAt-a.reviewedAt).slice(0,8);
  return `<h1>Pagos por verificar</h1>
    ${admCuo()?`<div class="chips">${[['todos','Todos'],['contado','Contado'],['inicial','Solicitudes de crédito'],['cuota','Cuotas']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="pagos" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</div>`:''}
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Pago</th><th>Cliente</th><th>Concepto</th><th>Método</th><th class="r">Esperado</th><th class="r">Reportado</th><th>Recibido</th><th></th></tr></thead><tbody>
    ${list.map(p=>{const diff=r2(reportedUSD(p)-p.expected);return `<tr><td class="nw">${p.code}${stCol(p.store)}</td><td>${esc(U(p.userId)?.name||'')}</td><td>${concept(p)}</td><td>${metN(p.method)}<div class="muted small">${esc(p.bank)} ${esc(p.ref)}</div></td>
      <td class="r num nw">${usd(p.expected)}</td><td class="r num nw">${amtTxt(p)}${diff<-0.5?`<div class="err small">Faltan ${usd(-diff)}</div>`:''}</td><td class="nw">${fdt(p.created)}</td>
      <td><button class="btn brand sm" data-act="review" data-p="${p.id}">Revisar</button></td></tr>`}).join('')}</tbody></table></div>`
    :`<div class="empty">No hay comprobantes pendientes${f!=='todos'?' en este filtro':''}.</div>`}
    <h2>Revisados recientemente</h2>
    ${recent.length?`<div class="tbl"><table class="t"><thead><tr><th>Pago</th><th>Cliente</th><th>Concepto</th><th>Revisado</th><th>Estado</th><th class="r">Monto</th></tr></thead><tbody>
    ${recent.map(p=>`<tr><td>${p.code}</td><td>${esc(U(p.userId)?.name||'')}</td><td>${concept(p)}</td><td class="nw">${fdt(p.reviewedAt)}</td><td>${tag(p.status)}</td><td class="r num nw">${amtTxt(p)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Todavía no hay pagos revisados.</p>'}`;
}
function aCreditos(ro=false){
  const f = S.admF.cred; const today = dayStart(S.today);
  const order = {en_mora:0, evaluacion:1, activo:2, liquidado:3, rechazado:4, cancelado:5};
  const base = ro ? S.credits.filter(c=>ST(c.store)?.cuotas && c.store!==admStoreId()) : S.credits.filter(inAdm);
  const list = base.filter(c=>f==='todos'||c.st===f).sort((a,b)=>(order[a.st]??9)-(order[b.st]??9));
  return `<h1>${ro?'Financiamiento de '+esc(S.stores.filter(x=>x.cuotas).map(x=>x.name).join(' / ')):'Créditos y cuotas'}</h1>
    ${ro?'<p class="muted small">Solo para consultar: los cobros, recordatorios y moras los maneja la tienda que dio el crédito.</p>':''}
    <div class="chips">${['todos','en_mora','activo','evaluacion','liquidado'].map(k=>`<button class="chip" data-act="admf" data-g="cred" data-v="${k}" aria-pressed="${f===k}">${k==='todos'?'Todos':CRE[k]} <span class="num">(${k==='todos'?base.length:base.filter(c=>c.st===k).length})</span></button>`).join('')}</div>
    ${list.length?list.map(c=>{const mt=sum(c.cuotas.filter(q=>q.status!=='pagada'),q=>q.mora); return `<article class="ord"><div class="oh"><div class="meta">
      <div><span>Crédito</span><b>${c.code}</b>${stCol(c.store)}</div><div><span>Cliente</span>${ro?`<b>${esc(U(c.userId)?.name||'')}</b>`:`<button class="link" data-act="edo" data-u="${c.userId}">${esc(U(c.userId)?.name||'')}</button>`}</div>
      <div><span>Inicial</span><span class="num">${usd(c.down)} (${Math.round(c.iniPct*100)}%)</span></div><div><span>Financiado</span><span class="num">${usd(c.financed)}</span></div>
      <div><span>Saldo</span><b class="num">${usd(saldo(c))}</b>${mt?` <span class="mora small">incl. ${usd(mt)} mora</span>`:''}</div></div><div class="row">${!ro&&['activo','en_mora','liquidado'].includes(c.st)?`<button class="btn sm ${c.contrato?'':'brand'}" data-act="contrato" data-c="${c.id}">${c.contrato?'Contrato':'Preparar contrato'}</button>`:''}${tag(c.status)}</div></div>
      <div class="ob2">${c.st==='evaluacion'?'<div class="muted small">La inicial está en “Pagos por verificar” (o el cliente aún no la sube). Al aprobarla se generan las cuotas desde esa fecha.</div>':['rechazado','cancelado'].includes(c.st)?'<div class="muted small">Sin cuotas.</div>':
      `<div class="tbl"><table class="t"><thead><tr><th>Cuota</th><th>Vence</th><th class="r">Monto</th><th class="r">Mora</th><th>Estado</th><th></th></tr></thead><tbody>
      ${c.cuotas.map(q=>{const late=q.status!=='pagada'&&q.due<today; return `<tr><td>${q.n}/${c.n}</td><td class="nw">${fd(q.due)}</td><td class="r num">${usd(q.amount)}</td><td class="r num">${q.mora?`<span class="mora">${usd(q.mora)}</span>`:'—'}</td>
      <td>${q.status==='pagada'?`<span class="tag ok">Pagada ${fd(q.paidAt)}</span>`:q.status==='en_revision'?'<span class="tag warn">En revisión</span>':late?`<span class="tag bad">Vencida · ${days(q.due,S.today)} días</span>`:'<span class="tag">Pendiente</span>'}</td>
      <td class="nw">${ro?'':q.status==='pendiente'?cuotaWa(c,q)+` <button class="btn sm" data-act="cajacuota" data-q="${q.id}">Registrar efectivo</button>`:''} ${!ro&&q.mora&&q.status!=='pagada'?`<button class="btn sm" data-act="condonar" data-q="${q.id}">Condonar mora</button>`:''}</td></tr>`}).join('')}
      </tbody></table></div>`}</div></article>`}).join(''):'<div class="empty">No hay créditos en este filtro.</div>'}`;
}
const VENDIDO = ['preparando','listo_retiro','enviado','entregado'];
/* ===================== contrato de compraventa (se imprime y se firma en papel) ===================== */
function contratoModal(cid){
  const c = C(cid), o = O(c.orderId), it = o?.items[0] || {}, pr = P(it.pid) || {}, k = c.contrato || {};
  M = {type:'contrato', id:cid};
  modal(`Contrato del crédito ${c.code}`, `
    <p class="muted small" style="margin:0">Completa los datos del equipo que vas a entregar. Luego imprime el contrato y fírmenlo los dos al entregarlo.</p>
    <form id="ctf" class="fg" novalidate>
      <div class="field"><label for="ct-i1">IMEI 1</label><input id="ct-i1" inputmode="numeric" data-digits="15" value="${esc(k.imei1||'')}" placeholder="15 dígitos"></div>
      <div class="field"><label for="ct-i2">IMEI 2 <span class="muted">(si tiene)</span></label><input id="ct-i2" inputmode="numeric" data-digits="15" value="${esc(k.imei2||'')}" placeholder="15 dígitos"></div>
      <div class="field"><label for="ct-mod">Equipo</label><input id="ct-mod" value="${esc(k.modelo||it.name||'')}"></div>
      <div class="field"><label for="ct-col">Color</label><input id="ct-col" value="${esc(k.color||it.color||'')}"></div>
      <div class="field"><label for="ct-cap">Almacenamiento</label><input id="ct-cap" value="${esc(k.capacidad||it.storage||'')}"></div>
      <div class="field"><label for="ct-bat">Batería (%)</label><input id="ct-bat" inputmode="numeric" data-digits="3" value="${esc(k.bateria||pr.bat||'')}"></div>
      <div class="field"><label for="ct-pz">Piezas cambiadas <span class="muted">(opcional)</span></label><input id="ct-pz" value="${esc(k.piezas||'')}" placeholder="Ej. pantalla"></div>
      <div class="err" id="ct-err" style="grid-column:1/-1"></div>
    </form>`, `<button class="btn" data-act="close">Cancelar</button><button class="btn buy" data-act="contratook">Guardar e imprimir</button>`);
}
function contratoHTML(c, k){
  const t = ST(c.store), u = U(c.userId) || {}, o = O(c.orderId) || {};
  const f = d => d ? new Date(d).toLocaleDateString('es-VE',{day:'2-digit',month:'2-digit',year:'numeric'}) : '__________';
  const hoy = f(new Date()), last = c.cuotas.length ? f(c.cuotas[c.cuotas.length-1].due) : '__________';
  const cuota = c.cuotas[0]?.amount ?? r2(c.financed/c.n), linea = '<span class="ln"></span>';
  return `<div class="contrato">
    <h2>CONTRATO PRIVADO DE COMPRAVENTA POR FINANCIAMIENTO</h2>
    <p>Contrato privado de compraventa por financiamiento que celebran, por una parte, <b>${esc(t.rep||'__________')}</b>, titular de la cédula de identidad N.° <b>${esc(t.repCed||'__________')}</b>, en nombre de <b>${esc(t.name)}</b>${t.rif?` (RIF ${esc(t.rif)})`:''}, a quien se denominará <b>“LA PARTE VENDEDORA”</b>; y por la otra, <b>${esc(u.name||'')}</b>, titular de la cédula de identidad N.° <b>${esc(u.cedula||'')}</b>, teléfono ${esc(u.phone||'')}, a quien se denominará <b>“LA PARTE COMPRADORA”</b>; quienes se sujetan a las siguientes declaraciones y cláusulas.</p>
    <h3>DECLARACIONES</h3>
    <p><b>I.</b> Declara “LA PARTE VENDEDORA”, bajo protesta de decir la verdad:</p>
    <p><b>a)</b> Ser legítimo dueño del equipo <b>${esc(k.modelo)}</b>, el cual se financia por un precio de <b>${usd(c.base)}</b> en fecha ${hoy}, siendo este un equipo 100% legal y verificado, con las siguientes especificaciones:</p>
    <ul class="spec"><li>Color del equipo: <b>${esc(k.color||'')}</b></li><li>Almacenamiento: <b>${esc(k.capacidad||'')}</b></li><li>Batería: <b>${k.bateria?esc(k.bateria)+'%':''}</b></li><li>IMEI 1: <b>${esc(k.imei1)}</b></li><li>IMEI 2: <b>${esc(k.imei2||'—')}</b></li></ul>
    <p><b>b)</b> Que el equipo se otorga a “LA PARTE COMPRADORA” el día ${hoy}, quien entrega una inicial de <b>${usd(c.down)}</b> y queda restando <b>${usd(c.financed)}</b>, pagaderos en <b>${c.n} cuotas ${c.freq} de ${usd(cuota)}</b>${c.cuotas.length>1&&c.cuotas[c.cuotas.length-1].amount!==cuota?` (la última de ${usd(c.cuotas[c.cuotas.length-1].amount)})`:''}, por pago móvil, transferencia, USDT (Binance) o efectivo, siendo la fecha límite de pago el día <b>${last}</b>, según el siguiente cronograma:</p>
    <table class="crono"><tr>${c.cuotas.map(q=>`<td><b>Cuota ${q.n}</b><br>${f(q.due)}<br>${usd(q.amount)}</td>`).join('')}</tr></table>
    <p><b>c)</b> Que “LA PARTE COMPRADORA” y “LA PARTE VENDEDORA” se encuentran de acuerdo para la celebración del presente contrato, conforme al artículo 1.159 del Código Civil venezolano.</p>
    <h3>CLÁUSULAS</h3>
    <p><b>PRIMERA.</b> “LA PARTE VENDEDORA” vende a “LA PARTE COMPRADORA”, quien adquiere para sí el equipo descrito en la declaración I, inciso a), el cual será entregado a “LA PARTE COMPRADORA” y seguirá siendo propiedad de “LA PARTE VENDEDORA” hasta que se completen todos los pagos. “LA PARTE COMPRADORA” deberá cumplir con su financiamiento hasta la fecha acordada; al tener más de tres (3) cuotas vencidas sin pagar, el equipo será devuelto a “LA PARTE VENDEDORA” y “LA PARTE COMPRADORA” perderá todo dominio sobre él.</p>
    <p><b>SEGUNDA.</b> Si “LA PARTE COMPRADORA” se retrasa en el pago de alguna de sus cuotas, a dicha cuota se le sumarán <b>${usd(S.cfg.mora)}</b> por mora.</p>
    <p><b>TERCERA. Garantía.</b> El equipo tiene una garantía de ${esc(t.garCubre.charAt(0).toLowerCase()+t.garCubre.slice(1))} No se aceptan como garantía: ${esc(t.garExcluye.charAt(0).toLowerCase()+t.garExcluye.slice(1))}</p>
    <h3>REVISIÓN DEL EQUIPO ANTES DE SU ENTREGA</h3>
    <table class="rev">${['Pantalla','Cornetas','Face ID','Pin de carga','Botones','Liberación'].map(x=>`<tr><td>${x}:</td><td>${linea}</td></tr>`).join('')}<tr><td>Piezas cambiadas:</td><td>${k.piezas?esc(k.piezas):linea}</td></tr></table>
    <p class="muted-p">Crédito ${c.code} · Pedido ${esc(o.code||'')} · ${hoy}</p>
    <div class="firmas"><div><span class="ln"></span><b>FIRMA DE LA PARTE COMPRADORA</b><br>C.I.: ${esc(u.cedula||'')}</div><div><span class="ln"></span><b>FIRMA DE LA PARTE VENDEDORA</b><br>C.I.: ${esc(t.repCed||'')}</div></div>
  </div>`;
}
function imprimirContrato(c, k){
  let el = $('#print'); if(!el){ el = document.createElement('div'); el.id = 'print'; document.body.appendChild(el); }
  el.innerHTML = contratoHTML(c, k);
  modal(`Contrato ${c.code}`, `<div class="contrato-prev">${contratoHTML(c, k)}</div>`, `<button class="btn" data-act="close">Cerrar</button><button class="btn buy" data-act="contratoprint">Imprimir</button>`, true);
}
// enlace de WhatsApp con el recordatorio de una cuota, listo para enviar
function cuotaWa(c, q){
  const u = U(c.userId); if(!u || !u.phone) return '';
  const late = q.due < dayStart(S.today), t = ST(c.store);
  const msg = `Hola ${u.name.split(' ')[0]}, te escribimos de ${t.name}. `
    + (late ? `Tu cuota ${q.n} de ${c.n} (crédito ${c.code}) venció el ${fd(q.due)}${q.mora?` y ya tiene ${usd(q.mora)} de mora`:''}. El monto a pagar es ${usd(cuotaDue(q))}.`
            : `Te recordamos que tu cuota ${q.n} de ${c.n} (crédito ${c.code}) por ${usd(cuotaDue(q))} vence el ${fd(q.due)}. Págala antes de esa fecha para evitar el cargo de ${usd(S.cfg.mora)} por mora.`)
    + (t.tasa ? ` En bolívares (pago móvil o transferencia) son ${bs(bsPrice(cuotaDue(q), c.store))} a la tasa de hoy.` : '')
    + ` Puedes pagarla y subir el comprobante desde tu cuenta en ${location.host || 'la página'}. ¡Gracias!`;
  return `<a class="btn sm" href="https://wa.me/${waNum(u.phone)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ico('chat')} Recordar</a>`;
}
function aVentas(){
  const f = S.admF.ven || 'todas';
  const sales = S.orders.filter(inAdm).filter(o=>VENDIDO.includes(o.st));
  const months = Array.from({length:6},(_,i)=>addMonths(new Date(S.today.getFullYear(),S.today.getMonth(),1),i-5));
  const inMonth = (o,m) => o.created.getFullYear()===m.getFullYear() && o.created.getMonth()===m.getMonth();
  const rows = months.map(m=>{ const ms = sales.filter(o=>inMonth(o,m)); const c = ms.filter(o=>o.mode==='contado'), fz = ms.filter(o=>o.mode==='financiado');
    return {m, nc:c.length, nf:fz.length, vc:r2(sum(c,o=>o.total)), vf:r2(sum(fz,o=>o.total))}; });
  const cur = rows[5], prev = rows[4], tot = cur.nc+cur.nf;
  const pct = tot ? Math.round(cur.nf*100/tot) : 0;
  const diff = (a,b) => b ? `${a>=b?'+':''}${Math.round((a-b)*100/b)}% vs. mes anterior` : 'sin ventas el mes anterior';
  // gráfico de barras agrupadas (cantidad de ventas)
  const W=640,H=230,L=40,B=30,gw=(W-L-10)/6,bw=Math.min(30,gw/2-6);
  const mx = Math.max(4,...rows.map(r=>Math.max(r.nc,r.nf))); const top = Math.ceil(mx/4)*4;
  const yv = v => H-B-(H-B-16)*v/top;
  const grid = [0,.5,1].map(t=>`<line x1="${L}" x2="${W-10}" y1="${yv(top*t)}" y2="${yv(top*t)}" stroke="#E3E2DF"/><text x="${L-8}" y="${yv(top*t)+4}" text-anchor="end" font-size="11" fill="#6A6A6A">${top*t}</text>`).join('');
  const bars = rows.map((r,i)=>{ const cx = L+gw*i+gw/2;
    const b1 = `<rect x="${cx-bw-2}" y="${yv(r.nc)}" width="${bw}" height="${H-B-yv(r.nc)}" rx="3" fill="#3A3A3A"/>${r.nc?`<text x="${cx-bw/2-2}" y="${yv(r.nc)-5}" text-anchor="middle" font-size="11" fill="#151515">${r.nc}</text>`:''}`;
    const b2 = `<rect x="${cx+2}" y="${yv(r.nf)}" width="${bw}" height="${H-B-yv(r.nf)}" rx="3" fill="#C9A227"/>${r.nf?`<text x="${cx+bw/2+2}" y="${yv(r.nf)-5}" text-anchor="middle" font-size="11" fill="#151515">${r.nf}</text>`:''}`;
    return b1+b2+`<text x="${cx}" y="${H-10}" text-anchor="middle" font-size="12" fill="#6A6A6A">${r.m.toLocaleDateString('es-VE',{month:'short'})}</text>`; }).join('');
  const list = sales.filter(o=>f==='todas'||o.mode===f);
  if(!admCuo()){
    const cb = rows.map((r,i)=>{ const cx = L+gw*i+gw/2, w = Math.min(44, gw-16);
      return `<rect x="${cx-w/2}" y="${yv(r.nc)}" width="${w}" height="${H-B-yv(r.nc)}" rx="3" fill="#C9A227"/>${r.nc?`<text x="${cx}" y="${yv(r.nc)-5}" text-anchor="middle" font-size="11" fill="#151515">${r.nc}</text>`:''}<text x="${cx}" y="${H-10}" text-anchor="middle" font-size="12" fill="#6A6A6A">${r.m.toLocaleDateString('es-VE',{month:'short'})}</text>`; }).join('');
    return `<h1>Ventas</h1>
    <p class="muted small">Cuenta como venta todo pedido con pago verificado (en preparación, enviado o entregado), según la fecha del pedido.</p>
    <div class="kpis">
      <div class="kpi"><div class="l">Ventas este mes</div><div class="v num">${cur.nc}</div><div class="muted small">${diff(cur.nc,prev.nc)}</div></div>
      <div class="kpi"><div class="l">Total vendido este mes</div><div class="v num">${usd(cur.vc)}</div><div class="muted small">${diff(cur.vc,prev.vc)}</div></div>
      <div class="kpi"><div class="l">Venta promedio</div><div class="v num">${usd(cur.nc?r2(cur.vc/cur.nc):0)}</div><div class="muted small">por pedido este mes</div></div>
      <div class="kpi"><div class="l">Vendido en 6 meses</div><div class="v num">${usd(r2(sum(rows,r=>r.vc)))}</div><div class="muted small">${sum(rows,r=>r.nc)} venta${sum(rows,r=>r.nc)===1?'':'s'}</div></div>
    </div>
    <div class="chart"><h3 style="margin-bottom:8px">Ventas por mes</h3><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventas por mes">${grid}${cb}</svg></div>
    <div class="tbl"><table class="t"><thead><tr><th>Mes</th><th class="r">Ventas</th><th class="r">Total</th></tr></thead><tbody>
      ${rows.slice().reverse().map(r=>`<tr><td>${r.m.toLocaleDateString('es-VE',{month:'long',year:'numeric'})}</td><td class="r num">${r.nc}</td><td class="r num"><b>${usd(r.vc)}</b></td></tr>`).join('')}
    </tbody></table></div>
    <h2>Detalle de ventas</h2>
    ${sales.length?`<div class="tbl"><table class="t"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Método de pago</th><th>Estado</th><th class="r">Total</th></tr></thead><tbody>
    ${sales.map(o=>`<tr><td class="nw">${o.code}</td><td class="nw">${fd(o.created)}</td><td>${esc(U(o.userId)?.name||'')}</td><td>${o.items.map(i=>`${i.qty} × ${esc(i.name)}${i.storage?' '+esc(i.storage):''}`).join('<br>')}</td>
      <td>${metN(o.method)}</td><td>${tag(o.status)}</td><td class="r num nw">${usd(o.total)}</td></tr>`).join('')}
    </tbody></table></div>`:'<div class="empty">Todavía no hay ventas.</div>'}`;
  }
  return `<h1>Ventas</h1>
    <p class="muted small">Cuenta como venta todo pedido con pago verificado o crédito aprobado (en preparación, enviado o entregado), según la fecha del pedido.</p>
    <div class="kpis">
      <div class="kpi"><div class="l">Ventas de contado este mes</div><div class="v num">${cur.nc}</div><div class="muted small">${usd(cur.vc)} · ${diff(cur.nc,prev.nc)}</div></div>
      <div class="kpi"><div class="l">Ventas financiadas este mes</div><div class="v num">${cur.nf}</div><div class="muted small">${usd(cur.vf)} · ${diff(cur.nf,prev.nf)}</div></div>
      <div class="kpi"><div class="l">Total vendido este mes</div><div class="v num">${usd(cur.vc+cur.vf)}</div><div class="muted small">${tot} venta${tot===1?'':'s'}</div></div>
      <div class="kpi"><div class="l">% financiado este mes</div><div class="v num">${pct}%</div><div class="muted small">de las ventas del mes</div></div>
    </div>
    <div class="chart"><div class="row between" style="margin-bottom:8px"><h3>Ventas por mes</h3><span class="legend"><i style="background:#3A3A3A"></i>Contado <i style="background:#C9A227"></i>Financiado</span></div>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventas de contado y financiadas por mes">${grid}${bars}</svg></div>
    <div class="tbl"><table class="t"><thead><tr><th>Mes</th><th class="r">Contado</th><th class="r">Monto contado</th><th class="r">Financiadas</th><th class="r">Monto financiado</th><th class="r">Total</th><th class="r">% financiado</th></tr></thead><tbody>
      ${rows.slice().reverse().map(r=>{const t=r.nc+r.nf;return `<tr><td>${r.m.toLocaleDateString('es-VE',{month:'long',year:'numeric'})}</td><td class="r num">${r.nc}</td><td class="r num">${usd(r.vc)}</td><td class="r num">${r.nf}</td><td class="r num">${usd(r.vf)}</td><td class="r num"><b>${usd(r.vc+r.vf)}</b></td><td class="r num">${t?Math.round(r.nf*100/t):0}%</td></tr>`}).join('')}
    </tbody></table></div>
    <h2>Detalle de ventas</h2>
    <div class="chips">${[['todas','Todas'],['contado','De contado'],['financiado','Financiadas']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="ven" data-v="${k}" aria-pressed="${f===k}">${l} <span class="num">(${k==='todas'?sales.length:sales.filter(o=>o.mode===k).length})</span></button>`).join('')}</div>
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Forma de pago</th><th>Estado</th><th class="r">Total</th></tr></thead><tbody>
    ${list.map(o=>{const c=o.creditId?C(o.creditId):null;return `<tr><td class="nw">${o.code}</td><td class="nw">${fd(o.created)}</td><td>${esc(U(o.userId)?.name||'')}</td><td>${o.items.map(i=>`${i.qty} × ${esc(i.name)}${i.storage?' '+esc(i.storage):''}`).join('<br>')}</td>
      <td>${o.mode==='financiado'?`<span class="tag warn">Financiada</span><div class="muted small">${c?`${c.code} · ${c.n} cuotas ${c.freq}`:''}</div>`:`<span class="tag dark">Contado</span><div class="muted small">${metN(o.method)}</div>`}</td><td>${tag(o.status)}</td><td class="r num nw">${usd(o.total)}</td></tr>`}).join('')}
    </tbody></table></div>`:'<div class="empty">Todavía no hay ventas en este filtro.</div>'}`;
}
function aPedidos(){
  const f = S.admF.ped;
  const groups = {activos:['pendiente_pago','pago_en_revision','credito_en_evaluacion','pago_rechazado','preparando','listo_retiro','enviado'], despacho:['preparando','listo_retiro'], todos:null};
  const list = S.orders.filter(inAdm).filter(o=>!groups[f]||groups[f].includes(o.st));
  return `<h1>Pedidos y envíos</h1>
    <div class="chips">${[['activos','En curso'],['despacho','Por despachar'],['todos','Todos']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="ped" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</div>
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Entrega</th><th>Estado</th><th class="r">Total</th><th></th></tr></thead><tbody>
    ${list.map(o=>`<tr><td class="nw">${o.code}${stCol(o.store)}${admCuo()?`<div>${o.mode==='financiado'?'<span class="tag warn">Financiada</span>':'<span class="tag dark">Contado</span>'}</div>`:''}</td><td class="nw">${fd(o.created)}</td><td>${esc(U(o.userId)?.name||'')}<div class="muted small">${esc(U(o.userId)?.phone||'')}</div></td>
      <td>${o.items.map(i=>`${i.qty} × ${esc(i.name)}${i.storage?' '+esc(i.storage):''}${i.color?` <span class="muted small">(${esc(i.color)})</span>`:''}`).join('<br>')}</td>
      <td>${esc(S.cfg.envio[o.ship.method]?.n||o.ship.method)}${o.ship.city?`<div class="muted small">${esc(o.ship.addr)}, ${esc(o.ship.city)}</div>`:''}${o.tracking?`<div class="muted small">${esc(o.courier||'')} · ${o.courier==='Delivery propio'?'lo lleva':'guía'} ${esc(o.tracking)}</div>`:''}</td>
      <td>${tag(o.status)}${o.st==='pendiente_pago'?`<div class="muted small">Vence ${fdt(o.deadline)}</div>`:''}${o.method==='efectivo'?'<div class="muted small">Paga en efectivo</div>':''}</td><td class="r num nw">${usd(o.total)}</td>
      <td class="nw">${['pendiente_pago','pago_rechazado'].includes(o.st)?`<button class="btn sm" data-act="cajaorder" data-o="${o.id}">Registrar efectivo</button>`:''}${o.st==='preparando'?`<button class="btn brand sm" data-act="ship" data-o="${o.id}">Despachar</button>`:''}
        ${['enviado','listo_retiro'].includes(o.st)?`<button class="btn sm" data-act="deliver" data-o="${o.id}">Marcar entregado</button>`:''}</td></tr>`).join('')}
    </tbody></table></div>`:'<div class="empty">No hay pedidos en este filtro.</div>'}`;
}
function aInventario(){
  const live = ['pendiente_pago','pago_en_revision','credito_en_evaluacion','pago_rechazado'], done = ['preparando','listo_retiro','enviado','entregado'];
  const qty = (pid, sts) => sum(S.orders.filter(o=>sts.includes(o.st)).flatMap(o=>o.items).filter(i=>i.pid===pid),i=>i.qty);
  const list = S.products.filter(inAdm);
  return `<div class="row between"><h1>Inventario</h1><button class="btn buy sm" data-act="prodnew">+ Nuevo producto</button></div>
    <p class="muted small">El stock se descuenta al crear el pedido (reserva) y se devuelve si el pedido se cancela${admCuo()?' o el crédito no se aprueba':''}. ${admCuo()?'Pulsa la forma de pago para cambiarla entre “contado o cuotas” y “solo contado”, o “Editar”':'Pulsa “Editar”'} para cambiar precio, foto y datos.</p>
    <div class="tbl"><table class="t"><thead><tr><th>Producto</th><th>Categoría</th><th class="r">Precio</th><th class="r">Disponible</th><th class="r">Reservado</th><th class="r">Vendido</th>${admCuo()?'<th>Forma de pago</th>':''}<th>Estado</th><th>Ajustar</th></tr></thead><tbody>
    ${list.map(p=>`<tr><td><div class="row" style="gap:10px;flex-wrap:nowrap"><div class="th" style="width:44px;height:44px;flex:none">${img(p)}</div><div><b>${esc(p.name)}</b><div class="muted small">Código ${String(p.id).padStart(4,'0')} · ${esc(condTxt(p))}${p.active?'':' · oculto en la tienda'}</div>${stCol(p.store)}</div></div></td><td>${esc(p.cat)}</td><td class="r num">${usd(p.price)}</td><td class="r num"><b>${p.stock}</b></td><td class="r num">${qty(p.id,live)}</td><td class="r num">${qty(p.id,done)}</td>
      ${!admCuo()?'':`<td class="nw">${ST(p.store).cuotas?`<button class="btn sm ${p.fin?'':'brand'}" data-act="finswitch" data-id="${p.id}" data-v="${p.fin?0:1}" title="Cambiar">${p.fin?'Contado o cuotas':'Solo contado'}</button>${p.fin?`<div class="muted small" style="margin-top:4px">Inicial ${Math.round(pIni(p)*100)}% · ${pOpts(p).map(o=>`${o.n} ${o.f==='semanal'?'sem.':'quinc.'}`).join(' / ')||'sin cuotas'}</div>`:''}`:'<span class="tag dark">Solo contado</span>'}</td>`}
      <td>${p.stock<=0?'<span class="tag bad">Agotado</span>':p.stock<=5?'<span class="tag warn">Stock bajo</span>':'<span class="tag ok">Normal</span>'}</td>
      <td class="nw"><button class="btn sm" data-act="stock" data-id="${p.id}" data-d="-1" aria-label="Restar uno">−1</button> <button class="btn sm" data-act="stock" data-id="${p.id}" data-d="1" aria-label="Sumar uno">+1</button> <button class="btn sm" data-act="stock" data-id="${p.id}" data-d="5" aria-label="Sumar cinco">+5</button> <button class="btn sm brand" data-act="prodedit" data-id="${p.id}">Editar</button></td></tr>`).join('') || '<tr><td colspan="9" class="muted">Todavía no hay productos. Pulsa “Nuevo producto”.</td></tr>'}
    </tbody></table></div>`;
}
const COLORES = {negro:'#25272D', blanco:'#ECEDEF', gris:'#6B7280', plata:'#C5C9D1', dorado:'#C9A227', oro:'#C9A227', azul:'#2F4F9A', rojo:'#B5403A', verde:'#3F7D5C', morado:'#7A5BB0', lila:'#9C8AC7', rosado:'#E7A1B0', rosa:'#E7A1B0', titanio:'#8D8A84', grafito:'#2B2D34', amarillo:'#E3C443', naranja:'#E07A2F', crema:'#E8DCC2', arena:'#CDBA9A'};
function productModal(id){
  const p = id ? P(id) : null; M = {type:'prod', id: id||null, img: p?.img||'', file:null};
  const specTxt = p ? Object.entries(p.specs).map(([k,v])=>`${k}: ${v}`).join('\n') : 'Pantalla: \nCámara principal: \nBatería: \nAlmacenamiento: ';
  const capTxt = p?.storages ? p.storages.map(s=>`${s.n}${+s.d?' +'+s.d:''}`).join(', ') : '';
  modal(p ? `Editar ${esc(p.name)}` : 'Nuevo producto', `
    <form id="prodf" class="fg" novalidate>
      ${isGenAdmin() && !p ? `<div class="field" style="grid-column:1/-1"><label for="pf-st">Tienda</label><select id="pf-st">${S.stores.map(t=>`<option value="${t.id}" ${(S.admStore||S.stores[0].id)===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>` : ''}
      <div class="field"><label for="pf-nom">Nombre</label><input id="pf-nom" value="${esc(p?.name||'')}" placeholder="Ej. iPhone 16 Pro Max"></div>
      <div class="field"><label for="pf-mar">Marca</label><input id="pf-mar" value="${esc(p?.brand||'')}" placeholder="Ej. Apple"></div>
      <div class="field"><label for="pf-cat">Categoría</label><select id="pf-cat">${CATS.map(c=>`<option ${p?.cat===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="pf-pre">Precio (USD)</label><input id="pf-pre" inputmode="decimal" value="${p?p.price:''}"></div>
      ${p?'':`<div class="field"><label for="pf-stk">Unidades disponibles</label><input id="pf-stk" inputmode="numeric" data-digits="4" value="1"></div>`}
      <div class="field"><label for="pf-cond">Condición</label><select id="pf-cond">${Object.entries(CONDS).filter(([k])=>k!=='usado'||p?.cond==='usado').map(([k,v])=>`<option value="${k}" ${(p?.cond||'nuevo')===k?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="pf-gama">Gama</label><select id="pf-gama">${Object.entries(GAMAS).map(([k,v])=>`<option value="${k}" ${(p?.gama||'media')===k?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="pf-bat">Batería (%) <span class="muted">(opcional)</span></label><input id="pf-bat" inputmode="numeric" data-digits="3" value="${p?.bat??''}" placeholder="Ej. 90"></div>
      <div class="field"><label for="pf-acc">Precio extra con accesorios (USD) <span class="muted">(opcional)</span></label><input id="pf-acc" inputmode="decimal" value="${p?.acc??''}" placeholder="Vacío = no se ofrece"><span class="hint">Si lo llenas, el cliente elige con o sin accesorios.</span></div>
      <div class="field"><label for="pf-accd">Qué accesorios incluye</label><input id="pf-accd" value="${esc(p?.accDesc||'')}" placeholder="Ej. Cargador, forro y vidrio templado"></div>
      <div class="field" hidden><label for="pf-gar">Garantía</label><input id="pf-gar" inputmode="numeric" data-digits="2" value="${p?.gar??''}" placeholder="Ej. 2"></div>
      <div class="field"><label for="pf-col">Colores <span class="muted">(separados por coma)</span></label><input id="pf-col" value="${esc(p?p.colors.map(c=>c.n).join(', '):'')}" placeholder="Ej. Negro, Titanio, Blanco"></div>
      <div class="field" style="grid-column:1/-1"><label for="pf-cap">Capacidades <span class="muted">(opcional; precio extra con +)</span></label><input id="pf-cap" value="${esc(capTxt)}" placeholder="Ej. 256 GB, 512 GB +150"></div>
      <div class="field" style="grid-column:1/-1"><label for="pf-spe">Especificaciones <span class="muted">(una por línea: nombre: valor)</span></label><textarea id="pf-spe" rows="4">${esc(specTxt)}</textarea></div>
      <div class="field" style="grid-column:1/-1"><label for="pf-des">Descripción</label><textarea id="pf-des" rows="2">${esc(p?.desc||'')}</textarea></div>
      <div class="field" style="grid-column:1/-1"><label for="pf-img">Foto del producto <span class="muted">(fondo blanco o liso)</span></label>
        <div class="row" style="flex-wrap:nowrap;align-items:center"><div class="th" id="pf-prev" style="width:64px;height:64px;flex:none">${p?img(p):''}</div>${fileBtn('pf-img', 'image/*', 'data-on="prodimg"', p&&p.img?'Cambiar foto':'Elegir foto')}</div></div>
      ${ST(p?p.store:(myStore()??S.admStore??S.stores[0]?.id)).cuotas?`<label class="ck small"><input type="checkbox" id="pf-fin" ${!p||p.fin?'checked':''}>Se puede pagar en cuotas</label>
      <div class="field"><label for="pf-ini">Inicial mínima de este equipo (%)</label><input id="pf-ini" inputmode="numeric" data-digits="2" value="${p&&p.ini!=null?Math.round(p.ini*100):''}" placeholder="${Math.round(S.cfg.inicialMin*100)} (general)"><span class="hint">Déjalo vacío para usar la inicial general (${Math.round(S.cfg.inicialMin*100)}%).</span></div>
      ${[['pf-cs','Cuotas semanales', p?p.cs:8, 52],['pf-cq','Cuotas quincenales', p?p.cq:4, 26]].map(([id,l,cur,mx])=>`<div class="field"><label for="${id}">${l}</label><input id="${id}" inputmode="numeric" data-digits="2" value="${cur??''}" placeholder="Vacío = no permitir"><span class="hint">De 1 a ${mx} cuotas.</span></div>`).join('')}
      <p class="hint" style="grid-column:1/-1;margin-top:-6px">Escribe en cuántas cuotas se paga este equipo. Si llenas las dos, el cliente elige al pagar; deja vacía la que no quieras ofrecer.</p>
      <div class="note small" id="pf-sim" style="grid-column:1/-1"></div>`:''}
      <label class="ck small"><input type="checkbox" id="pf-act" ${!p||p.active?'checked':''}>Visible en la tienda</label>
      <div class="err" id="pf-err" style="grid-column:1/-1"></div>
    </form>`, `<button class="btn" data-act="close">Cancelar</button><button class="btn buy" data-act="prodsave">${p?'Guardar cambios':'Crear producto'}</button>`, true);
  prodSim();
}
// ejemplo de cuánto pagaría el cliente con la inicial y los planes marcados
function prodSim(){
  const el = $('#pf-sim'); if(!el) return;
  const precio = parseAmt($('#pf-pre').value), iv = $('#pf-ini').value.trim(), ini = iv==='' ? S.cfg.inicialMin : (+iv)/100;
  const os = [['semanales', $('#pf-cs')?.value], ['quincenales', $('#pf-cq')?.value]].filter(([,v])=>+v>0).map(([f,v])=>({f, n:+v}));
  if(!(precio>0) || !$('#pf-fin').checked || !os.length){ el.hidden = true; return; } el.hidden = false;
  const down = r2(precio*ini);
  el.innerHTML = `<b>El cliente pagará:</b> inicial de ${usd(down)} (${Math.round(ini*100)}%) y ` + os.map(o=>`${o.n} cuotas ${o.f} de ${usd(finCuota(precio, o.n, ini))}`).join(' o ') + '.';
}
async function uploadPublic(blob, folder){
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.jpg`;
  const {error} = await sb.storage.from('productos').upload(path, blob, {contentType:'image/jpeg', upsert:false});
  if(error) throw new Error('No se pudo subir la imagen: ' + error.message);
  return sb.storage.from('productos').getPublicUrl(path).data.publicUrl;
}
async function saveProduct(){
  const err = $('#pf-err'); err.textContent = '';
  const nombre = $('#pf-nom').value.trim(), precio = parseAmt($('#pf-pre').value);
  if(nombre.length<2){ err.textContent = 'Escribe el nombre del producto.'; return; }
  if(!(precio>=0) || $('#pf-pre').value.trim()===''){ err.textContent = 'Escribe un precio válido.'; return; }
  const colores = $('#pf-col').value.split(',').map(x=>x.trim()).filter(Boolean).map(n=>({n, hex: COLORES[n.toLowerCase().split(' ')[0]] || '#777777'}));
  const capacidades = $('#pf-cap').value.split(',').map(x=>x.trim()).filter(Boolean).map(x=>{ const m = x.match(/^(.*?)\s*\+\s*([\d.,]+)$/); return m ? {n:m[1].trim(), d:parseAmt(m[2])} : {n:x, d:0}; });
  const specs = {}; $('#pf-spe').value.split('\n').forEach(l=>{ const i = l.indexOf(':'); if(i>0){ const k = l.slice(0,i).trim(), v = l.slice(i+1).trim(); if(k && v) specs[k] = v; } });
  let imagen = M.img;
  if(M.file) imagen = await uploadPublic(await compressImg(M.file, 1200), 'p');
  const body = {id:M.id, tienda_id: $('#pf-st') ? +$('#pf-st').value : null, nombre, marca:$('#pf-mar').value.trim(), categoria:$('#pf-cat').value, precio,
    stock: $('#pf-stk') ? +($('#pf-stk').value||0) : undefined, colores: colores.length ? colores : [{n:'Único', hex:'#777777'}], capacidades, specs,
    descripcion:$('#pf-des').value.trim(), imagen_url:imagen, financiable:$('#pf-fin')?$('#pf-fin').checked:false, activo:$('#pf-act').checked};
  const bat = $('#pf-bat').value.trim(), gar = $('#pf-gar').value.trim();
  if(bat && !(+bat>=1 && +bat<=100)){ err.textContent = 'La batería debe estar entre 1 y 100%.'; return; }
  const accv = $('#pf-acc').value.trim();
  if(accv && !(parseAmt(accv)>0)){ err.textContent = 'El precio extra de los accesorios debe ser mayor a 0.'; return; }
  const equipo = {condicion:$('#pf-cond').value, gama:$('#pf-gama').value, bateria:bat, garantia_meses:'', accesorios_extra: accv ? String(parseAmt(accv)) : '', accesorios_desc:$('#pf-accd').value.trim()};
  if($('#pf-cs')){ const vs = $('#pf-cs').value.trim(), vq = $('#pf-cq').value.trim();
    if(vs && !(/^\d+$/.test(vs) && +vs>=1 && +vs<=52)){ err.textContent = 'Las cuotas semanales deben ser un número de 1 a 52.'; return; }
    if(vq && !(/^\d+$/.test(vq) && +vq>=1 && +vq<=26)){ err.textContent = 'Las cuotas quincenales deben ser un número de 1 a 26.'; return; }
    equipo.cuotas_semanal = vs; equipo.cuotas_quincenal = vq;
    if($('#pf-fin').checked && !equipo.cuotas_semanal && !equipo.cuotas_quincenal){ err.textContent = 'Permite cuotas semanales, quincenales o ambas, o desmarca “Se puede pagar en cuotas”.'; return; } }
  let finIni = null, finPlans = null;
  if($('#pf-ini')){
    const iv = $('#pf-ini').value.trim();
    if(iv!==''){ const v = +iv; if(!(v>=0 && v<=Math.round(S.cfg.inicialMax*100))){ err.textContent = `La inicial debe estar entre 0% y ${Math.round(S.cfg.inicialMax*100)}%.`; return; } finIni = r2(v/100); }
    finPlans = null;
  }
  try{ const pid = await rpc('guardar_producto', {p: body});
    if($('#pf-ini')) await rpc('ajustar_financiamiento', {pid: M.id || pid, p_inicial: finIni, p_planes: finPlans});
    await rpc('ajustar_equipo', {pid: M.id || pid, p: equipo});
    closeModal(); await refresh(); toast(M.id ? 'Producto actualizado.' : 'Producto creado.'); }
  catch(e){ err.textContent = friendly(e); }
}
function aConfig(){
  const c = S.cfg;
  const sid = myStore() ?? (S.cfgStore || S.admStore || S.stores[0]?.id), t = ST(sid), d = t.pay || {};
  const fr = [0,1].map(i=>t.frases[i] || {k:t.name, t:'', p:''});
  return `<h1>Configuración</h1>
  <section class="box"><div class="row between"><h2>Datos de ${esc(t.name)}</h2>${isGenAdmin()?`<select data-on="cfgstore" aria-label="Tienda">${S.stores.map(x=>`<option value="${x.id}" ${x.id===sid?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`:''}</div>
    <form id="tiendaf" class="field" style="gap:16px" data-id="${sid}">
    <div class="row" style="align-items:center;gap:14px"><div id="tf-logo">${storeMark(t,64)}</div><label class="btn sm">Cambiar logo<input type="file" accept="image/*" data-on="logoimg" hidden></label><span class="muted small">PNG con fondo transparente o cuadrado. Se ve en la cabecera, el catálogo y el pie.</span></div>
    <div class="fg">
      <div class="field"><label for="tf-nom">Nombre de la tienda</label><input id="tf-nom" value="${esc(t.name)}"></div>
      <div class="field"><label for="tf-esl">Eslogan</label><input id="tf-esl" value="${esc(t.slogan)}" maxlength="120"></div>
      <div class="field"><label for="tf-wa">WhatsApp <span class="muted">(con código de país, ej. 584141234567)</span></label><input id="tf-wa" inputmode="numeric" data-digits="15" value="${esc(t.whatsapp)}"></div>
      <div class="field"><label for="tf-cor">Correo</label><input id="tf-cor" type="email" value="${esc(t.correo)}"></div>
      <div class="field"><label for="tf-rif">RIF</label><input id="tf-rif" value="${esc(t.rif)}" placeholder="J-12345678-9"></div>
      <div class="field"><label for="tf-rep">Representante (firma los contratos)</label><input id="tf-rep" value="${esc(t.rep)}" placeholder="Nombre y apellido"></div>
      <div class="field"><label for="tf-repc">Cédula del representante</label><input id="tf-repc" value="${esc(t.repCed)}" placeholder="V-12345678"></div>
      <div class="field" style="grid-column:1/-1"><label for="tf-gc">Garantía: qué cubre <span class="muted">(es la misma para las dos tiendas)</span></label><input id="tf-gc" value="${esc(t.garCubre)}"></div>
      <div class="field" style="grid-column:1/-1"><label for="tf-ge">Garantía: qué no cubre</label><input id="tf-ge" value="${esc(t.garExcluye)}"></div>
      <div class="field"><label for="tf-hor">Horario de atención</label><input id="tf-hor" value="${esc(t.horario)}" placeholder="Lunes a sábado, 9:00 a 18:00"></div>
    </div>
    <h3>Frases de la portada</h3><p class="muted small" style="margin-top:-8px">Aparecen junto al teléfono animado al deslizar la página de inicio. Para resaltar en dorado escribe la palabra entre &lt;em&gt; y &lt;/em&gt;; para un salto de línea usa &lt;br&gt;.</p>
    ${fr.map((f,i)=>`<div class="fg"><div class="field"><label for="tf-ft${i}">Frase ${i+1} · título</label><input id="tf-ft${i}" value="${esc(f.t||'')}"></div><div class="field"><label for="tf-fp${i}">Frase ${i+1} · texto</label><input id="tf-fp${i}" value="${esc(f.p||'')}"></div></div>`).join('')}
    <h3>Datos para recibir pagos</h3>
    <div class="fg">${Object.entries(METODOS).map(([k,m])=>`<div class="field"><label for="c-d-${k}">${m.n}</label><input id="c-d-${k}" data-dp="${k}" value="${esc(d[k]||'')}" placeholder="${({pago_movil:'Banco · teléfono · cédula', transferencia:'Banco · cuenta · titular · cédula', usdt:'Binance ID o correo de Binance Pay', efectivo:'Ej. al recibir el equipo'})[k]||''}"></div>`).join('')}</div>
    <div class="err" id="tf-err"></div>
    <div><button class="btn brand" type="submit">Guardar datos de la tienda</button></div></form></section>
  ${tasaSection(sid)}
  ${admCuo()||isGenAdmin()?`<section class="box"><h2>Reglas de financiamiento</h2><p class="muted small">Mora, inicial mínima y opciones de cuotas de las compras en cuotas. Cada cambio queda en el historial.</p>
    <form id="cfgf" class="field" style="gap:16px">
    <div class="fg">
            <div class="field"><label for="c-mora">Cargo fijo por mora (USD)</label><input id="c-mora" inputmode="decimal" value="${c.mora}"><span class="hint">Se aplica una vez por cada cuota vencida.</span></div>
      <div class="field"><label for="c-ini">Inicial mínima (%)</label><input id="c-ini" inputmode="numeric" value="${Math.round(c.inicialMin*100)}"></div>
      <div class="field"><label for="c-min">Compra mínima financiable (USD)</label><input id="c-min" inputmode="decimal" value="${c.minFin}"></div>
      <input id="c-cupo" type="hidden" value="${c.cupoBase}">
    </div>
    <h3>Recargo según el número de cuotas (opcional)</h3>
    <p class="muted small" style="margin-top:-8px">El número de cuotas de cada equipo lo escribes en Inventario → Editar (el que quieras). Aquí puedes ponerle un recargo a un número de cuotas, por ejemplo 12 cuotas con 10%. Los números que no estén en esta lista no llevan recargo.</p>
    <div id="planes" class="planes">${allPlans().map(n=>planRow(n, r2(c.plans[n]*100))).join('')}</div>
    <div><button class="btn sm" data-act="planadd">+ Agregar recargo</button></div>
    <div class="err" id="c-err"></div>
    <div><button class="btn brand" type="submit">Guardar reglas de financiamiento</button></div></form></section>`:''}`;
}
// tasa de la tienda: cada administrador publica la suya; queda en el historial para la contabilidad
function tasaSection(sid){
  const t = ST(sid), hist = (S.tasas||[]).filter(h=>h.store===sid).slice(0,8);
  const today = t.tasaAt && dayStart(t.tasaAt).getTime()===dayStart(new Date()).getTime();
  const ej = t.tasa ? bs(r2(100*(1+t.recargoBs)*t.tasa)) : null;
  return `<section class="box" id="tasa-box"><h2>Tasa para pagos en bolívares · ${esc(t.name)}</h2>
    <p class="muted small">Es la tasa de esta tienda. No se publica como tal: se usa para calcular el monto en bolívares que ve el cliente al pagar. Cada pago guarda la tasa del momento.</p>
    ${!t.tasa?`<div class="note bad small"><b>Aún no has publicado tu tasa.</b> Mientras tanto tus clientes solo pueden pagar en dólares (USDT o efectivo).</div>`
      :!today?`<div class="note warn small">La última actualización fue el ${fd(t.tasaAt)}. Actualízala hoy para cobrar el monto correcto en bolívares.</div>`
      :`<div class="note ok small">Actualizada hoy a las ${t.tasaAt.toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit'})}.</div>`}
    <form id="tasaf" class="field" style="gap:14px" data-id="${sid}"><div class="fg">
      <div class="field"><label for="t-tasa">Tasa (Bs por cada dólar)</label><input id="t-tasa" inputmode="decimal" value="${t.tasa??''}" placeholder="Ej. 236,50"><span class="hint">Cuántos bolívares vale un dólar hoy para esta tienda.</span></div>
      <div class="field"><label for="t-rbs">Ajuste para pagos en bolívares (%)</label><input id="t-rbs" inputmode="decimal" value="${r2((t.recargoBs||0)*100)}"><span class="hint">Monto en Bs = precio en dólares + este % × tasa. Pon 0 si cobras lo mismo.</span></div>
    </div>
    ${ej?`<p class="small">Ejemplo con los valores guardados: un equipo de <b>$100</b> se paga <b class="num">${ej}</b> en bolívares.</p>`:''}
    <div class="err" id="t-err"></div>
    <div><button class="btn brand" type="submit">Publicar tasa</button></div></form>
    ${hist.length?`<h3>Últimos cambios</h3><div class="tbl"><table class="t"><thead><tr><th>Fecha</th><th class="r">Tasa</th><th class="r">Ajuste Bs</th><th>Quién</th></tr></thead><tbody>${hist.map(h=>`<tr><td class="nw">${fd(h.at)} ${h.at.toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit'})}</td><td class="r num">${bs(h.tasa)}</td><td class="r num">${r2(h.rec*100)}%</td><td>${esc(h.by)}</td></tr>`).join('')}</tbody></table></div>`:''}
  </section>`;
}
function planRow(n, pct){ return `<div class="planrow"><div class="field"><label>Cuotas</label><input data-pn inputmode="numeric" data-digits="2" value="${n??''}" placeholder="Ej. 12"></div>
  <div class="field"><label>Recargo (%)</label><input data-pr inputmode="decimal" value="${pct??''}" placeholder="Ej. 20"></div>
  <button class="btn sm danger" data-act="plandel" aria-label="Quitar plan">Quitar</button></div>`; }
function aBitacora(){
  const t = admStoreId(); const list = S.audit.filter(a=>t==null || a.store===t);
  return `<h1>Historial de cambios</h1><p class="muted small">Registro de lo que hace cada administrador: pagos aprobados o rechazados, cambios de precio, stock, configuración, etc. Sirve para saber quién hizo qué y cuándo.</p><div class="tbl"><table class="t"><thead><tr><th>Fecha</th><th>Usuario</th>${isGenAdmin()?'<th>Tienda</th>':''}<th>Acción</th></tr></thead><tbody>
    ${list.length?list.map(a=>`<tr><td class="nw">${fdt(a.at)}</td><td class="nw">${esc(a.by)}</td>${isGenAdmin()?`<td class="nw small">${a.store?esc(ST(a.store).name):'—'}</td>`:''}<td>${esc(a.msg)}</td></tr>`).join(''):'<tr><td colspan="4" class="muted">Sin eventos.</td></tr>'}</tbody></table></div>`;
}

/* ===================== cédula, teléfono y verificación ===================== */
const ESTADOS = ['Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo','Cojedes','Delta Amacuro','Distrito Capital','Falcón','Guárico','La Guaira','Lara','Mérida','Miranda','Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo','Yaracuy','Zulia'];
const OCUPACIONES = ['Empleado','Independiente o comerciante','Profesional libre','Estudiante','Jubilado o pensionado','Otro'];
const INGRESOS = [['0-100','Menos de $100'],['100-300','$100 a $300'],['300-600','$300 a $600'],['600-1000','$600 a $1.000'],['1000+','Más de $1.000']];
const VERIF = {incompleto:['Sin verificar','bad'], pendiente:['En revisión','warn'], verificado:['Verificada','ok'], rechazado:['Rechazada','bad']};
const verifTag = v => { const [l,c] = VERIF[v] || VERIF.incompleto; return `<span class="tag ${c}">${l}</span>`; };
const onlyDigits = s => String(s||'').replace(/\D/g,'');
const normTel = s => { let d = onlyDigits(s); if(/^58\d{10}$/.test(d)) d = '0'+d.slice(2); if(/^[24]\d{9}$/.test(d)) d = '0'+d; return d; };
const telOk = s => /^0\d{10}$/.test(normTel(s));
const waNum = tel => { const d = normTel(tel); return d ? '58'+d.slice(1) : ''; };
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
// fecha de nacimiento a partir de los tres selectores (o vacía si no existe, ej. 31 de febrero)
const nacOf = k => { const d = +k.nacD, m = +k.nacM, y = +k.nacY; if(!d||!m||!y) return ''; const f = new Date(y, m-1, d); if(f.getMonth()!==m-1) return '';
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; };
const edad = d => { if(!d) return null; const b = new Date(d+'T12:00:00'), t = new Date(); let a = t.getFullYear()-b.getFullYear(); if(t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
const cedField = (pre, tipo, num) => `<div class="cedrow"><select id="${pre}-tipo" data-k="${pre==='r'?'tipo':'ptipo'}" aria-label="Tipo de documento"><option ${tipo!=='E'?'selected':''}>V</option><option ${tipo==='E'?'selected':''}>E</option></select>
  <input id="${pre}-ced" data-k="${pre==='r'?'ced':'pced'}" data-digits="9" inputmode="numeric" placeholder="12345678" value="${esc(num||'')}" autocomplete="off"></div>`;

// Estado del formulario de verificación (sobrevive a los redibujados)
function kycInit(u){
  if(!S.kyc) S.kyc = {tipo:'V', ced:'', nombre:'', email:'', tel:'', pass:'', nac:'', nacD:u?.nac?+u.nac.slice(8,10):'', nacM:u?.nac?+u.nac.slice(5,7):'', nacY:u?.nac?+u.nac.slice(0,4):'', estado:u?.estadoVzla||'', ciudad:u?.city||'', dir:u?.addr||'',
    ocup:'', trabajo:'', ingreso:'', refNom:'', refTel:'', refPar:'', cedula:null, selfie:null, cedulaUrl:'', selfieUrl:'', lat:null, lng:null, acc:null, locMsg:'', locSkip:false, terms:false, err:''};
  return S.kyc;
}
function photoBox(key, title, hint, captureMode){
  const k = S.kyc, url = k[key+'Url'];
  return `<div class="photo">
    <div class="pv">${url?`<img src="${url}" alt="${esc(title)}">`:`<span>${key==='cedula'?ico('card'):ico('user')}</span>`}</div>
    <div class="pt"><b>${title}</b><span class="muted small">${hint}</span>
      <div class="row" style="margin-top:6px">
        <label class="btn sm brand">Tomar foto<input type="file" accept="image/*" capture="${captureMode}" data-photo="${key}" hidden></label>
        <label class="btn sm">Elegir de la galería<input type="file" accept="image/*" data-photo="${key}" hidden></label>
      </div>${url?'<span class="small" style="color:var(--ok)">Foto lista ✓</span>':''}</div></div>`;
}
function kycSections(n0){
  const k = S.kyc; let n = n0;
  const loc = k.lat!=null ? `<span class="small" style="color:var(--ok)">Ubicación registrada ✓ (precisión aprox. ${Math.round(k.acc||0)} m)</span>` : k.locMsg ? `<span class="small ${k.locSkip?'muted':'err'}">${esc(k.locMsg)}</span>` : '';
  return `
  <section class="box"><h2><span class="stepn">${n++}</span>Dirección</h2>
    <div class="fg">
      <div class="field"><label for="k-estado">Estado</label><select id="k-estado" data-k="estado"><option value="">Elige tu estado</option>${ESTADOS.map(e=>`<option ${k.estado===e?'selected':''}>${e}</option>`).join('')}</select></div>
      <div class="field"><label for="k-ciudad">Ciudad o municipio</label><input id="k-ciudad" data-k="ciudad" value="${esc(k.ciudad)}" autocomplete="address-level2"></div>
      <div class="field" style="grid-column:1/-1"><label for="k-dir">Dirección de tu casa</label><input id="k-dir" data-k="dir" value="${esc(k.dir)}" placeholder="Urbanización, calle, casa o apartamento, punto de referencia" autocomplete="street-address"></div>
    </div>
    <div class="row"><button class="btn sm" data-act="geoloc">${ico('store')} ${k.lat!=null?'Actualizar mi ubicación':'Compartir mi ubicación actual'}</button>${loc}</div>
    <p class="muted small">La usamos solo para validar tu dirección. Tu navegador te pedirá permiso.</p>
  </section>
  <section class="box"><h2><span class="stepn">${n++}</span>Trabajo e ingresos</h2>
    <div class="fg">
      <div class="field"><label for="k-ocup">Ocupación</label><select id="k-ocup" data-k="ocup"><option value="">Elige una opción</option>${OCUPACIONES.map(o=>`<option ${k.ocup===o?'selected':''}>${o}</option>`).join('')}</select></div>
      <div class="field"><label for="k-ingreso">Ingreso mensual aproximado</label><select id="k-ingreso" data-k="ingreso"><option value="">Elige un rango</option>${INGRESOS.map(([v,l])=>`<option value="${v}" ${k.ingreso===v?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="field" style="grid-column:1/-1"><label for="k-trabajo">¿Dónde trabajas o a qué te dedicas? <span class="muted">(opcional)</span></label><input id="k-trabajo" data-k="trabajo" value="${esc(k.trabajo)}"></div>
    </div>
  </section>
  <section class="box"><h2><span class="stepn">${n++}</span>Fotos</h2>
    <p class="muted small">Desde el teléfono puedes tomar las fotos aquí mismo. Que se vean nítidas, con buena luz y sin reflejos. Tus fotos y tu ubicación se guardan de forma privada y no se divulgan.</p>
    ${photoBox('selfie','1. Una foto tuya','Solo tu cara, de frente, sin lentes oscuros ni gorra.','user')}
    ${photoBox('cedula','2. Foto de tu cédula','La parte de adelante, completa y nítida.','environment')}
  </section>`;
}
function kycErrors(){
  const k = S.kyc;
  if(!k.nacD || !k.nacM || !k.nacY) return 'Indica tu fecha de nacimiento: día, mes y año.';
  if(!nacOf(k)) return 'Esa fecha de nacimiento no existe. Revisa el día y el mes.';
  if(edad(nacOf(k)) < 18) return 'Debes ser mayor de edad para comprar en cuotas.';
  if(!k.estado || k.ciudad.trim().length<3 || k.dir.trim().length<8) return 'Completa tu dirección: estado, ciudad y dirección.';
  if(k.lat==null && !k.locSkip) return 'Pulsa “Compartir mi ubicación actual”.';
  if(!k.ocup || !k.ingreso) return 'Indica tu ocupación e ingreso aproximado.';
  if(!k.selfie) return 'Agrega una foto tuya.';
  if(!k.cedula) return 'Agrega la foto de tu cédula.';
  if(!k.consent) return 'Marca la autorización para verificar tu identidad.';
  return '';
}
async function compressImg(file, max=1600){
  if(!file || !/^image\//.test(file.type||'image/')) throw new Error('El archivo debe ser una imagen.');
  try{
    const bmp = await createImageBitmap(file);
    const sc = Math.min(1, max/Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width*sc); c.height = Math.round(bmp.height*sc);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r=>c.toBlob(r, 'image/jpeg', .82));
    if(blob) return blob;
  }catch(e){}
  if(file.size > 5*1024*1024) throw new Error('La foto es muy pesada. Intenta con otra.');
  return file;
}
async function uploadDoc(blob, name){
  const path = `${S.session.user.id}/${name}-${Date.now()}.jpg`;
  const {error} = await sb.storage.from('documentos').upload(path, blob, {contentType:'image/jpeg', upsert:false});
  if(error) throw new Error('No se pudo subir la foto: ' + error.message);
  return path;
}
async function sendKyc(){
  const k = S.kyc;
  const [c1, c2] = [await uploadDoc(k.cedula, 'cedula'), await uploadDoc(k.selfie, 'selfie')];
  await rpc('completar_verificacion', {p:{fecha_nacimiento:nacOf(k), estado:k.estado, ciudad:k.ciudad, direccion:k.dir, ocupacion:k.ocup, lugar_trabajo:k.trabajo,
    ingreso_rango:k.ingreso, cedula_foto:c1, selfie_foto:c2,
    lat:k.lat==null?'':String(k.lat), lng:k.lng==null?'':String(k.lng), precision:k.acc==null?'':String(Math.round(k.acc))}});
  S.kyc = null;
}

/* ===================== registro ===================== */
function vRegistro(){
  if(me()) return vCuenta();
  const k = kycInit();
  return `<div class="crumbs"><button data-act="go" data-v="login">Ingresar</button>›<span>Crear cuenta</span></div>
  <div style="max-width:620px;margin:0 auto;display:grid;gap:16px">
    <div><h1>Crear cuenta</h1><p class="muted" style="margin-top:6px">Con tu cuenta puedes comprar de contado de inmediato. Si quieres pagar en cuotas, te pediremos verificar tu identidad en ese momento.</p></div>
    <section class="box">
      <div class="fg">
        <div class="field" style="grid-column:1/-1"><label for="r-name">Nombre y apellido</label><input id="r-name" data-k="nombre" value="${esc(k.nombre)}" autocomplete="name"></div>
        <div class="field" style="grid-column:1/-1"><label>Sexo</label><div class="seg seg2">${[['M','Masculino'],['F','Femenino']].map(([v,l])=>`<label class="so"><input type="radio" name="r-sexo" value="${v}" data-k="sexo" ${k.sexo===v?'checked':''}><span class="ot">${l}</span></label>`).join('')}</div></div>
        <div class="field"><label for="r-ced">Cédula <span class="muted">(solo números)</span></label>${cedField('r', k.tipo, k.ced)}</div>
        <div class="field"><label for="r-tel">Teléfono <span class="muted">(solo números)</span></label><input id="r-tel" data-k="tel" data-digits="11" inputmode="numeric" placeholder="04141234567" value="${esc(k.tel)}" autocomplete="tel"></div>
        <div class="field" style="grid-column:1/-1"><label for="r-email">Correo</label><input id="r-email" type="email" data-k="email" value="${esc(k.email)}" autocomplete="email"></div>
        <div class="field" style="grid-column:1/-1"><label for="r-pass">Contraseña</label><input id="r-pass" type="password" data-k="pass" value="${esc(k.pass)}" autocomplete="new-password"><span class="hint">Mínimo 8 caracteres, con al menos un número.</span></div>
      </div>
      <div class="priv">${ico('shield')}<p><b>Tus datos quedan privados.</b> Tu cédula y tu teléfono, y si compras en cuotas la foto de tu cédula, tu foto y tu ubicación, se guardan de forma privada y no se divulgan. Solo se usan para verificar tu identidad.</p></div>
      <label class="ck small"><input type="checkbox" data-k="terms" ${k.terms?'checked':''}><span>Soy mayor de 18 años y acepto los <button type="button" class="link" data-act="go" data-v="terminos">Términos de uso</button> y la <button type="button" class="link" data-act="go" data-v="privacidad">Política de privacidad</button>, incluido el tratamiento de mis datos como allí se explica.</span></label>
      ${k.err?`<div class="note bad small">${esc(k.err)}</div>`:''}
      <button class="btn buy block" data-act="doregister">${S.busy?'Creando cuenta…':'Crear cuenta'}</button>
      <span class="muted small">¿Ya tienes cuenta? <button class="link small" data-act="go" data-v="login">Ingresa aquí</button></span>
    </section>
  </div>`;
}
async function doRegister(){
  const k = kycInit(); k.err = '';
  const fail = m => { k.err = m; S.busy = false; render(); };
  const name = k.nombre.trim().replace(/\s+/g,' '), em = k.email.trim().toLowerCase(), ced = onlyDigits(k.ced), tel = normTel(k.tel);
  if(name.split(' ').length<2) return fail('Escribe tu nombre y apellido.');
  if(!['M','F'].includes(k.sexo)) return fail('Indica si eres masculino o femenino.');
  if(!/^\d{6,9}$/.test(ced)) return fail('Escribe tu cédula solo con números, por ejemplo 12345678.');
  if(!/^0\d{10}$/.test(tel)) return fail('Escribe tu teléfono de 11 números, por ejemplo 04141234567.');
  if(!/^\S+@\S+\.\S+$/.test(em)) return fail('Escribe un correo válido.');
  if(k.pass.length<8 || !/\d/.test(k.pass)) return fail('La contraseña debe tener al menos 8 caracteres y un número.');
  if(!k.terms) return fail('Para crear tu cuenta debes ser mayor de edad y aceptar los Términos de uso y la Política de privacidad.');
  const {data, error} = await sb.auth.signUp({email:em, password:k.pass, options:{data:{nombre:name, sexo:k.sexo, cedula:`${k.tipo}-${ced}`, telefono:tel, acepta_legal:'true', legal_version:LEGAL_VERSION}, emailRedirectTo: location.origin + location.pathname}});
  if(error) return fail(/already registered|already been registered/i.test(error.message) ? 'Ya existe una cuenta con ese correo. Ingresa con tu contraseña.'
    : /Database error/i.test(error.message) ? 'Esa cédula ya está registrada en otra cuenta.' : /Password/i.test(error.message) ? 'La contraseña es muy débil. Usa al menos 8 caracteres con letras y números.' : friendly(error));
  S.kyc = null;
  if(!data.session){ toast('Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego ingresa.'); go('login'); return; }
  S.session = data.session; await loadPrivate(); toast(`Cuenta creada. Bienvenido, ${name.split(' ')[0]}.`); afterLogin();
}
function verifPanel(){
  const u = me(); const v = u.verif;
  if(v==='verificado') return `<h1>Verificación</h1><div class="note ok">Tu identidad está verificada. Puedes comprar de contado y en cuotas.</div>`;
  if(v==='pendiente') return `<h1>Verificación</h1><div class="note">Recibimos tus documentos. Ya puedes solicitar compras en cuotas; revisaremos tu identidad junto con tu primera solicitud.</div>${S.after==='checkout'?'<div><button class="btn buy" data-act="go" data-v="checkout">Volver a mi compra</button></div>':''}`;
  kycInit(u);
  return `<h1>Verificación para comprar en cuotas</h1>
    ${v==='rechazado'?`<div class="note bad">No pudimos verificar tus documentos${u.verifNota?': '+esc(u.verifNota):''}. Vuelve a enviarlos.</div>`:`<p class="muted">Solo la pedimos para comprar en cuotas. Toma unos 2 minutos y no tienes que esperar: puedes hacer tu solicitud apenas la envíes.</p>`}
    <section class="box"><h2><span class="stepn">1</span>Fecha de nacimiento</h2><div class="nac">${(()=>{ const k = S.kyc, y0 = new Date().getFullYear();
      const opt = (v, l, cur) => `<option value="${v}" ${String(cur)===String(v)?'selected':''}>${l}</option>`;
      return `<div class="field"><label for="k-nacd">Día</label><select id="k-nacd" data-k="nacD"><option value="">Día</option>${Array.from({length:31},(_,i)=>opt(i+1,i+1,k.nacD)).join('')}</select></div>
      <div class="field"><label for="k-nacm">Mes</label><select id="k-nacm" data-k="nacM"><option value="">Mes</option>${MESES.map((m,i)=>opt(i+1,m,k.nacM)).join('')}</select></div>
      <div class="field"><label for="k-nacy">Año</label><select id="k-nacy" data-k="nacY"><option value="">Año</option>${Array.from({length:73},(_,i)=>y0-18-i).map(y=>opt(y,y,k.nacY)).join('')}</select></div>`; })()}</div></section>
    ${kycSections(2)}
    <label class="ck small"><input type="checkbox" data-k="consent" ${S.kyc.consent?'checked':''}><span>Autorizo que se usen mi foto, la foto de mi cédula, mi ubicación y los datos de este formulario solo para verificar mi identidad y evaluar mi crédito, como explica la <button type="button" class="link" data-act="go" data-v="privacidad">Política de privacidad</button>.</span></label>
    ${S.kyc.err?`<div class="note bad small">${esc(S.kyc.err)}</div>`:''}
    <div><button class="btn buy" data-act="dokyc">${S.busy?'Enviando…':S.after==='checkout'?'Enviar y volver a mi compra':'Enviar verificación'}</button></div>`;
}

/* ===================== trabaja con nosotros ===================== */
function vTrabaja(){
  const pc = S.cfg.postulacion;
  if(!pc || pc.activo===false) return `<div class="empty"><h2>Trabaja con nosotros</h2><p>Por ahora no estamos recibiendo postulaciones.</p></div>`;
  if(!S.post) S.post = {tienda:'', nombre:'', ptipo:'V', pced:'', ptel:'', pciudad:'', r:{}, err:'', done:null};
  const P = S.post;
  if(P.done){
    const dest = P.tienda ? ST(+P.tienda).name : siteName();
    const resumen = `Hola, me postulé para trabajar con ${dest}.\nPostulación: ${P.done}\nNombre: ${P.nombre}\nCédula: ${P.ptipo}-${onlyDigits(P.pced)}\nTeléfono: ${normTel(P.ptel)}\nCiudad: ${P.pciudad}\n` +
      (pc.preguntas||[]).filter(q=>P.r[q.id]).map(q=>`${q.texto} ${P.r[q.id]}`).join('\n');
    const wa = waLink(resumen, P.tienda ? +P.tienda : null);
    return `<div class="empty" style="max-width:620px;margin:0 auto"><h2>¡Recibimos tu postulación!</h2>
      <p>Tu número de postulación es <b>${esc(P.done)}</b>. ${wa?'Para agilizar el proceso, envíanosla también por WhatsApp:':'Te contactaremos pronto al teléfono que nos diste.'}</p>
      ${wa?`<a class="btn buy" href="${wa}" target="_blank" rel="noopener">${ico('chat')} Enviar por WhatsApp</a>`:''}
      <button class="link" data-act="go" data-v="inicio">Volver a la tienda</button></div>`;
  }
  const field = q => {
    const v = P.r[q.id] || '', req = q.requerida ? '' : ' <span class="muted">(opcional)</span>';
    const lab = `<label>${esc(q.texto)}${req}</label>`;
    if(q.tipo==='opcion') return `<div class="field" style="grid-column:1/-1">${lab}<div class="seg seg2">${(q.opciones||[]).map(o=>`<label class="so"><input type="radio" name="q-${q.id}" value="${esc(o)}" data-q="${q.id}" ${v===o?'checked':''}><span class="ot">${esc(o)}</span></label>`).join('')}</div></div>`;
    if(q.tipo==='si_no') return `<div class="field" style="grid-column:1/-1">${lab}<div class="seg seg2" style="max-width:320px">${['Sí','No'].map(o=>`<label class="so"><input type="radio" name="q-${q.id}" value="${o}" data-q="${q.id}" ${v===o?'checked':''}><span class="ot">${o}</span></label>`).join('')}</div></div>`;
    if(q.tipo==='parrafo') return `<div class="field" style="grid-column:1/-1">${lab}<textarea rows="3" data-q="${q.id}">${esc(v)}</textarea></div>`;
    return `<div class="field">${lab}<input data-q="${q.id}" value="${esc(v)}" ${q.tipo==='numero'?'inputmode="numeric" data-digits="3"':''}></div>`;
  };
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<span>${esc(pc.titulo||'Trabaja con nosotros')}</span></div>
  ${jobCard(true)}
  <div id="postform" style="max-width:820px;margin:28px auto 0;display:grid;gap:16px;scroll-margin-top:170px">
    <div><h1>Formulario de postulación</h1><p class="muted" style="margin-top:6px">${esc(pc.texto||'')}</p></div>
    <section class="box"><h2><span class="stepn">1</span>Tus datos</h2><div class="fg">
      <div class="field" style="grid-column:1/-1"><label>¿Con qué tienda quieres trabajar?</label><div class="seg seg3">${[...S.stores.map(t=>[String(t.id), t.name]), ['', 'Con cualquiera']].map(([v,l])=>`<label class="so"><input type="radio" name="p-tienda" value="${v}" data-k="tienda" ${P.tienda===v?'checked':''}><span class="ot">${esc(l)}</span></label>`).join('')}</div></div>
      <div class="field" style="grid-column:1/-1"><label for="p-nombre">Nombre y apellido</label><input id="p-nombre" data-k="nombre" value="${esc(P.nombre)}" autocomplete="name"></div>
      <div class="field"><label for="p-ced">Cédula <span class="muted">(solo números)</span></label>${cedField('p', P.ptipo, P.pced)}</div>
      <div class="field"><label for="p-tel">Teléfono / WhatsApp <span class="muted">(solo números)</span></label><input id="p-tel" data-k="ptel" data-digits="11" inputmode="numeric" placeholder="04141234567" value="${esc(P.ptel)}" autocomplete="tel"></div>
      <div class="field"><label for="p-ciudad">Ciudad</label><input id="p-ciudad" data-k="pciudad" value="${esc(P.pciudad)}"></div>
    </div></section>
    <section class="box"><h2><span class="stepn">2</span>Cuéntanos de ti</h2><div class="fg">${(pc.preguntas||[]).map(field).join('')}</div></section>
    ${P.err?`<div class="note bad small">${esc(P.err)}</div>`:''}
    <div><button class="btn buy" data-act="dopostular">${S.busy?'Enviando…':'Enviar postulación'}</button></div>
  </div>`;
}
async function doPostular(){
  const P = S.post, pc = S.cfg.postulacion; P.err = '';
  const fail = m => { P.err = m; render(); };
  if(P.nombre.trim().split(/\s+/).length<2) return fail('Escribe tu nombre y apellido.');
  if(!/^\d{6,9}$/.test(onlyDigits(P.pced))) return fail('Escribe tu cédula solo con números.');
  if(!telOk(P.ptel)) return fail('Escribe tu teléfono de 11 números, por ejemplo 04141234567.');
  if(P.pciudad.trim().length<3) return fail('Escribe tu ciudad.');
  const miss = (pc.preguntas||[]).find(q=>q.requerida && !String(P.r[q.id]||'').trim());
  if(miss) return fail('Responde: ' + miss.texto);
  try{
    const res = await rpc('postular', {p:{tienda_id:P.tienda||null, nombre:P.nombre, cedula:`${P.ptipo}-${onlyDigits(P.pced)}`, telefono:normTel(P.ptel), ciudad:P.pciudad, respuestas:P.r}});
    P.done = res.codigo; render(); window.scrollTo(0,0);
  }catch(e){ fail(friendly(e)); }
}

/* ===================== panel: clientes y postulaciones ===================== */
function aClientes(){
  const all = admUsers();
  if(!admCuo()){
    const list = all.slice().sort((a,b)=>b.created-a.created);
    return `<h1>Clientes</h1>
    <p class="muted small">Aquí aparecen los clientes que han comprado en ${esc(ST(admStoreId()).name)}.</p>
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Cliente</th><th>Cédula</th><th>Teléfono</th><th>Ciudad</th><th class="r">Pedidos</th><th class="r">Comprado</th><th></th></tr></thead><tbody>
    ${list.map(u=>{ const os = S.orders.filter(inAdm).filter(o=>o.userId===u.id), vend = os.filter(o=>VENDIDO.includes(o.st));
      return `<tr><td><b>${esc(u.name)}</b><div class="muted small">${esc(u.email)}</div></td><td class="nw">${esc(u.cedula)}</td><td class="nw">${esc(u.phone)} ${u.phone?`<a class="link small" href="https://wa.me/${waNum(u.phone)}" target="_blank" rel="noopener">WhatsApp</a>`:''}</td>
      <td>${esc(u.city||'—')}</td><td class="r num">${os.length}</td><td class="r num nw">${usd(r2(sum(vend,o=>o.total)))}</td>
      <td class="nw"><button class="btn sm" data-act="edo" data-u="${u.id}">Ver compras</button></td></tr>`; }).join('')}
    </tbody></table></div>`:'<div class="empty">Todavía no hay clientes.</div>'}`;
  }
  const f = S.admF.cli || 'pendiente';
  const list = all.filter(u=>f==='todos'||u.verif===f).sort((a,b)=>b.created-a.created);
  const cnt = v => all.filter(u=>u.verif===v).length;
  return `<h1>Clientes</h1>
    <p class="muted small">Aquí aparecen los clientes que han comprado en ${admStoreId()?esc(ST(admStoreId()).name):'las tiendas'}. Los documentos solo se piden a quien quiere comprar en cuotas; la verificación sirve para las dos tiendas. Al aprobar su primer crédito, la identidad queda verificada automáticamente.</p>
    <div class="chips">${[['pendiente','Por revisar'],['verificado','Verificados'],['rechazado','Rechazados'],['incompleto','Sin documentos'],['todos','Todos']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="cli" data-v="${k}" aria-pressed="${f===k}">${l} <span class="num">(${k==='todos'?all.length:cnt(k)})</span></button>`).join('')}</div>
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Cliente</th><th>Cédula</th><th>Teléfono</th><th>Ubicación</th><th>Registro</th><th>Identidad</th><th></th></tr></thead><tbody>
    ${list.map(u=>`<tr><td><b>${esc(u.name)}</b><div class="muted small">${esc(u.email)}</div></td><td class="nw">${esc(u.cedula)}</td><td class="nw">${esc(u.phone)}</td>
      <td>${esc(u.city)}${u.estadoVzla?', '+esc(u.estadoVzla):''}</td><td class="nw">${fd(u.created)}</td><td>${verifTag(u.verif)}</td>
      <td class="nw"><button class="btn sm ${u.verif==='pendiente'?'brand':''}" data-act="cliente" data-u="${u.id}">${u.verif==='pendiente'?'Revisar':'Ver'}</button></td></tr>`).join('')}
    </tbody></table></div>`:'<div class="empty">No hay clientes en este filtro.</div>'}`;
}
function clienteModal(uid){
  const u = U(uid); if(!u) return; M = {type:'cliente', uid};
  const e = edad(u.nac), map = u.lat!=null ? `https://www.google.com/maps?q=${u.lat},${u.lng}` : '';
  const ingreso = (INGRESOS.find(x=>x[0]===u.ingreso)||[])[1] || '—';
  if(!admCuo()) return estadoCuenta(uid);
  modal(`Cliente · ${esc(u.name)}`, `
    <div class="row between">${verifTag(u.verif)}<span class="muted small">Registrado el ${fd(u.created)}</span></div>
    ${u.verifNota?`<div class="note small">${esc(u.verifNota)}</div>`:''}
    <div class="docs"><figure><div id="doc-selfie" class="muted small">${u.selfieFoto?'Cargando…':'Sin foto'}</div><figcaption>Foto de la persona</figcaption></figure>
      <figure><div id="doc-cedula" class="muted small">${u.cedulaFoto?'Cargando…':'Sin foto'}</div><figcaption>Cédula</figcaption></figure></div>
    <dl class="dl">
      <dt>Cédula</dt><dd>${esc(u.cedula)}</dd><dt>Sexo</dt><dd>${u.sexo==='F'?'Femenino':u.sexo==='M'?'Masculino':'—'}</dd><dt>Nacimiento</dt><dd>${u.nac?`${fd(dateOnly(u.nac))} (${e} años)`:'—'}</dd>
      <dt>Teléfono</dt><dd>${esc(u.phone)} ${u.phone?`<a class="link small" href="https://wa.me/${waNum(u.phone)}" target="_blank" rel="noopener">WhatsApp</a>`:''}</dd><dt>Correo</dt><dd>${esc(u.email)}</dd>
      <dt>Dirección</dt><dd>${esc(u.addr)}${u.city?', '+esc(u.city):''}${u.estadoVzla?', '+esc(u.estadoVzla):''}</dd>
      <dt>Ubicación</dt><dd>${map?`<a class="link" href="${map}" target="_blank" rel="noopener">Ver en el mapa</a> <span class="muted small">(±${u.acc||'?'} m)</span>`:'No compartida'}</dd>
      <dt>Ocupación</dt><dd>${esc(u.ocup||'—')}${u.trabajo?' · '+esc(u.trabajo):''}</dd><dt>Ingreso</dt><dd>${esc(ingreso)}</dd>
    </dl>
    ${u.verif!=='incompleto'?`<div class="field"><label for="cv-nota">Motivo si rechazas</label><select id="cv-nota"><option>La foto de la cédula no es legible</option><option>La foto de la persona no coincide con la cédula</option><option>Los datos no coinciden con la cédula</option><option>La dirección no se pudo confirmar</option></select></div>`:''}`,
    `<button class="btn" data-act="edo" data-u="${u.id}">Estado de cuenta</button>${u.verif!=='incompleto'?`<button class="btn danger" data-act="clirev" data-u="${u.id}" data-v="rechazado">Rechazar</button><button class="btn buy" data-act="clirev" data-u="${u.id}" data-v="verificado">Verificar identidad</button>`:''}`, true);
  [['cedula',u.cedulaFoto],['selfie',u.selfieFoto]].forEach(([k,p])=>{ if(!p) return;
    sb.storage.from('documentos').createSignedUrl(p, 600).then(({data,error})=>{ const el=$('#doc-'+k); if(!el||M.uid!==uid) return;
      el.innerHTML = error||!data?.signedUrl ? 'No se pudo cargar.' : `<a href="${esc(data.signedUrl)}" target="_blank" rel="noopener"><img src="${esc(data.signedUrl)}" alt="${k}"></a>`; }); });
}
/* ===================== encargos ===================== */
const ENCEST = {nuevo:['Nuevo','warn'], contactado:['Contactado','info'], en_camino:['En camino','info'], listo:['Listo para entregar','ok'], entregado:['Entregado','ok'], descartado:['Descartado','']};
const encMsg = e => `Hola, hice el encargo ${e.codigo} en ${ST(e.store).name}.\nEquipo: ${[e.marca,e.modelo].filter(Boolean).join(' ')}${e.capacidad?'\nCapacidad: '+e.capacidad:''}${e.color?'\nColor: '+e.color:''}\nPago: ${e.pago==='cuotas'?'en cuotas':'de contado'}${e.presupuesto?'\nPresupuesto: '+usd(e.presupuesto):''}${e.notas?'\nNotas: '+e.notas:''}\nNombre: ${e.nombre}\nWhatsApp: ${e.telefono}${e.ciudad?'\nCiudad: '+e.ciudad:''}`;
function vEncargo(){
  const u = me();
  if(!S.enc) S.enc = {tienda:String(S.stores[0]?.id||''), marca:'', modelo:'', capacidad:'', color:'', pago:'contado', presupuesto:'', notas:'', nombre:u?.name||'', tel:u?.phone||'', ciudad:u?.city||'', err:'', done:null};
  const E = S.enc, tS = ST(+E.tienda);
  if(!tS.cuotas) E.pago = 'contado';
  if(E.done){ const wa = waLink(encMsg(E.done), E.done.store);
    return `<div class="empty" style="max-width:620px;margin:0 auto"><h2>¡Recibimos tu encargo!</h2>
      <p>Tu número de encargo es <b>${esc(E.done.codigo)}</b>. ${wa?`Envíaselo por WhatsApp a ${esc(ST(E.done.store).name)} para que te respondan con el precio y la fecha de llegada:`:`${esc(ST(E.done.store).name)} te escribirá al número que nos diste.`}</p>
      ${wa?`<a class="btn buy" href="${wa}" target="_blank" rel="noopener">${ico('chat')} Enviar por WhatsApp</a>`:''}
      <div class="row" style="justify-content:center"><button class="link" data-act="encnew">Hacer otro encargo</button><button class="link" data-act="go" data-v="inicio">Volver a la tienda</button></div></div>`; }
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<span>Encargar un teléfono</span></div>
  <div style="max-width:820px;margin:0 auto;display:grid;gap:16px">
    <div><h1>Encargar un teléfono</h1><p class="muted" style="margin-top:6px">¿Buscas un modelo que no está en el catálogo o está agotado? Cuéntanos cuál quieres. La tienda te escribe por WhatsApp con el precio y la fecha de llegada; no pagas nada hasta que te confirmen.</p></div>
    <section class="box"><h2><span class="stepn">1</span>¿A qué tienda se lo encargas?</h2>
      <div class="seg seg2">${S.stores.map(t=>`<label class="so"><input type="radio" name="e-tienda" value="${t.id}" data-e="tienda" ${E.tienda===String(t.id)?'checked':''}><span class="ot">${esc(t.name)}</span><span class="os">${t.cuotas?'Contado o cuotas':'Solo contado'}</span></label>`).join('')}</div></section>
    <section class="box"><h2><span class="stepn">2</span>El equipo</h2><div class="fg">
      <div class="field"><label for="e-marca">Marca</label><input id="e-marca" data-e="marca" value="${esc(E.marca)}" placeholder="Ej. Apple, Samsung, Xiaomi"></div>
      <div class="field"><label for="e-modelo">Modelo</label><input id="e-modelo" data-e="modelo" value="${esc(E.modelo)}" placeholder="Ej. iPhone 16 Pro Max"></div>
      <div class="field"><label for="e-cap">Capacidad <span class="muted">(opcional)</span></label><input id="e-cap" data-e="capacidad" value="${esc(E.capacidad)}" placeholder="Ej. 256 GB"></div>
      <div class="field"><label for="e-color">Color <span class="muted">(opcional)</span></label><input id="e-color" data-e="color" value="${esc(E.color)}" placeholder="Ej. Titanio natural"></div>
      <div class="field"><label>¿Cómo lo pagarías?</label><div class="seg seg2">${[['contado','De contado'],['cuotas','En cuotas']].map(([v,l])=>`<label class="so ${v==='cuotas'&&!tS.cuotas?'dis':''}"><input type="radio" name="e-pago" value="${v}" data-e="pago" ${E.pago===v?'checked':''} ${v==='cuotas'&&!tS.cuotas?'disabled':''}><span class="ot">${l}</span>${v==='cuotas'&&!tS.cuotas?`<span class="os">${esc(tS.name)} vende de contado</span>`:''}</label>`).join('')}</div></div>
      <div class="field"><label for="e-pres">Presupuesto aproximado en USD <span class="muted">(opcional)</span></label><input id="e-pres" data-e="presupuesto" inputmode="numeric" data-digits="5" value="${esc(E.presupuesto)}"></div>
      <div class="field" style="grid-column:1/-1"><label for="e-notas">Algo más que debamos saber <span class="muted">(opcional)</span></label><textarea id="e-notas" data-e="notas" rows="2" placeholder="Ej. lo necesito antes del 15">${esc(E.notas)}</textarea></div>
    </div></section>
    <section class="box"><h2><span class="stepn">3</span>Tus datos</h2><div class="fg">
      <div class="field" style="grid-column:1/-1"><label for="e-nom">Nombre y apellido</label><input id="e-nom" data-e="nombre" value="${esc(E.nombre)}" autocomplete="name"></div>
      <div class="field"><label for="e-tel">WhatsApp <span class="muted">(solo números)</span></label><input id="e-tel" data-e="tel" data-digits="11" inputmode="numeric" placeholder="04141234567" value="${esc(E.tel)}" autocomplete="tel"></div>
      <div class="field"><label for="e-ciu">Ciudad</label><input id="e-ciu" data-e="ciudad" value="${esc(E.ciudad)}"></div>
    </div></section>
    ${E.err?`<div class="note bad small">${esc(E.err)}</div>`:''}
    <div><button class="btn buy" data-act="doencargo">${S.busy?'Enviando…':'Enviar encargo'}</button></div>
  </div>`;
}
async function doEncargo(){
  const E = S.enc; E.err = ''; const fail = m => { E.err = m; render(); };
  if(!E.tienda) return fail('Elige la tienda.');
  if(E.modelo.trim().length<2) return fail('Escribe el modelo que quieres encargar.');
  if(E.nombre.trim().split(/\s+/).length<2) return fail('Escribe tu nombre y apellido.');
  if(!telOk(E.tel)) return fail('Escribe tu WhatsApp de 11 números, por ejemplo 04141234567.');
  try{
    const res = await rpc('encargar', {p:{tienda_id:+E.tienda, marca:E.marca, modelo:E.modelo, capacidad:E.capacidad, color:E.color, pago:E.pago, presupuesto:E.presupuesto, notas:E.notas, nombre:E.nombre, telefono:normTel(E.tel), ciudad:E.ciudad}});
    E.done = {codigo:res.codigo, store:+E.tienda, marca:E.marca, modelo:E.modelo, capacidad:E.capacidad, color:E.color, pago:E.pago, presupuesto:+E.presupuesto||null, notas:E.notas, nombre:E.nombre, telefono:normTel(E.tel), ciudad:E.ciudad};
    if(me()) await loadPrivate(); render(); window.scrollTo(0,0);
  }catch(e){ fail(friendly(e)); }
}
function aEncargos(){
  const f = S.admF.enc || 'activos';
  const list = S.encs.filter(inAdm).filter(e=>f==='todos' || (f==='activos' ? !['entregado','descartado'].includes(e.estado) : e.estado===f));
  return `<h1>Encargos</h1>
    <p class="muted small">Teléfonos que los clientes pidieron y no están en el catálogo o están agotados. Escríbeles por WhatsApp con el precio y la fecha, y ve cambiando el estado.</p>
    <div class="chips">${[['activos','En proceso'],['nuevo','Nuevos'],['en_camino','En camino'],['entregado','Entregados'],['todos','Todos']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="enc" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</div>
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Encargo</th><th>Cliente</th><th>Equipo</th>${admCuo()?'<th>Pago</th>':''}<th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>
    ${list.map(e=>{const [l,c]=ENCEST[e.estado]||['',''];return `<tr><td class="nw">${e.codigo}${stCol(e.store)}</td><td><b>${esc(e.nombre)}</b><div class="muted small">${esc(e.telefono)}${e.ciudad?' · '+esc(e.ciudad):''}</div></td>
      <td><b>${esc([e.marca,e.modelo].filter(Boolean).join(' '))}</b><div class="muted small">${esc([e.capacidad,e.color].filter(Boolean).join(' · '))}${e.presupuesto?` · hasta ${usd(e.presupuesto)}`:''}</div>${e.notas?`<div class="small">${esc(e.notas)}</div>`:''}${e.nota?`<div class="muted small">Nota: ${esc(e.nota)}</div>`:''}</td>
      ${admCuo()?`<td>${e.pago==='cuotas'?'<span class="tag warn">Cuotas</span>':'<span class="tag dark">Contado</span>'}</td>`:''}<td class="nw">${fd(e.creado)}</td><td><span class="tag ${c}">${l}</span></td>
      <td class="nw"><a class="btn sm" href="https://wa.me/${waNum(e.telefono)}?text=${encodeURIComponent(`Hola ${e.nombre.split(' ')[0]}, te escribimos de ${ST(e.store).name} por tu encargo ${e.codigo} (${[e.marca,e.modelo].filter(Boolean).join(' ')}).`)}" target="_blank" rel="noopener">WhatsApp</a> <button class="btn sm brand" data-act="encedit" data-id="${e.id}">Estado</button></td></tr>`}).join('')}
    </tbody></table></div>`:'<div class="empty">No hay encargos en este filtro.</div>'}`;
}
function encModal(id){
  const e = S.encs.find(x=>x.id===id); M = {type:'enc', id};
  modal(`Encargo ${e.codigo}`, `<dl class="dl"><dt>Cliente</dt><dd>${esc(e.nombre)} · ${esc(e.telefono)}</dd><dt>Equipo</dt><dd>${esc([e.marca,e.modelo,e.capacidad,e.color].filter(Boolean).join(' · '))}</dd>${ST(e.store).cuotas?`<dt>Pago</dt><dd>${e.pago==='cuotas'?'En cuotas':'De contado'}${e.presupuesto?` · presupuesto ${usd(e.presupuesto)}`:''}</dd>`:e.presupuesto?`<dt>Presupuesto</dt><dd>${usd(e.presupuesto)}</dd>`:''}${e.notas?`<dt>Notas</dt><dd>${esc(e.notas)}</dd>`:''}</dl>
    <div class="fg"><div class="field"><label for="en-est">Estado</label><select id="en-est">${Object.entries(ENCEST).map(([k,[l]])=>`<option value="${k}" ${e.estado===k?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="en-nota">Nota interna</label><input id="en-nota" value="${esc(e.nota||'')}" placeholder="Ej. cotizado en $1.250, llega el 20"></div></div>`,
    `<button class="btn" data-act="close">Cancelar</button><button class="btn brand" data-act="encsave">Guardar</button>`);
}
const POSTEST = {nueva:['Nueva','warn'], contactada:['Contactada','info'], entrevista:['Entrevista','info'], contratada:['Contratada','ok'], descartada:['Descartada','']};
function postResp(p){
  // respuestas en el orden de las preguntas del formulario
  const qs = (S.cfg.postulacion?.preguntas || []).map(q=>q.texto);
  const ent = Object.entries(p.respuestas||{});
  return ent.sort((a,b)=>{ const ia = qs.indexOf(a[0]), ib = qs.indexOf(b[0]); return (ia<0?99:ia)-(ib<0?99:ib); });
}
const postFind = (p, re) => (postResp(p).find(([k])=>re.test(k))||[])[1];
function aPostulaciones(){
  const f = S.admF.pos || 'activas';
  const all = admPosts();
  const list = all.filter(p=>f==='todas' || (f==='activas' ? !['contratada','descartada'].includes(p.estado) : p.estado===f));
  const cnt = k => k==='todas' ? all.length : k==='activas' ? all.filter(p=>!['contratada','descartada'].includes(p.estado)).length : all.filter(p=>p.estado===k).length;
  return `<h1>Postulaciones</h1>
    <p class="muted small">Personas que quieren trabajar promocionando y vendiendo equipos. Llegan desde “Trabaja con nosotros”.</p>
    <div class="chips">${[['activas','En proceso'],['nueva','Nuevas'],['contratada','Contratadas'],['descartada','Descartadas'],['todas','Todas']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="pos" data-v="${k}" aria-pressed="${f===k}">${l} <span class="num">(${cnt(k)})</span></button>`).join('')}</div>
    ${list.length?`<div class="posts">${list.map(p=>{const [l,c]=POSTEST[p.estado]||['',''];
      const disp = postFind(p,/tiempo|disponib/i), exp = postFind(p,/experiencia/i), edad = postFind(p,/edad/i);
      return `<article class="postc">
        <div class="pc-h"><div><b>${esc(p.nombre)}</b><div class="muted small">${p.codigo} · ${fd(p.creado)}${isGenAdmin()?` · ${p.store?esc(ST(p.store).name):'Cualquier tienda'}`:''}</div></div><span class="tag ${c}">${l}</span></div>
        <div class="pc-d"><span>${ico('chat')} ${esc(p.telefono)}</span><span>${esc(p.ciudad||'—')}</span>${edad?`<span>${esc(edad)} años</span>`:''}<span>C.I. ${esc(p.cedula)}</span></div>
        <div class="pc-t">${disp?`<span class="tag">${esc(disp)}</span>`:''}${exp?`<span class="tag">Experiencia: ${esc(exp)}</span>`:''}</div>
        ${p.nota?`<div class="muted small">Nota: ${esc(p.nota)}</div>`:''}
        <div class="pc-f"><a class="btn sm" href="https://wa.me/${waNum(p.telefono)}?text=${encodeURIComponent(`Hola ${p.nombre.split(' ')[0]}, te escribimos de ${ST(p.store||myStore()||S.stores[0]?.id).name} por tu postulación ${p.codigo}.`)}" target="_blank" rel="noopener">WhatsApp</a><button class="btn sm brand" data-act="post" data-p="${p.id}">Ver respuestas</button></div>
      </article>`}).join('')}</div>`:'<div class="empty">No hay postulaciones en este filtro.</div>'}`;
}
function postModal(id){
  const p = S.posts.find(x=>x.id===id); M = {type:'post', id};
  const [l,c] = POSTEST[p.estado]||['',''];
  modal(`Postulación ${p.codigo}`, `
    <div class="row between"><span class="tag ${c}">${l}</span><span class="muted small">Recibida el ${fdt(p.creado)}</span></div>
    <h3>Datos personales</h3>
    <div class="pgrid"><div><span>Nombre</span><b>${esc(p.nombre)}</b></div><div><span>Cédula</span><b>${esc(p.cedula)}</b></div><div><span>Teléfono</span><b>${esc(p.telefono)}</b></div><div><span>Ciudad</span><b>${esc(p.ciudad||'—')}</b></div></div>
    <h3>Respuestas</h3>
    <div class="qa">${postResp(p).map(([k,v])=>`<div><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join('') || '<p class="muted">Sin respuestas.</p>'}</div>
    <h3>Seguimiento</h3>
    <div class="fg"><div class="field"><label for="ps-est">Estado</label><select id="ps-est">${Object.entries(POSTEST).map(([k,[l2]])=>`<option value="${k}" ${p.estado===k?'selected':''}>${l2}</option>`).join('')}</select></div>
    <div class="field"><label for="ps-nota">Nota interna</label><input id="ps-nota" value="${esc(p.nota||'')}" placeholder="Ej. entrevista el lunes 10 a.m."></div></div>`,
    `<a class="btn" href="https://wa.me/${waNum(p.telefono)}" target="_blank" rel="noopener">${ico('chat')} Escribir por WhatsApp</a><button class="btn brand" data-act="savepost">Guardar</button>`);
}

/* ===================== modales ===================== */
let M = {};
function modal(head, body, foot='', wide=false){
  const m = $('#modal'); m.className = 'modal' + (wide?' wide':'');
  m.innerHTML = `<div class="mh"><h2>${head}</h2><button class="x" data-act="close" aria-label="Cerrar">${ico('x')}</button></div><div class="mb">${body}</div>${foot?`<div class="mf">${foot}</div>`:''}`;
  $('#ov').hidden = false;
}
function closeModal(){ $('#ov').hidden = true; M = {}; }

function payModal(ctx){
  const okM = METODOS_COMP.filter(k=>storeMethods(ctx.store).includes(k)); const lm = okM.length ? okM : ['usdt'];
  M = Object.assign({}, ctx, {method: lm.includes(ctx.method) ? ctx.method : lm[0]});
  const cur = METODOS[M.method].cur;
  modal(esc(M.title), `
    <div class="note info small">${M.desc}</div>
    ${M.store?`<p class="muted small" style="margin:-4px 0 0">¿Vas a pagar en efectivo? Escríbele a ${esc(ST(M.store).name)} por WhatsApp: la tienda lo registra cuando lo recibe.</p>`:''}
    <div class="field"><label for="pm-met">Método</label><select id="pm-met" data-on="pmmet">${Object.entries(METODOS).filter(([k])=>lm.includes(k)).map(([k,m])=>`<option value="${k}" ${M.method===k?'selected':''}>${m.n}</option>`).join('')}</select></div>
    <div class="bankdata">${M.store?`<span class="muted small">Datos para pagar a ${esc(ST(M.store).name)}</span>`:''}${payInfo(M.method, M.store)}
</div>
    ${dualBox(M.amount, M.method, M.store)}
    <form id="payf" class="fg" novalidate>
      ${cur==='Bs'?`<div class="field"><label for="pm-bank">Banco de origen</label><select id="pm-bank">${BANKS.map(b=>`<option>${b}</option>`).join('')}</select></div>`:''}
      <div class="field"><label for="pm-ref">${cur==='Bs'?'Referencia':'ID de la orden (Binance)'}</label><input id="pm-ref"></div>
      <div class="field"><label for="pm-amt">Monto pagado (${cur==='USD'?'USDT':cur})</label><input id="pm-amt" inputmode="decimal" value="${cur==='Bs'?bsPrice(M.amount, M.store):M.amount}"></div>
      <div class="field"><span class="lbl">Comprobante</span>${fileBtn('pm-file', 'image/*,application/pdf', '', 'Subir captura del pago')}<span class="hint">Captura o PDF del pago. Máximo 5 MB.</span></div>
      <div class="err" id="pm-err" style="grid-column:1/-1"></div>
    </form>`, `<button class="btn" data-act="close">Cancelar</button><button class="btn buy" data-act="submitpay">Enviar comprobante</button>`);
}
function reviewModal(id){
  const p = S.payments.find(x=>x.id===id); const u = U(p.userId) || {}; M = {type:'review', id};
  const diff = r2(reportedUSD(p) - p.expected); const short = diff < -0.5;
  let extra = '';
  if(p.kind==='inicial'){ const c=C(p.creditId), h=historial(p.userId);
    extra = `<dt>Crédito</dt><dd>${c.code} · ${c.n} cuotas ${c.freq} de ${usd(r2(c.financed/c.n))}</dd><dt>Financiado</dt><dd>${usd(c.financed)} (inicial ${Math.round(c.iniPct*100)}%)</dd>
      <dt>Identidad</dt><dd>${verifTag(u.verif)} <button class="link small" data-act="cliente" data-u="${u.id}">Ver en Clientes</button></dd>
      <dt>Historial</dt><dd>${h.n} pedidos · ${h.liq} crédito(s) pagado(s) · ${h.moras} cuota(s) con mora</dd>`; }
  if(p.kind==='cuota'){ const c=C(p.creditId); extra = `<dt>Cuotas</dt><dd>${p.cuotas.map(n=>{const q=c.cuotas.find(x=>x.n===n);return `${n} (${usd(q.amount)}${q.mora?` + ${usd(q.mora)} mora`:''})`}).join(', ')}</dd>`; }
  if(p.kind==='contado'){ const o=O(p.orderId); extra = `<dt>Pedido</dt><dd>${o.items.map(i=>`${i.qty} × ${esc(i.name)}`).join(', ')}</dd><dt>Entrega</dt><dd>${esc(S.cfg.envio[o.ship.method]?.n||'')}</dd>`; }
  const okL = p.kind==='contado'?'Verificar pago':p.kind==='inicial'?(u.verif==='pendiente'?'Aprobar crédito y verificar identidad':'Aprobar crédito'):'Verificar cuota';
  modal(`Revisar ${p.code}`, `
    ${short?`<div class="note warn small">El monto reportado equivale a ${usd(reportedUSD(p))} y se esperaban ${usd(p.expected)}. Faltan ${usd(-diff)}.</div>`:`<div class="note ok small">El monto reportado cubre el monto esperado.</div>`}
    <div class="rcpt"><div id="rc-img" class="muted small">${p.path?'Cargando comprobante…':'Sin imagen adjunta.'}</div>
      <dl class="dl"><dt>Cliente</dt><dd>${esc(u.name)}<div class="muted small">${esc(u.cedula)} · ${esc(u.phone)}</div></dd><dt>Concepto</dt><dd>${concept(p)}</dd>
        <dt>Método</dt><dd>${metN(p.method)}${p.bank?' · '+esc(p.bank):''}</dd><dt>Referencia</dt><dd>${esc(p.ref)}</dd><dt>Recibido</dt><dd>${fdt(p.created)}</dd>
        <dt>Esperado</dt><dd class="num">${usd(p.expected)}${p.currency==='Bs'?` · ${bs(r2(p.expected*(1+(p.recargo||0))*p.tasa))}`:''}</dd><dt>Reportado</dt><dd class="num">${amtTxt(p)}</dd>${p.currency==='Bs'?`<dt>Tasa usada</dt><dd>${bs(p.tasa)}</dd>`:''}${extra}</dl></div>
    <div class="field"><label for="rv-note">Motivo si rechazas</label><select id="rv-note"><option>La referencia no aparece en el banco</option><option>El monto recibido es incompleto</option><option>La imagen no es legible</option><option>El titular no coincide con el cliente</option>${p.kind==='inicial'?'<option>No pudimos verificar la identidad del cliente</option>':''}</select></div>`,
    `${p.kind==='inicial'?`<button class="btn danger" data-act="rejcredit" data-p="${p.id}">Rechazar crédito</button>`:''}<button class="btn danger" data-act="rejpay" data-p="${p.id}">Rechazar comprobante</button><button class="btn buy" data-act="approve" data-p="${p.id}">${short?okL+' de todos modos':okL}</button>`, true);
  if(p.path) sb.storage.from('comprobantes').createSignedUrl(p.path, 600).then(({data, error})=>{
    const el = $('#rc-img'); if(!el || M.id!==id) return;
    if(error || !data?.signedUrl){ el.textContent = 'No se pudo cargar el comprobante.'; return; }
    el.innerHTML = /\.pdf$/i.test(p.path) ? `<a class="btn" href="${esc(data.signedUrl)}" target="_blank" rel="noopener">Abrir PDF del comprobante</a>`
      : `<a href="${esc(data.signedUrl)}" target="_blank" rel="noopener"><img src="${esc(data.signedUrl)}" alt="Comprobante ${p.code}"></a>`;
  });
}
function shipModal(oid){
  const o = O(oid); const u = U(o.userId) || {}; M = {type:'ship', oid};
  modal(`Despachar ${o.code}`, `<dl class="dl"><dt>Cliente</dt><dd>${esc(u.name)} · ${esc(u.phone)}</dd><dt>Dirección</dt><dd>${esc(o.ship.addr)}, ${esc(o.ship.city)}</dd><dt>Productos</dt><dd>${o.items.map(i=>`${i.qty} × ${esc(i.name)}`).join(', ')}</dd></dl>
    <form id="shipf" class="fg" novalidate><div class="field"><label for="sh-cour">Transporte</label><select id="sh-cour">${o.ship.method==='local'?'<option>Delivery propio</option>':'<option>MRW</option><option>Zoom</option><option>Tealca</option><option>Domesa</option>'}</select></div>
    ${o.ship.method==='local'?`<div class="field"><label for="sh-guia">Quién lo lleva <span class="muted">(opcional)</span></label><input id="sh-guia" placeholder="Ej. Carlos · 0414-1234567"><span class="hint">El cliente lo verá en su pedido. Puedes dejarlo vacío.</span></div>`
      :`<div class="field"><label for="sh-guia">Número de guía</label><input id="sh-guia" placeholder="El que te da la empresa de envíos"></div>`}<div class="err" id="sh-err"></div></form>`,
    `<button class="btn" data-act="close">Cancelar</button><button class="btn brand" data-act="doship">Registrar despacho</button>`);
}
function estadoCuenta(uid){
  const u = U(uid) || {}, h = historial(uid);
  const cr = S.credits.filter(c=>c.userId===uid); const pays = S.payments.filter(p=>p.userId===uid);
  if(isAdmin() && !admCuo()){ const os = S.orders.filter(inAdm).filter(o=>o.userId===uid);
    return modal(`Compras · ${esc(u.name)}`, `
    <div class="muted small">${esc(u.cedula)} · ${esc(u.email)} · ${esc(u.phone)} · cliente desde ${fd(u.created)}</div>
    <div class="kpis"><div class="kpi"><div class="l">Pagado en total</div><div class="v num" style="font-size:19px">${usd(h.vol)}</div></div><div class="kpi"><div class="l">Pedidos</div><div class="v num" style="font-size:19px">${os.length}</div></div></div>
    <h3>Pedidos</h3>${os.length?`<div class="tbl"><table class="t"><thead><tr><th>Pedido</th><th>Fecha</th><th>Productos</th><th>Estado</th><th class="r">Total</th></tr></thead><tbody>${os.map(o=>`<tr><td class="nw">${o.code}</td><td class="nw">${fd(o.created)}</td><td>${o.items.map(i=>`${i.qty} × ${esc(i.name)}`).join('<br>')}</td><td>${tag(o.status)}</td><td class="r num nw">${usd(o.total)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Sin pedidos.</p>'}
    <h3>Pagos</h3>${pays.length?`<div class="tbl"><table class="t"><thead><tr><th>Fecha</th><th>Concepto</th><th>Estado</th><th class="r">Monto</th></tr></thead><tbody>${pays.map(p=>`<tr><td class="nw">${fd(p.created)}</td><td>${concept(p)}</td><td>${tag(p.status)}</td><td class="r num nw">${amtTxt(p)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Sin pagos.</p>'}`, '', true); }
  modal(`Estado de cuenta · ${esc(u.name)}`, `
    <div class="muted small">${esc(u.cedula)} · ${esc(u.email)} · ${esc(u.phone)} · cliente desde ${fd(u.created)}</div>
    <div class="kpis"><div class="kpi"><div class="l">Pagado en total</div><div class="v num" style="font-size:19px">${usd(h.vol)}</div></div><div class="kpi ${h.enMora?'alert':''}"><div class="l">Deuda</div><div class="v num" style="font-size:19px">${usd(h.deuda)}</div></div>
      <div class="kpi"><div class="l">Cuotas pagadas</div><div class="v num" style="font-size:19px">${h.pagadas}</div></div><div class="kpi"><div class="l">Cuotas con mora</div><div class="v num" style="font-size:19px">${h.moras}</div></div></div>
    <h3>Créditos</h3>${cr.length?`<div class="tbl"><table class="t"><thead><tr><th>Crédito</th><th>Estado</th><th>Pagadas</th><th class="r">Moras</th><th class="r">Saldo</th></tr></thead><tbody>${cr.map(c=>`<tr><td>${c.code}</td><td>${tag(c.status)}</td><td>${c.cuotas.filter(q=>q.status==='pagada').length} de ${c.n}</td><td class="r">${c.cuotas.filter(q=>q.moraAt).length}</td><td class="r num">${usd(saldo(c))}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Sin créditos.</p>'}
    <h3>Movimientos</h3>${pays.length?`<div class="tbl"><table class="t"><thead><tr><th>Fecha</th><th>Concepto</th><th>Estado</th><th class="r">Monto</th></tr></thead><tbody>${pays.map(p=>`<tr><td class="nw">${fd(p.created)}</td><td>${concept(p)}</td><td>${tag(p.status)}</td><td class="r num nw">${amtTxt(p)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Sin pagos.</p>'}`, '', true);
}
function confirmModal(title, text, act, data, okLabel){
  M = {type:'confirm'};
  modal(title, `<p>${text}</p>`, `<button class="btn" data-act="close">Volver</button><button class="btn danger" data-act="${act}" ${Object.entries(data).map(([k,v])=>`data-${k}="${v}"`).join(' ')}>${okLabel}</button>`);
}
function forgotModal(){
  M = {type:'forgot'};
  modal('Recuperar contraseña', `<p class="muted">Te enviaremos un enlace a tu correo para crear una contraseña nueva.</p>
    <div class="field"><label for="fg-email">Correo</label><input id="fg-email" type="email" value="${esc($('#l-email')?.value||'')}"></div><div class="err" id="fg-err"></div>`,
    `<button class="btn" data-act="close">Cancelar</button><button class="btn brand" data-act="dorecover">Enviar enlace</button>`);
}

/* ===================== navegación ===================== */
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>t.hidden=true, 4200); }
function go(v, id){
  const h = id!=null ? `${v}/${id}` : v;
  if(location.hash.slice(1) !== h) location.hash = h; else route();
}
function route(){
  const [v, id] = decodeURIComponent(location.hash.slice(1)).split('/');
  const prev = S.route;
  S.route = {v: v || 'inicio', id: id ? +id : undefined};
  if(S.route.v==='producto' && (prev.v!=='producto' || prev.id!==S.route.id)) S.pd = {color:0, storage:0, qty:1, acc:false};
  if(S.route.v==='encargo' && prev.v!=='encargo' && S.enc?.done) S.enc = null;
  closeModal(); render(); window.scrollTo(0,0);
}
function render(){
  if(!S.ready) return;
  const v = S.route.v;
  if(v==='login' && me()){ location.hash = isAdmin() ? 'admin' : 'cuenta'; return; }
  const view = {inicio:vInicio, catalogo:vCatalogo, producto:vProducto, carrito:vCarrito, checkout:vCheckout, login:()=>vLogin(S.after?'Inicia sesión para continuar.':''),
    cuenta:vCuenta, admin:vAdmin, financiamiento:vFinanciamiento, terminos:vTerminos, privacidad:vPrivacidad, 'nueva-clave':vNuevaClave, registro:vRegistro, trabaja:vTrabaja, encargo:vEncargo}[v];
  if(!view){ $('#app').className = ''; $('#app').innerHTML = vInicio(); renderChrome(); setHH(); storyStart(); homeFx(); return; }
  $('#app').className = v==='inicio' || !view ? '' : 'wrap';
  $('#app').innerHTML = view();
  renderChrome(); S.fab = false; renderFab();
  setHH();
  if($('#story')){ storyStart(); homeFx(); } else storyStop();
  document.querySelectorAll('label.so, label.ch').forEach(l=>l.classList.toggle('on', !!l.querySelector('input:checked')));
  // clientes con una versión anterior de los términos: se les pide aceptar la nueva (una vez por sesión)
  const u0 = me(); if(u0 && !isAdmin() && u0.legalV!==LEGAL_VERSION && !S.legalAsked && !['terminos','privacidad'].includes(v) && !$('#ov:not([hidden]) .modal')){ S.legalAsked = true; setTimeout(legalModal, 400); }
}
async function afterLogin(){
  const a = S.after; S.after = null; S.co = null; S.acct = 'resumen'; S.adm = 'resumen';
  if(isAdmin()) return go('admin');
  if(a) return go(a);
  go('cuenta');
}
function addToCart(pid, ci, si, qty, acc=false){
  const p = P(pid); acc = !!acc && p.acc!=null; const key = `${pid}-${ci}-${si}${acc?'-a':''}`;
  const inCart = sum(S.cart.filter(i=>i.pid===pid), i=>i.qty);
  if(inCart + qty > p.stock){ toast(`Solo hay ${p.stock} unidades disponibles de ${p.name}.`); return false; }
  const it = S.cart.find(i=>i.key===key);
  if(it) it.qty += qty; else S.cart.push({key, pid, ci, si, qty, name:p.name, color:p.colors[ci]?.n, storage:p.storages?p.storages[si].n:null, acc, unit:unitPrice(p,si,acc)});
  S.co = null; saveCart(); return true;
}
function syncCartPrices(){ // actualiza precios guardados en el carrito con los del catálogo
  S.cart.forEach(i=>{ const p=P(i.pid); if(p){ if(p.acc==null) i.acc = false; i.unit = unitPrice(p, i.si, i.acc); } });
  S.cart = S.cart.filter(i=>P(i.pid)); saveCart();
}

/* ===================== acciones con el servidor ===================== */
async function run(fn){
  if(S.busy) return;
  S.busy = true; document.body.classList.add('busy');
  try{ await fn(); }
  catch(e){ console.error(e); toast(friendly(e)); }
  finally{ S.busy = false; document.body.classList.remove('busy'); }
}
function friendly(e){
  const m = e?.message || String(e);
  if(/Failed to fetch|NetworkError|network/i.test(m)) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  if(/JWT|token/i.test(m)) return 'Tu sesión venció. Vuelve a iniciar sesión.';
  if(/email rate limit/i.test(m)) return 'En este momento no podemos enviar más correos. Espera unos minutos e inténtalo de nuevo, o escríbenos por WhatsApp.';
  if(/rate limit|too many/i.test(m)) return 'Hubo demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.';
  return m;
}
async function rpc(name, args){
  const {data, error} = await sb.rpc(name, args);
  if(error) throw error;
  return data;
}
async function uploadProof(file){
  if(!file) throw new Error('Adjunta la imagen o PDF del comprobante.');
  if(file.size > 5*1024*1024) throw new Error('El comprobante supera 5 MB.');
  if(!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) throw new Error('El comprobante debe ser JPG, PNG, WEBP o PDF.');
  const ext = file.type==='application/pdf' ? 'pdf' : file.type.split('/')[1].replace('jpeg','jpg');
  const path = `${S.session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const {error} = await sb.storage.from('comprobantes').upload(path, file, {contentType:file.type, upsert:false});
  if(error) throw new Error('No se pudo subir el comprobante: ' + error.message);
  return path;
}
async function placeOrder(){
  const co = S.co, k = coCalc(); co.err = '';
  const fail = m => { co.err = m; render(); };
  const items = cartOf(co.store);
  if(items.some(i=>i.qty > P(i.pid).stock)) return fail('Algunos productos ya no tienen suficiente existencia. Revisa tu carrito.');
  if((co.addr.trim().length<8 || co.city.trim().length<3)) return fail('Escribe la dirección de entrega y la ciudad.');
  if(co.mode==='financiado'){ const el = eligibility(k.financed, co.store); if(!el.ok) return fail(el.why.join(' ')); }
  if(!(S.termsOk||{})[co.store]) { termsModal(co.store); return; }
  let pago = null;
  if(co.when==='ahora'){
    const cur = METODOS[co.method].cur;
    const ref = co.ref.trim();
    if(cur==='Bs' ? !/^\d{6,}$/.test(ref) : !/^[A-Za-z0-9]{6,}$/.test(ref)) return fail(cur==='Bs' ? 'La referencia debe tener al menos 6 dígitos.' : 'El ID de la orden de Binance debe tener al menos 6 caracteres.');
    const amt = parseAmt(co.amount || (cur==='Bs' ? bsPrice(k.hoy, co.store) : k.hoy));
    if(!(amt>0)) return fail('Escribe el monto que pagaste.');
    if(!co.file) return fail('Adjunta la imagen o PDF del comprobante.');
    pago = {banco: cur==='Bs' ? co.bank : '', referencia: ref, monto_reportado: amt, comprobante_path: await uploadProof(co.file)};
  }
  const payload = { items: items.map(i=>({producto_id:i.pid, color_idx:i.ci, cap_idx:i.si, cantidad:i.qty, accesorios:!!i.acc})),
    modalidad: co.mode, n_cuotas: co.n, frecuencia: co.mode==='financiado' ? co.freq : null, acepta_terminos: true, inicial_pct: co.ini, envio_metodo: co.ship, direccion: co.addr, ciudad: co.city,
    metodo_pago: co.method, cupon: k.couponOk ? S.coupon : '', pago };
  try{
    const res = await rpc('crear_pedido', {p: payload});
    S.cart = S.cart.filter(i=>!items.includes(i)); saveCart(); S.coupon = ''; S.co = null; S.acct = 'pedidos';
    await refresh();
    const resto = cartStores();
    toast((pago ? `Pedido ${res.codigo} creado. ${ST(co.store).name} te avisará cuando verifique tu pago.` : co.method==='efectivo' ? `Pedido ${res.codigo} creado. ${ST(co.store).name} te escribirá para coordinar el pago en efectivo.` : `Pedido ${res.codigo} reservado por ${S.cfg.reservaHoras} horas.`) + (resto.length ? ` Aún tienes productos de ${ST(resto[0]).name} en el carrito.` : ''));
    go('cuenta');
  }catch(e){ fail(friendly(e)); }
}
async function submitPay(){
  const err = $('#pm-err'); const cur = METODOS[M.method].cur; const bank = cur==='Bs' ? $('#pm-bank').value : '';
  const ref = $('#pm-ref').value.trim();
  if(cur==='Bs' ? !/^\d{6,}$/.test(ref) : !/^[A-Za-z0-9]{6,}$/.test(ref)){ err.textContent = cur==='Bs' ? 'La referencia debe tener al menos 6 dígitos.' : 'El ID de la orden de Binance debe tener al menos 6 caracteres.'; return; }
  const amt = parseAmt($('#pm-amt').value); if(!(amt>0)){ err.textContent = 'Escribe el monto que pagaste.'; return; }
  const file = $('#pm-file').files[0]; if(!file){ err.textContent = 'Adjunta la imagen o PDF del comprobante.'; return; }
  try{
    const path = await uploadProof(file);
    const base = {metodo:M.method, banco:bank, referencia:ref, monto_reportado:amt, comprobante_path:path};
    await rpc('enviar_comprobante', {p: M.kind==='cuota' ? {tipo:'cuotas', credito_id:M.creditId, cantidad_cuotas:M.count, ...base} : {tipo:'pedido', pedido_id:M.orderId, ...base}});
    closeModal(); await refresh(); toast('Comprobante enviado. Te avisaremos cuando lo verifiquemos.');
  }catch(e){ err.textContent = friendly(e); }
}

const ACT = {
  ffin: d => { S.f.fin = d.v; render(); },
  homefin: d => { S.homeFin = d.v; render(); },
  tienda: d => { S.f = {store:+d.v, cat:null, brands:[], max:'', fin:'', stock:false, sort:'rel', q:''}; go('catalogo'); render(); },
  prodnew: () => productModal(null),
  prodedit: d => productModal(+d.id),
  prodsave: () => run(saveProduct),
  goverif: () => { S.after = 'checkout'; S.acct = 'verificacion'; go('cuenta'); render(); },
  doregister: () => run(doRegister),
  dokyc: () => run(async()=>{ const k = S.kyc; k.err = kycErrors(); if(k.err) return render();
    try{ await sendKyc(); await refresh(); toast('Listo, recibimos tus documentos.'); if(S.after==='checkout'){ S.after=null; S.co && (S.co.mode='financiado'); go('checkout'); } }
    catch(e){ k.err = friendly(e); render(); } }),
  geoloc: () => { const k = kycInit(me());
    if(!navigator.geolocation){ k.locSkip = true; k.locMsg = 'Tu navegador no permite compartir la ubicación. Revisaremos tu dirección manualmente.'; return render(); }
    k.locMsg = 'Buscando tu ubicación…'; render();
    navigator.geolocation.getCurrentPosition(pos=>{ k.lat = +pos.coords.latitude.toFixed(6); k.lng = +pos.coords.longitude.toFixed(6); k.acc = pos.coords.accuracy; k.locMsg=''; k.locSkip=false; render(); },
      err=>{ if(err.code===1){ k.locSkip=false; k.locMsg='Diste “no permitir”. Activa el permiso de ubicación para este sitio en tu navegador y vuelve a pulsar el botón.'; }
             else { k.locSkip=true; k.locMsg='No pudimos obtener tu ubicación. Puedes continuar; revisaremos tu dirección manualmente.'; } render(); },
      {enableHighAccuracy:true, timeout:15000, maximumAge:60000}); },
  dopostular: () => run(doPostular),
  doencargo: () => run(doEncargo),
  encnew: () => { const t = S.enc?.tienda; S.enc = null; vEncargo(); if(t) S.enc.tienda = t; render(); },
  encargar: d => { const p = d.id ? P(+d.id) : null; S.enc = null; go('encargo'); vEncargo();
    if(p) Object.assign(S.enc, {tienda:String(p.store), marca:p.brand, modelo:p.name.replace(new RegExp('^'+p.brand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+','i'),''), capacidad:p.storages?p.storages[S.pd.storage||0]?.n||'':'', color:p.colors[S.pd.color||0]?.n||''});
    else if(d.q) S.enc.modelo = d.q;
    render(); },
  encedit: d => encModal(+d.id),
  encsave: () => run(async()=>{ await rpc('actualizar_encargo', {pid:M.id, p_estado:$('#en-est').value, p_nota:$('#en-nota').value}); closeModal(); await refresh(); toast('Encargo actualizado.'); }),
  cliente: d => clienteModal(d.u),
  clirev: d => run(async()=>{ await rpc('revisar_cliente', {p_usuario:d.u, p_estado:d.v, p_nota: d.v==='rechazado' ? $('#cv-nota')?.value : null}); closeModal(); await refresh(); toast(d.v==='verificado'?'Identidad verificada.':'Verificación rechazada. El cliente fue notificado.'); }),
  post: d => postModal(+d.p),
  savepost: () => run(async()=>{ await rpc('actualizar_postulacion', {pid:M.id, p_estado:$('#ps-est').value, p_nota:$('#ps-nota').value}); closeModal(); await refresh(); toast('Postulación actualizada.'); }),
  finswitch: d => run(async()=>{ await rpc('cambiar_financiable', {pid:+d.id, valor:d.v==='1'}); await refresh(); toast('Forma de pago actualizada.'); }),
  go: d => go(d.v),
  topost: () => $('#postform')?.scrollIntoView({behavior:'smooth'}),
  reload: () => run(async()=>{ await refresh(); toast('Datos actualizados.'); }),
  cat: d => { S.f = {store:null, cat:d.v||null, brands:[], max:'', fin:'', stock:false, sort:'rel', q:''}; go('catalogo'); render(); },
  clearf: () => { S.f = {store:S.f.store, cat:S.f.cat, brands:[], max:'', fin:'', stock:false, sort:'rel', q:''}; render(); },
  pd: d => go('producto', +d.id),
  pcolor: d => { S.pd.color = +d.i; render(); },
  pstor: d => { S.pd.storage = +d.i; render(); },
  pqty: d => { const p = P(S.route.id); S.pd.qty = Math.max(1, Math.min(p.stock, S.pd.qty + +d.d)); render(); },
  add: d => { const pid=+d.id; const onPd = S.route.v==='producto' && S.route.id===pid;
    if(addToCart(pid, onPd?S.pd.color:0, onPd?S.pd.storage:0, onPd?S.pd.qty:1, onPd&&S.pd.acc)){ renderChrome(); toast(`${P(pid).name} agregado al carrito.`); } },
  buynow: d => { if(addToCart(+d.id, S.pd.color, S.pd.storage, S.pd.qty, S.pd.acc)) go('carrito'); },
  pacc: d => { S.pd.acc = d.v==='1'; render(); },
  buyfin: d => { const p = P(+d.id); if(addToCart(+d.id, S.pd.color, S.pd.storage, S.pd.qty, S.pd.acc)){ S.co = null; S.coStore = p.store; S.coMode = 'financiado'; go('checkout'); } },
  fabwa: () => { S.fab = !S.fab; renderFab(); },
  cqty: d => { const it = S.cart[+d.i]; const p = P(it.pid); const n = it.qty + +d.d;
    if(n > it.qty && sum(S.cart.filter(i=>i.pid===it.pid),i=>i.qty) >= p.stock){ toast(`Solo hay ${p.stock} unidades disponibles.`); return; }
    it.qty = n; if(it.qty<=0) S.cart.splice(+d.i,1); S.co=null; saveCart(); render(); },
  crem: d => { S.cart.splice(+d.i,1); S.co=null; saveCart(); render(); },
  tocheckout: d => { S.coStore = +d.s || cartStores()[0]; S.co = null; if(!me()) S.after = 'checkout'; go('checkout'); render(); },
  logout: () => run(async()=>{ await sb.auth.signOut(); S.session=null; S.co=null; S.acct='resumen'; S.adm='resumen'; await loadPrivate(); toast('Sesión cerrada.'); go('inicio'); }),
  acct: d => { if(!me()){ S.after='cuenta'; return go('login'); } if(isAdmin()) return go('admin'); S.acct = d.v; go('cuenta'); render(); },
  adm: d => { S.adm = d.v; render(); },
  admf: d => { S.admF[d.g] = d.v; render(); },
  close: () => closeModal(),
  toggleplan: () => { S.co.showPlan = !S.co.showPlan; render(); },
  forgot: () => forgotModal(),
  dorecover: () => run(async()=>{ const em = $('#fg-email').value.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(em)){ $('#fg-err').textContent='Escribe un correo válido.'; return; }
    const {error} = await sb.auth.resetPasswordForEmail(em, {redirectTo: location.origin + location.pathname});
    if(error){ $('#fg-err').textContent = friendly(error); return; }
    closeModal(); toast('Si el correo está registrado, recibirás un enlace en unos minutos.'); }),
  placeorder: () => run(placeOrder),
  payorder: d => { const o = O(+d.o); const c = o.creditId ? C(o.creditId) : null;
    payModal({title: c?`Inicial del pedido ${o.code}`:`Pago del pedido ${o.code}`, desc: c?`Inicial de ${usd(c.down)} más envío de ${usd(o.shipCost)} para el crédito ${c.code}.`:`Total del pedido: ${usd(o.total)}.`,
      amount: c?r2(c.down+o.shipCost):o.total, kind:'pedido', orderId:o.id, method:o.method, store:o.store}); },
  paycuotas: d => { const c = C(+d.c); const qs = pendingCuotas(c).slice(0, +d.k); const amt = r2(sum(qs, cuotaDue));
    payModal({title: qs.length===1?`Cuota ${qs[0].n} de ${c.n}`:`Liquidar crédito ${c.code}`, desc: qs.map(q=>`Cuota ${q.n}: ${usd(q.amount)}${q.mora?` + ${usd(q.mora)} de mora`:''}`).join(' · '), amount:amt, kind:'cuota', creditId:c.id, count:qs.length, store:c.store}); },
  submitpay: () => run(submitPay),
  cancelask: d => confirmModal(`Cancelar ${O(+d.o).code}`, 'Se liberará la reserva de los productos. Esta acción no se puede deshacer.', 'docancel', {o:d.o}, 'Cancelar pedido'),
  docancel: d => run(async()=>{ await rpc('cancelar_mi_pedido', {pid:+d.o}); closeModal(); await refresh(); toast('Pedido cancelado.'); }),
  review: d => reviewModal(+d.p),
  approve: d => run(async()=>{ const msg = await rpc('aprobar_pago', {pid:+d.p}); closeModal(); await refresh(); toast(msg); }),
  rejpay: d => run(async()=>{ const msg = await rpc('rechazar_pago', {pid:+d.p, nota:$('#rv-note').value}); closeModal(); await refresh(); toast(msg); }),
  rejcredit: d => run(async()=>{ const msg = await rpc('rechazar_credito', {pid:+d.p, nota:$('#rv-note').value}); closeModal(); await refresh(); toast(msg); }),
  condonar: d => run(async()=>{ await rpc('condonar_mora', {p_cuota:+d.q}); await refresh(); toast('Mora condonada.'); }),
  cajacuota: d => run(async()=>{ const msg = await rpc('pago_en_caja', {p_cuota:+d.q}); await refresh(); toast(msg); }),
  cajaorder: d => run(async()=>{ const msg = await rpc('pago_en_caja', {p_pedido:+d.o}); await refresh(); toast(msg); }),
  ship: d => shipModal(+d.o),
  doship: () => run(async()=>{ const g=$('#sh-guia').value.trim(), local = $('#sh-cour').value==='Delivery propio'; if(!local && g.length<4){ $('#sh-err').textContent='Escribe el número de guía que te dio la empresa de envíos.'; return; }
    await rpc('despachar_pedido', {pid:M.oid, p_transporte:$('#sh-cour').value, p_guia:g}); closeModal(); await refresh(); toast('Pedido despachado.'); }),
  deliver: d => run(async()=>{ await rpc('entregar_pedido', {pid:+d.o}); await refresh(); toast('Pedido marcado como entregado.'); }),
  stock: d => run(async()=>{ await rpc('ajustar_stock', {pid:+d.id, delta:+d.d}); await refresh(); }),
  cierre: () => run(async()=>{ const r = await rpc('ejecutar_cierre'); await refresh(); toast(`Cierre ejecutado: ${r.moras} mora(s), ${r.canceladas} reserva(s) cancelada(s), ${r.recordatorios} recordatorio(s).`); }),
  edo: d => estadoCuenta(d.u),
  contrato: d => contratoModal(+d.c),
  contratoprint: () => { try{ window.print(); }catch(e){ toast('No se pudo abrir la impresión. Usa Ctrl+P.'); } },
  contratook: () => run(async()=>{
    const err = $('#ct-err'); const v = id => $(id).value.trim();
    const k = {imei1:v('#ct-i1'), imei2:v('#ct-i2'), modelo:v('#ct-mod'), color:v('#ct-col'), capacidad:v('#ct-cap'), bateria:v('#ct-bat'), piezas:v('#ct-pz')};
    if(!/^\d{15}$/.test(k.imei1)){ err.textContent = 'El IMEI 1 debe tener 15 dígitos (márcalo *#06# en el teléfono).'; return; }
    if(k.imei2 && !/^\d{15}$/.test(k.imei2)){ err.textContent = 'El IMEI 2 debe tener 15 dígitos.'; return; }
    if(!k.modelo){ err.textContent = 'Escribe el equipo.'; return; }
    const c = C(M.id);
    try{ await rpc('guardar_contrato', {p_credito:c.id, p:k}); c.contrato = k; }
    catch(e){ if(!/Vista previa/.test(friendly(e))){ err.textContent = friendly(e); return; } }
    if(!ST(c.store).rep) toast('Falta el nombre del representante en Configuración: el contrato sale con la línea en blanco.');
    imprimirContrato(c, k);
  }),
  termsok: () => { S.termsOk = Object.assign(S.termsOk||{}, {[M.store]:true}); closeModal(); render(); },
  termsno: () => { closeModal(); go('carrito'); },
  legal: d => { const go2 = () => { const el = document.getElementById('lg-'+d.s); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); };
    if(S.route.v!==d.v){ go(d.v); setTimeout(go2, 120); } else go2(); },
  legalgo: d => { closeModal(); S.legalAsked = true; go(d.v); },
  legalok: () => run(async()=>{ await rpc('aceptar_legal', {p_version:LEGAL_VERSION}); closeModal(); await refresh(); toast('Gracias. Términos aceptados.'); }),
  termsver: () => termsModal(S.co.store),
  planadd: () => { $('#planes').insertAdjacentHTML('beforeend', planRow(null, null)); $('#planes .planrow:last-child [data-pn]').focus(); },
  plandel: (d, b) => b.closest('.planrow').remove(),
};

/* ===================== eventos ===================== */
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-act]'); if(!b) return;
  if(b.getAttribute('type')==='submit') return;
  e.preventDefault(); ACT[b.dataset.act]?.(b.dataset, b);
});
$('#ov').addEventListener('click', e=>{ if(e.target.id==='ov') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !$('#ov').hidden) closeModal(); });
document.addEventListener('input', e=>{
  const t = e.target;
  if(t.dataset.digits){ const v = onlyDigits(t.value).slice(0, +t.dataset.digits); if(v!==t.value) t.value = v; }
  if(t.dataset.e && S.enc){ S.enc[t.dataset.e] = t.value; }
  if(t.dataset.k){ const o = S.route.v==='trabaja' ? S.post : kycInit(me()); if(o){ o[t.dataset.k] = t.type==='checkbox' ? t.checked : t.value; } }
  if(t.dataset.q && S.post && t.type!=='radio'){ S.post.r[t.dataset.q] = t.value; }
  const k = t.dataset.in; if(k && S.co){ S.co[k] = t.value; }
  if(t.closest && t.closest('#prodf')) prodSim();
  if(e.target.id==='co-ini' && S.co){ const v=+e.target.value; const base = coCalc().base; $('#ini-l').textContent = `${v}% · ${usd(r2(base*v/100))}`; }
});
document.addEventListener('change', async e=>{
  const t = e.target;
  if(t.type==='file' && t.closest && t.closest('.filebtn')){ const f = t.files[0]; const fn = t.closest('.filebtn').querySelector('.fn'); fn.textContent = f ? '✓ ' + f.name : 'Ningún archivo elegido'; fn.classList.toggle('ok', !!f); }
  if(t.closest && t.closest('#prodf') && (t.type==='checkbox' || t.tagName==='SELECT')) prodSim();
  if(t.dataset.e && S.enc){ S.enc[t.dataset.e] = t.value; if(t.type==='radio') render(); return; }
  if(t.dataset.k){ const o = S.route.v==='trabaja' ? S.post : kycInit(me()); if(o){ o[t.dataset.k] = t.type==='checkbox' ? t.checked : t.value; if(t.tagName==='SELECT' || t.type==='checkbox' || t.type==='date' || t.type==='radio') render(); } return; }
  if(t.dataset.q && S.post){ S.post.r[t.dataset.q] = t.value; if(t.type==='radio') render(); return; }
  if(t.dataset.photo){ const f = t.files[0]; if(!f) return; const k = kycInit(me()), key = t.dataset.photo;
    try{ const blob = await compressImg(f); if(k[key+'Url']) URL.revokeObjectURL(k[key+'Url']); k[key] = blob; k[key+'Url'] = URL.createObjectURL(blob); k.err=''; }
    catch(err){ k.err = friendly(err); } render(); return; }
  const on = t.dataset.on; if(!on) return;
  const f = S.f;
  if(on==='fcat'){ f.cat = t.value||null; f.brands=[]; }
  if(on==='fstore'){ f.store = t.value ? +t.value : null; f.brands=[]; }
  if(on==='admstore'){ S.admStore = +t.value; S.cfgStore = 0; }
  if(on==='cfgstore'){ S.cfgStore = +t.value; S.logoFile = null; }
  if(on==='prodimg'){ M.file = t.files[0] || null; if(M.file){ const u = URL.createObjectURL(M.file); $('#pf-prev').innerHTML = `<img src="${u}" alt="" style="width:100%;height:100%;object-fit:contain">`; } return; }
  if(on==='logoimg'){ S.logoFile = t.files[0] || null; if(S.logoFile){ $('#tf-logo').innerHTML = `<img class="smark" src="${URL.createObjectURL(S.logoFile)}" alt="" style="height:64px">`; } return; }
  if(on==='fbrand'){ f.brands = t.checked ? [...f.brands, t.value] : f.brands.filter(b=>b!==t.value); }
  if(on==='fgama') f.gama = t.value;
  if(on==='fstock') f.stock = t.checked;
  if(on==='fsort') f.sort = t.value;
  if(on==='ship') S.co.ship = t.value;
  if(on==='mode') S.co.mode = t.value;
  if(on==='plan') S.co.n = +t.value;
  if(on==='frq'){ S.co.freq = t.value; }
  if(on==='ini') S.co.ini = +t.value/100;
  if(on==='method'){ S.co.method = t.value; S.co.amount=''; }
  if(on==='later') S.co.later = t.checked;
  if(on==='terms'){ S.co.terms = t.checked; S.co.err = ''; }
  if(on==='file'){ S.co.file = t.files[0] || null; }
  if(on==='simamt') S.sim.amt = Math.max(0, parseAmt(t.value)||0);
  if(on==='simn') S.sim.n = +t.value;
  if(on==='simini') S.sim.ini = +t.value;
  if(on==='pmmet'){ M.method = t.value; payModal(M); return; }
  if(S.co) S.co.err = '';
  render();
});
document.addEventListener('submit', e=>{
  e.preventDefault(); const id = e.target.id;
  if(id==='searchf'){ const qv=$('#q').value; S.f = {store:null, cat:null, brands:[], max:'', fin:'', stock:false, sort:'rel', q:qv}; go('catalogo'); render(); }
  if(id==='couponf'){ S.coupon = $('#cp').value.trim().toUpperCase(); S.co=null; render(); }
  if(id==='loginf') run(async()=>{
    const em=$('#l-email').value.trim().toLowerCase(), pw=$('#l-pass').value, er=$('#l-err');
    if(!em || !pw){ er.textContent='Escribe tu correo y contraseña.'; return; }
    const {data, error} = await sb.auth.signInWithPassword({email:em, password:pw});
    if(error){ er.textContent = /Invalid login/i.test(error.message) ? 'Correo o contraseña incorrectos.' : /not confirmed/i.test(error.message) ? 'Confirma tu correo con el enlace que te enviamos antes de ingresar.' : friendly(error); return; }
    S.session = data.session; await loadPrivate();
    toast(`Bienvenido, ${me()?.name.split(' ')[0] || ''}.`); afterLogin();
  });
  if(id==='newpassf') run(async()=>{
    const pw=$('#np-pass').value, er=$('#np-err');
    if(pw.length<8 || !/\d/.test(pw)) return er.textContent='La contraseña debe tener al menos 8 caracteres y un número.';
    const {error} = await sb.auth.updateUser({password:pw});
    if(error){ er.textContent = friendly(error); return; }
    toast('Contraseña actualizada.'); await refresh(); afterLogin();
  });
  if(id==='dataf') run(async()=>{ if(!telOk($('#d-tel').value)) return toast('El teléfono debe tener 11 números, por ejemplo 04141234567.'); await rpc('actualizar_mis_datos', {p_telefono:$('#d-tel').value, p_direccion:$('#d-addr').value, p_ciudad:$('#d-city').value}); await refresh(); toast('Datos actualizados.'); });
  if(id==='cfgf') run(async()=>{
    const n = x => parseAmt($('#'+x).value);
    const planes = {}; let bad = '';
    document.querySelectorAll('#planes .planrow').forEach(r=>{ const nv = r.querySelector('[data-pn]').value.trim(), pv = r.querySelector('[data-pr]').value.trim();
      if(!nv && !pv) return; const nn = +nv; if(!(Number.isInteger(nn) && nn>=1 && nn<=52)) bad = 'El número de cuotas debe estar entre 1 y 52.';
      else if(planes[nn]!==undefined) bad = `El plan de ${nn} cuotas está repetido.`; planes[nn] = r2(parseAmt(pv||'0')/100); });
    if(bad){ $('#c-err').textContent = bad; return; }
    const v = {mora:n('c-mora'), inicial_min:r2(n('c-ini')/100), min_financiable:n('c-min'), cupo_base:n('c-cupo')}; if($('#planes')) v.planes = planes;
    if(!(v.mora>=0) || !(v.inicial_min>=0 && v.inicial_min<=0.9) || !(v.min_financiable>=0) || !(v.cupo_base>=0) || Object.values(planes).some(x=>!(x>=0&&x<=1))){
      $('#c-err').textContent='Revisa los valores: deben ser números válidos y los porcentajes entre 0 y 100.'; return; }
    await rpc('actualizar_config', {p:v}); await refresh(); toast('Reglas de financiamiento guardadas.');
  });
  if(id==='tasaf') run(async()=>{
    const sid = +e.target.dataset.id, tasa = parseAmt($('#t-tasa').value), rec = parseAmt($('#t-rbs').value||'0');
    if(!(tasa>0)){ $('#t-err').textContent = 'Escribe la tasa: cuántos bolívares vale un dólar.'; return; }
    if(!(rec>=0 && rec<=100)){ $('#t-err').textContent = 'El ajuste debe estar entre 0 y 100%.'; return; }
    await rpc('actualizar_tasa', {p_tasa:tasa, p_recargo:r2(rec/100), p_tienda:sid}); await refresh(); toast('Tasa publicada.');
  });
  if(id==='tiendaf') run(async()=>{
    const f = e.target, sid = +f.dataset.id, t = ST(sid), err = $('#tf-err'); err.textContent = '';
    const nom = $('#tf-nom').value.trim(); if(nom.length<2){ err.textContent = 'Escribe el nombre de la tienda.'; return; }
    const wa = onlyDigits($('#tf-wa').value); if(wa && !/^58\d{10}$/.test(wa)){ err.textContent = 'El WhatsApp debe empezar por 58 y tener 12 números, ej. 584141234567.'; return; }
    const datos = {}; f.querySelectorAll('[data-dp]').forEach(i=>datos[i.dataset.dp] = i.value.trim());
    const frases = [0,1].map(i=>({k:nom, t:$('#tf-ft'+i).value.trim(), p:$('#tf-fp'+i).value.trim()})).filter(x=>x.t||x.p);
    let logo = t.logo; if(S.logoFile){ logo = await uploadPublic(await compressImg(S.logoFile, 600), 'logos'); }
    await rpc('actualizar_tienda', {p:{id:sid, nombre:nom, eslogan:$('#tf-esl').value.trim(), frases, logo_url:logo, whatsapp:wa, correo:$('#tf-cor').value.trim(), rif:$('#tf-rif').value.trim(), representante:$('#tf-rep').value.trim(), rep_cedula:$('#tf-repc').value.trim(), garantia_cubre:$('#tf-gc').value.trim(), garantia_excluye:$('#tf-ge').value.trim(), direccion:'', horario:$('#tf-hor').value.trim(), datos_pago:datos}});
    S.logoFile = null; await refresh(); toast('Datos de la tienda guardados.');
  });
});
window.addEventListener('hashchange', route);

/* ===================== inicio ===================== */
async function init(){
  const url = T.supabaseUrl || '', key = T.supabaseAnonKey || '';
  if(!/^https:\/\/.+/.test(url) || !key || /PEGA_AQUI/.test(url + key)){
    $('#app').innerHTML = `<div class="setup"><h2>Falta conectar la tienda</h2><p>Abre el archivo <code>config.js</code> y pega la <b>Project URL</b> y la <b>anon key</b> de tu proyecto de Supabase. Luego vuelve a subir los archivos.</p></div>`;
    return;
  }
  if(!window.supabase?.createClient){ $('#app').innerHTML = `<div class="setup"><h2>No se pudo cargar la tienda</h2><p>Revisa tu conexión a internet y recarga la página.</p></div>`; return; }
  // Enlaces de Supabase (confirmación de correo, recuperar contraseña) llegan en el hash
  const h0 = location.hash;
  const recovering = /type=recovery/.test(h0);
  const authErr = /error_description=([^&]+)/.exec(h0);
  sb = window.supabase.createClient(url, key);
  try{
    const {data} = await sb.auth.getSession();
    S.session = data.session || null;
    await Promise.all([loadPublic(), loadPrivate()]);
    syncCartPrices();
  }catch(e){
    console.error(e);
    $('#app').innerHTML = `<div class="setup"><h2>No se pudo conectar con la base de datos</h2><p>${esc(friendly(e))}</p><p class="muted small">Verifica los datos de config.js y que hayas ejecutado los archivos SQL en Supabase.</p></div>`;
    return;
  }
  S.ready = true;
  sb.auth.onAuthStateChange((event, session)=>{
    setTimeout(async()=>{
      if(event==='PASSWORD_RECOVERY'){ S.session = session; await loadPrivate(); go('nueva-clave'); return; }
      const changed = (session?.user?.id || null) !== (S.session?.user?.id || null);
      S.session = session;
      if(changed){ await loadPrivate(); render(); }
    }, 0);
  });
  if(authErr){ toast(decodeURIComponent(authErr[1].replace(/\+/g,' '))); }
  if(recovering && S.session){ history.replaceState(null, '', location.pathname); go('nueva-clave'); return; }
  if(/access_token|error=/.test(location.hash)) history.replaceState(null, '', location.pathname + '#inicio');
  route();
}
init();
