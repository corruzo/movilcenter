/* =====================================================================
   MovilCenter · Tienda en línea conectada a Supabase
   No necesitas editar este archivo: la configuración está en config.js
   ===================================================================== */
'use strict';
const T = window.TIENDA || {};
const BRAND = Object.assign({a:'Movil', b:'Center', legal:'MovilCenter C.A.', rif:'J-00000000-0', ciudad:'Caracas', whatsapp:'', correo:'', horario:'', logo:''}, T.marca || {});

/* ===================== utilidades ===================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2 = n => Math.round((+n + Number.EPSILON) * 100) / 100;
const usd = n => '$' + Number(n || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const bs = n => 'Bs. ' + Number(n || 0).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2});
const addMonths = (d,n) => { const x = new Date(d); x.setMonth(x.getMonth()+n); return x; };
const dayStart = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const days = (a,b) => Math.round((dayStart(b) - dayStart(a)) / 864e5);
const fd = d => d ? new Date(d).toLocaleDateString('es-VE',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fdt = d => d ? new Date(d).toLocaleString('es-VE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
const dateOnly = s => s ? new Date(String(s).slice(0,10) + 'T12:00:00') : null;
const sum = (a,f) => a.reduce((s,x)=>s+(+f(x)||0),0);
const parseAmt = s => { s = String(s ?? '').trim().replace(/\s/g,''); if(/,\d{1,2}$/.test(s)) s = s.replace(/\./g,'').replace(',','.'); else s = s.replace(/,/g,''); return +s; };
const ICO = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  cart:'<path d="M3 4h2l2.4 11h11l2-8H6.2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
  bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
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
const CATS = ['Teléfonos','Tablets','Smartwatch','Audio','Accesorios'];
const METODOS = {
  pago_movil:{n:'Pago móvil', cur:'Bs'}, transferencia:{n:'Transferencia bancaria', cur:'Bs'},
  zelle:{n:'Zelle', cur:'USD'}, efectivo:{n:'Efectivo en tienda', cur:'USD'},
};
const BANKS = ['Banesco','Mercantil','Provincial','Banco de Venezuela','BNC','Bancamiga','Bancaribe','Banco del Tesoro','Banplus','Exterior','Otro'];
const PED = {pendiente_pago:'Pendiente de pago', pago_en_revision:'Pago en revisión', credito_en_evaluacion:'Crédito en evaluación', pago_rechazado:'Pago rechazado',
  preparando:'Preparando', listo_retiro:'Listo para retiro', enviado:'Enviado', entregado:'Entregado', cancelado:'Cancelado'};
const CRE = {evaluacion:'En evaluación', activo:'Activo', en_mora:'En mora', liquidado:'Liquidado', rechazado:'Rechazado', cancelado:'Cancelado'};

/* ===================== estado ===================== */
const S = {
  today: new Date(), cfg:null, products:[], session:null, me:null,
  users:[], orders:[], credits:[], payments:[], notifs:[], audit:[], cupo:null,
  cart: loadCart(), coupon:'', route:{v:'inicio'}, after:null,
  f:{cat:null, brands:[], max:'', fin:false, stock:false, sort:'rel', q:''},
  pd:{color:0, storage:0, qty:1}, sim:null,
  co:null, acct:'resumen', adm:'resumen', admF:{pagos:'todos', cred:'todos', ped:'activos'},
  busy:false, ready:false,
};
let sb = null;
const P = id => S.products.find(p=>p.id===id);
const U = id => S.users.find(u=>u.id===id);
const O = id => S.orders.find(o=>o.id===id);
const C = id => S.credits.find(c=>c.id===id);
const me = () => S.me;
const isAdmin = () => S.me?.role==='admin';
const unitPrice = (p, si=0) => p.price + (p.storages && p.storages[si] ? +p.storages[si].d || 0 : 0);

function loadCart(){ try{ const c = JSON.parse(localStorage.getItem('carrito') || '[]'); return Array.isArray(c) ? c : []; }catch(e){ return []; } }
function saveCart(){ try{ localStorage.setItem('carrito', JSON.stringify(S.cart)); }catch(e){} }

/* ===================== conversión de datos ===================== */
function mapCfg(c){
  return { tasa:+c.tasa, mora:+c.mora, inicialMin:+c.inicial_min, inicialMax:+c.inicial_max, minFin:+c.min_financiable,
    plans:Object.fromEntries(Object.entries(c.planes).map(([k,v])=>[k,+v])), reservaHoras:c.reserva_horas,
    cupoBase:+c.cupo_base, cupoPorLiq:+c.cupo_por_liquidado, cupoMax:+c.cupo_max, maxCreditos:c.max_creditos,
    envio:Object.fromEntries(Object.entries(c.envio).map(([k,v])=>[k,{n:v.nombre, c:+v.costo, d:v.detalle}])),
    envioGratis:+c.envio_gratis_desde, cupon:{code:c.cupon_codigo||'', pct:+c.cupon_pct}, datosPago:c.datos_pago||{} };
}
function mapProduct(p){
  return { id:p.id, brand:p.marca, name:p.nombre, cat:p.categoria, shape:p.forma, price:+p.precio, stock:p.stock,
    colors:(p.colores && p.colores.length ? p.colores : [{n:'Único', hex:'#777'}]), storages:(p.capacidades && p.capacidades.length ? p.capacidades : null),
    specs:p.specs||{}, desc:p.descripcion||'', wall:p.pantalla, img:p.imagen_url||'', active:p.activo };
}
function mapUser(u){ return {id:u.id, name:u.nombre, cedula:u.cedula, phone:u.telefono||'', email:u.email||'', addr:u.direccion||'', city:u.ciudad||'', role:u.rol, created:new Date(u.creado_en)}; }

/* ===================== carga de datos ===================== */
async function q(table, order){
  let qb = sb.from(table).select('*');
  if(order) qb = qb.order(order[0], {ascending: order[1] !== false});
  const {data, error} = await qb;
  if(error) throw error;
  return data || [];
}
async function loadPublic(){
  const [prods, cfg] = await Promise.all([q('productos', ['orden']), q('configuracion')]);
  S.products = prods.map(mapProduct);
  if(!cfg[0]) throw new Error('No se encontró la configuración. ¿Ejecutaste el archivo 01_esquema.sql en Supabase?');
  S.cfg = mapCfg(cfg[0]);
}
async function loadPrivate(){
  S.users=[]; S.orders=[]; S.credits=[]; S.payments=[]; S.notifs=[]; S.audit=[]; S.cupo=null; S.me=null;
  if(!S.session) return;
  const uid = S.session.user.id;
  const [pf, pe, it, cr, cu, pa, pc, no] = await Promise.all([q('perfiles'), q('pedidos',['id',false]), q('pedido_items'), q('creditos',['id',false]),
    q('cuotas',['numero']), q('pagos',['id',false]), q('pago_cuotas'), q('notificaciones',['id',false])]);
  S.users = pf.map(mapUser);
  S.me = S.users.find(u=>u.id===uid) || null;
  if(!S.me){ toast('Tu cuenta no tiene perfil. Escribe a la tienda para revisarlo.'); return; }
  S.orders = pe.map(o=>({ id:o.id, code:o.codigo, userId:o.usuario_id, mode:o.modalidad, method:o.metodo_pago,
    ship:{method:o.envio_metodo, addr:o.direccion, city:o.ciudad}, subtotal:+o.subtotal, discount:+o.descuento, shipCost:+o.envio_costo, total:+o.total,
    st:o.estado, status:PED[o.estado]||o.estado, created:new Date(o.creado_en), deadline:o.reservado_hasta?new Date(o.reservado_hasta):null,
    tracking:o.guia, courier:o.transporte, cancelReason:o.motivo_cancelacion, creditId:null,
    items: it.filter(i=>i.pedido_id===o.id).map(i=>({pid:i.producto_id, name:i.nombre, color:i.color, ci:i.color_idx, storage:i.capacidad, si:i.cap_idx, qty:i.cantidad, unit:+i.precio_unitario})) }));
  const cuotaById = {};
  S.credits = cr.map(c=>{
    const cuotas = cu.filter(x=>x.credito_id===c.id).map(x=>{ const q={id:x.id, n:x.numero, due:dateOnly(x.vence), amount:+x.monto, mora:+x.mora, moraAt:dateOnly(x.mora_aplicada_en), status:x.estado, paidAt:dateOnly(x.pagada_en)}; cuotaById[x.id]=q; return q; });
    return { id:c.id, code:c.codigo, orderId:c.pedido_id, userId:c.usuario_id, base:+c.monto_base, down:+c.inicial, iniPct:+c.inicial_pct,
      financed:+c.monto_financiado, n:c.n_cuotas, pct:+c.recargo_pct, st:c.estado, status:CRE[c.estado]||c.estado, approved:c.aprobado_en?new Date(c.aprobado_en):null, cuotas };
  });
  S.credits.forEach(c=>{ const o=O(c.orderId); if(o) o.creditId=c.id; });
  S.payments = pa.map(g=>({ id:g.id, code:g.codigo, userId:g.usuario_id, orderId:g.pedido_id, creditId:g.credito_id, kind:g.tipo, method:g.metodo,
    currency:g.moneda==='VES'?'Bs':'USD', bank:g.banco, ref:g.referencia, expected:+g.monto_esperado_usd, reported:+g.monto_reportado, tasa:+g.tasa,
    path:g.comprobante_path, status:g.estado, note:g.nota, reviewedAt:g.revisado_en?new Date(g.revisado_en):null, created:new Date(g.creado_en),
    cuotas: pc.filter(x=>x.pago_id===g.id).map(x=>cuotaById[x.cuota_id]?.n).filter(Boolean).sort((a,b)=>a-b) }));
  S.notifs = no.map(n=>({id:n.id, at:new Date(n.creado_en), text:n.texto, read:n.leida}));
  if(S.me.role==='admin'){
    const bt = await q('bitacora',['id',false]);
    S.audit = bt.slice(0,400).map(a=>({at:new Date(a.creado_en), by:a.actor, msg:a.accion}));
  } else {
    const {data, error} = await sb.rpc('mi_cupo', {financiado:null});
    if(!error) S.cupo = data;
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
const reportedUSD = p => p.currency==='Bs' ? r2(p.reported / p.tasa) : r2(p.reported);
function eligibility(financed){
  const k = S.cupo || {limite:0, usado:0, disponible:0, activos:0, en_mora:false};
  const why = [];
  if(k.en_mora) why.push('Tienes un crédito con cuotas vencidas. Ponte al día para solicitar uno nuevo.');
  if(k.activos >= S.cfg.maxCreditos) why.push(`Ya tienes ${k.activos} créditos abiertos (máximo ${S.cfg.maxCreditos}).`);
  if(financed > +k.disponible) why.push(`El monto a financiar (${usd(financed)}) supera tu cupo disponible (${usd(k.disponible)}). Sube la inicial o reduce el carrito.`);
  return {limite:+k.limite, usado:+k.usado, disp:+k.disponible, ok:!why.length, why};
}
function cartTotals(){
  const subtotal = r2(sum(S.cart, i=>i.unit*i.qty));
  let couponOk = false, couponMsg = '';
  if(S.coupon){
    if(!S.cfg.cupon.code || S.coupon !== S.cfg.cupon.code.toUpperCase()) couponMsg = 'El cupón no existe.';
    else if(!me()) couponMsg = 'Se aplicará al iniciar sesión si es tu primera compra.';
    else if(S.orders.some(o=>o.userId===me().id && o.st!=='cancelado')) couponMsg = 'El cupón es solo para la primera compra.';
    else couponOk = true;
  }
  const discount = couponOk ? r2(subtotal*S.cfg.cupon.pct) : 0;
  return {subtotal, discount, couponOk, couponMsg, units: sum(S.cart,i=>i.qty)};
}
function coCalc(){
  const t = cartTotals(), co = S.co;
  const base = r2(t.subtotal - t.discount);
  const ship = shipPrice(co.ship, base);
  const k = {...t, base, ship, total: r2(base+ship)};
  if(co.mode==='financiado'){
    k.down = r2(base*co.ini); k.financed = r2((base-k.down)*(1+S.cfg.plans[co.n])); k.cuota = r2(k.financed/co.n);
    k.hoy = r2(k.down + ship); k.costoTotal = r2(k.down + k.financed + ship);
  } else k.hoy = k.total;
  return k;
}

/* ===================== componentes ===================== */
const BADGE = {'Pendiente de pago':'warn','Pago en revisión':'warn','Crédito en evaluación':'warn','Pago rechazado':'bad','Preparando':'info','Listo para retiro':'info','Enviado':'info','Entregado':'ok','Cancelado':'',
  'Activo':'info','En mora':'bad','Liquidado':'ok','En evaluación':'warn','Rechazado':'bad', pendiente:'warn', verificado:'ok', aprobado:'ok', rechazado:'bad'};
const LABEL = {pendiente:'Por verificar', verificado:'Verificado', aprobado:'Aprobado', rechazado:'Rechazado'};
const tag = s => `<span class="tag ${BADGE[s]||''}">${esc(LABEL[s]||s)}</span>`;
const finCuota = (price, n=6) => r2(price*(1-S.cfg.inicialMin)*(1+(S.cfg.plans[n]??0))/n);
const midPlan = () => { const ks = Object.keys(S.cfg.plans).map(Number).sort((a,b)=>a-b); return ks.includes(6) ? 6 : ks[Math.floor(ks.length/2)]; };
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
const amtTxt = p => p.currency==='Bs' ? `${bs(p.reported)} <span class="muted small">(${usd(reportedUSD(p))})</span>` : usd(p.reported);
const waLink = (txt) => BRAND.whatsapp ? `https://wa.me/${encodeURIComponent(BRAND.whatsapp)}?text=${encodeURIComponent(txt)}` : '';

function pcard(p){
  const out = p.stock<=0; const n = midPlan();
  const opts = p.colors.length>1 || p.storages;
  return `<article class="pc">
    <button class="ph" data-act="pd" data-id="${p.id}" aria-label="Ver ${esc(p.name)}">${img(p)}${out?'<span class="tag">Agotado</span>':p.price>=S.cfg.minFin?'<span class="tag ok">Financiable</span>':''}</button>
    <div class="bd">
      <span class="brandname">${esc(p.brand)}</span>
      <button class="nm" data-act="pd" data-id="${p.id}">${esc(p.name)}${p.storages?` ${esc(p.storages[0].n)}`:''}</button>
      <span class="sp">${esc(Object.values(p.specs).slice(0,2).join(' · '))}</span>
      <span class="pr num">${usd(p.price)}</span>
      ${p.price>=S.cfg.minFin?`<span class="cuo">o ${n} cuotas de ${usd(finCuota(p.price, n))}</span>`:'<span class="sp">Solo pago de contado</span>'}
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
function logoHTML(dark){
  if(BRAND.logo) return `<img src="${esc(BRAND.logo)}" alt="${esc(BRAND.a+BRAND.b)}" style="height:36px;width:auto">`;
  return `<span class="mk"><i></i></span><b${dark?' style="color:#fff"':''}>${esc(BRAND.a)}</b><span>${esc(BRAND.b)}</span>`;
}

/* ===================== cabecera / pie ===================== */
function renderChrome(){
  const u = me(); const cnt = sum(S.cart,i=>i.qty);
  const un = u ? S.notifs.filter(n=>!n.read).length : 0;
  $('#strip').innerHTML = `<span>Envíos a todo el país · Compra de contado o en cuotas</span>${S.cfg?`<span>Tasa del día: <b class="num">${bs(S.cfg.tasa)}</b> por dólar</span>`:''}`;
  $('#hd').innerHTML = `
    <button class="logo" data-act="go" data-v="inicio" aria-label="Inicio">${logoHTML()}</button>
    <form class="search" id="searchf" role="search"><input id="q" placeholder="Buscar teléfonos, tablets, accesorios…" value="${esc(S.f.q)}" aria-label="Buscar"><button type="submit" aria-label="Buscar">${ico('search')}</button></form>
    <div class="hact">
      ${isAdmin() ? `<button class="hbtn" data-act="go" data-v="admin">${ico('grid')}<span class="lb">Panel<small>Administración</small></span></button>` : ''}
      ${u && !isAdmin() ? `<button class="hbtn" data-act="acct" data-v="notificaciones" aria-label="Notificaciones">${ico('bell')}${un?`<span class="cnt">${un}</span>`:''}</button>` : ''}
      <button class="hbtn" data-act="${u?(isAdmin()?'go':'acct'):'go'}" data-v="${u?(isAdmin()?'admin':'resumen'):'login'}">${ico('user')}<span class="lb">${u?`Hola, ${esc(u.name.split(' ')[0])}<small>${isAdmin()?'Administrador':'Mi cuenta'}</small>`:'Ingresar<small>o crear cuenta</small>'}</span></button>
      <button class="hbtn" data-act="go" data-v="carrito">${ico('cart')}${cnt?`<span class="cnt">${cnt}</span>`:''}<span class="lb">Carrito<small class="num">${usd(sum(S.cart,i=>i.unit*i.qty))}</small></span></button>
    </div>`;
  const v = S.route.v;
  $('#cats').innerHTML = CATS.map(c=>`<button data-act="cat" data-v="${c}" aria-current="${v==='catalogo' && S.f.cat===c}">${c}</button>`).join('')
    + `<button data-act="cat" data-v="" aria-current="${v==='catalogo' && !S.f.cat}">Todo el catálogo</button><button class="sp" data-act="go" data-v="financiamiento" aria-current="${v==='financiamiento'}">Financiamiento</button>`;
  const wa = waLink('Hola, quiero información sobre un equipo.');
  $('#foot').innerHTML = `<div class="wrap cols">
      <div><div class="logo">${logoHTML(true)}</div>
        <p style="margin-top:10px;max-width:34ch">Teléfonos, tablets y accesorios con garantía. Paga de contado o financia tu equipo en cuotas mensuales.</p></div>
      <div><h4>Comprar</h4><ul>${CATS.map(c=>`<li><button data-act="cat" data-v="${c}">${c}</button></li>`).join('')}</ul></div>
      <div><h4>Ayuda</h4><ul><li><button data-act="go" data-v="financiamiento">Cómo funciona el financiamiento</button></li><li><button data-act="acct" data-v="pedidos">Seguir mi pedido</button></li><li><button data-act="acct" data-v="creditos">Pagar una cuota</button></li></ul></div>
      <div><h4>Contacto</h4><ul><li>${esc(BRAND.ciudad)}, Venezuela</li>${BRAND.horario?`<li>${esc(BRAND.horario)}</li>`:''}${wa?`<li><a class="wa" style="color:var(--gold-l)" href="${wa}" target="_blank" rel="noopener">${ico('chat')} WhatsApp</a></li>`:''}${BRAND.correo?`<li>${esc(BRAND.correo)}</li>`:''}<li>RIF ${esc(BRAND.rif)}</li></ul></div>
    </div>
    <div class="wrap bot"><span>© ${new Date().getFullYear()} ${esc(BRAND.legal)}. Todos los derechos reservados.</span></div>`;
}

/* ===================== vistas: tienda ===================== */
function vInicio(){
  const top = S.products.filter(p=>p.cat==='Teléfonos' && p.stock>0).slice(0,4);
  const acc = S.products.filter(p=>['Accesorios','Audio','Smartwatch'].includes(p.cat)).slice(0,4);
  const heroP = [...S.products].filter(p=>p.cat==='Teléfonos').sort((a,b)=>b.price-a.price)[0];
  const plans = Object.keys(S.cfg.plans).map(Number).sort((a,b)=>a-b);
  return `
  <section class="hero">
    <div class="tx">
      <span class="eyebrow">Contado o financiado</span>
      <h1>Estrena teléfono hoy y págalo en hasta ${plans[plans.length-1]||9} cuotas</h1>
      <p>Paga una inicial desde el ${Math.round(S.cfg.inicialMin*100)}%, sube tu comprobante y recibe tu equipo. El resto lo pagas mes a mes desde tu cuenta.</p>
      <div class="row"><button class="btn buy" data-act="cat" data-v="Teléfonos">Ver teléfonos</button><button class="btn" data-act="go" data-v="financiamiento">Simular mis cuotas</button></div>
    </div>
    <div class="img">${heroP?img(heroP):''}</div>
  </section>
  <div class="perks">
    <div>${ico('card')}<p><b>Contado o cuotas</b><span>Planes de ${plans.join(', ').replace(/, (\d+)$/,' y $1')} meses</span></p></div>
    <div>${ico('truck')}<p><b>Envíos nacionales</b><span>Gratis en compras desde ${usd(S.cfg.envioGratis).replace('.00','')}</span></p></div>
    <div>${ico('store')}<p><b>Retiro en tienda</b><span>Listo 24 h después del pago</span></p></div>
    <div>${ico('shield')}<p><b>Garantía</b><span>En todos nuestros equipos</span></p></div>
  </div>
  <section class="sec"><div class="sech"><h2>Categorías</h2></div>
    <div class="catgrid">${CATS.map(c=>{const list=S.products.filter(x=>x.cat===c); const p=list[0]; return p?`<button class="cat" data-act="cat" data-v="${c}">${img(p)}<b>${c}</b><span class="muted small">${list.length} producto${list.length===1?'':'s'}</span></button>`:''}).join('')}</div>
  </section>
  ${top.length?`<section class="sec"><div class="sech"><h2>Teléfonos destacados</h2><button class="link" data-act="cat" data-v="Teléfonos">Ver todos</button></div>
    <div class="pgrid">${top.map(pcard).join('')}</div></section>`:''}
  ${acc.length?`<section class="sec"><div class="sech"><h2>Complementa tu equipo</h2><button class="link" data-act="cat" data-v="Accesorios">Ver accesorios</button></div>
    <div class="pgrid">${acc.map(pcard).join('')}</div></section>`:''}
  <section class="sec"><div class="sech"><h2>Cómo comprar a crédito</h2><button class="link" data-act="go" data-v="financiamiento">Condiciones completas</button></div>
    <div class="howto">
      <div><span class="n">1</span><h3>Crea tu cuenta</h3><p class="muted">Regístrate con tu cédula. Tu cupo inicial es de ${usd(S.cfg.cupoBase)} y crece con cada crédito que terminas de pagar.</p></div>
      <div><span class="n">2</span><h3>Paga la inicial</h3><p class="muted">Elige el plan y sube el comprobante de tu inicial. Revisamos tu solicitud en menos de 24 horas.</p></div>
      <div><span class="n">3</span><h3>Recibe y paga tus cuotas</h3><p class="muted">Al aprobarse, despachamos tu equipo. Pagas cada cuota desde tu cuenta antes de su fecha de vencimiento.</p></div>
    </div></section>`;
}
function vCatalogo(){
  const f = S.f; const qs = f.q.trim().toLowerCase();
  let list = S.products.filter(p=>(!f.cat||p.cat===f.cat) && (!f.brands.length||f.brands.includes(p.brand)) && (!f.max||p.price<=+f.max) && (!f.fin||p.price>=S.cfg.minFin) && (!f.stock||p.stock>0)
    && (!qs || (p.name+' '+p.brand+' '+p.cat+' '+Object.values(p.specs).join(' ')).toLowerCase().includes(qs)));
  if(f.sort==='asc') list.sort((a,b)=>a.price-b.price);
  if(f.sort==='desc') list.sort((a,b)=>b.price-a.price);
  if(f.sort==='az') list.sort((a,b)=>a.name.localeCompare(b.name));
  list.sort((a,b)=>(a.stock<=0)-(b.stock<=0));
  const brands = [...new Set(S.products.filter(p=>!f.cat||p.cat===f.cat).map(p=>p.brand))];
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<span>${esc(f.cat||'Catálogo')}</span>${qs?`›<span>“${esc(f.q)}”</span>`:''}</div>
  <div class="catalog">
    <aside class="filters">
      <div><h4>Categoría</h4>${['',...CATS].map(c=>`<label class="ck"><input type="radio" name="fc" data-on="fcat" value="${c}" ${(f.cat||'')===c?'checked':''}>${c||'Todas'}</label>`).join('')}</div>
      <div><h4>Marca</h4>${brands.map(b=>`<label class="ck"><input type="checkbox" data-on="fbrand" value="${esc(b)}" ${f.brands.includes(b)?'checked':''}>${esc(b)}</label>`).join('')}</div>
      <div><h4>Precio máximo</h4><div class="field"><select data-on="fmax" aria-label="Precio máximo"><option value="">Sin límite</option>${[100,200,300,500,800].map(v=>`<option value="${v}" ${+f.max===v?'selected':''}>Hasta ${usd(v)}</option>`).join('')}</select></div></div>
      <div><h4>Disponibilidad</h4>
        <label class="ck"><input type="checkbox" data-on="ffin" ${f.fin?'checked':''}>Se puede financiar</label>
        <label class="ck"><input type="checkbox" data-on="fstock" ${f.stock?'checked':''}>Solo con existencia</label></div>
      ${(f.brands.length||f.max||f.fin||f.stock||f.q)?`<button class="link" data-act="clearf">Limpiar filtros</button>`:''}
    </aside>
    <div>
      <div class="toolbar"><div><h1 style="font-size:24px">${esc(f.cat||'Todo el catálogo')}</h1><span class="muted small">${list.length} producto${list.length===1?'':'s'}</span></div>
        <label class="row small">Ordenar por <select data-on="fsort" aria-label="Ordenar"><option value="rel">Relevancia</option><option value="asc" ${f.sort==='asc'?'selected':''}>Menor precio</option><option value="desc" ${f.sort==='desc'?'selected':''}>Mayor precio</option><option value="az" ${f.sort==='az'?'selected':''}>Nombre A–Z</option></select></label></div>
      ${list.length?`<div class="pgrid">${list.map(pcard).join('')}</div>`:`<div class="empty"><h2>No encontramos productos</h2><p>Prueba con otra búsqueda o quita algunos filtros.</p><button class="btn" data-act="clearf">Limpiar filtros</button></div>`}
    </div>
  </div>`;
}
function vProducto(){
  const p = P(S.route.id); if(!p) return `<div class="empty"><h2>Producto no encontrado</h2><button class="btn" data-act="cat" data-v="">Ver catálogo</button></div>`;
  const pd = S.pd; const price = unitPrice(p, pd.storage); const out = p.stock<=0;
  const rel = S.products.filter(x=>x.id!==p.id && (x.cat===p.cat || x.cat==='Accesorios')).slice(0,4);
  const wa = waLink(`Hola, quiero información sobre el ${p.name}.`);
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<button data-act="cat" data-v="${esc(p.cat)}">${esc(p.cat)}</button>›<span>${esc(p.name)}</span></div>
  <section class="pdp">
    <div class="gal">${img(p, pd.color)}</div>
    <div class="inf">
      <span class="brandname">${esc(p.brand)} · Código ${String(p.id).padStart(4,'0')}</span>
      <h1>${esc(p.name)}${p.storages?' '+esc(p.storages[pd.storage].n):''}</h1>
      <div><span class="pr num">${usd(price)}</span><div class="muted small">${bs(price*S.cfg.tasa)} a la tasa del día</div></div>
      <div><h4 style="margin-bottom:8px">Color: <span class="muted" style="font-weight:500">${esc(p.colors[pd.color]?.n)}</span></h4>
        <div class="opts">${p.colors.map((c,i)=>`<button class="sw" style="background:${esc(c.hex)}" data-act="pcolor" data-i="${i}" aria-pressed="${pd.color===i}" aria-label="${esc(c.n)}"></button>`).join('')}</div></div>
      ${p.storages?`<div><h4 style="margin-bottom:8px">Almacenamiento</h4><div class="opts">${p.storages.map((s,i)=>`<button class="ob" data-act="pstor" data-i="${i}" aria-pressed="${pd.storage===i}">${esc(s.n)}${+s.d?` <span class="muted">+${usd(s.d)}</span>`:''}</button>`).join('')}</div></div>`:''}
      <div class="row">
        ${out?'<span class="tag">Agotado</span>':`<div class="qty"><button data-act="pqty" data-d="-1" aria-label="Menos">−</button><span class="num">${pd.qty}</span><button data-act="pqty" data-d="1" aria-label="Más">+</button></div>
        <span class="small ${p.stock<=5?'stk':'muted'}">${p.stock===1?'Última unidad':p.stock<=5?`Últimas ${p.stock} unidades`:`${p.stock} disponibles`}</span>`}
      </div>
      <div class="row"><button class="btn buy" style="flex:1" ${out?'disabled':''} data-act="add" data-id="${p.id}">Agregar al carrito</button><button class="btn brand" style="flex:1" ${out?'disabled':''} data-act="buynow" data-id="${p.id}">Comprar ahora</button></div>
      ${price>=S.cfg.minFin?`<div class="finbox"><div class="h">Llévalo financiado · inicial desde ${usd(r2(price*S.cfg.inicialMin))}</div>
        <table class="t"><thead><tr><th>Plan</th><th class="r">Cuota mensual</th><th class="r">Total a pagar</th></tr></thead><tbody>
        ${Object.keys(S.cfg.plans).map(n=>{const fin=r2(price*(1-S.cfg.inicialMin)*(1+S.cfg.plans[n]));return `<tr><td>${n} cuotas</td><td class="r num"><b>${usd(r2(fin/n))}</b></td><td class="r num muted">${usd(r2(fin+price*S.cfg.inicialMin))}</td></tr>`}).join('')}
        </tbody></table></div>`:`<div class="note">Este producto se vende solo de contado. Puedes financiarlo si tu carrito suma ${usd(S.cfg.minFin)} o más.</div>`}
      ${wa?`<a class="link wa" href="${wa}" target="_blank" rel="noopener">${ico('chat')} Preguntar por WhatsApp</a>`:''}
    </div>
  </section>
  <div class="two" style="grid-template-columns:1fr 1fr">
    <section class="box"><h2>Especificaciones</h2><table class="spec">${Object.entries(p.specs).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table></section>
    <section class="box"><h2>Descripción</h2><p>${esc(p.desc)}</p><div class="note">El equipo se entrega sellado y se revisa contigo al momento del retiro o la entrega.</div></section>
  </div>
  ${rel.length?`<section class="sec" style="margin-top:28px"><h2>También te puede interesar</h2><div class="pgrid">${rel.map(pcard).join('')}</div></section>`:''}`;
}
function vCarrito(){
  S.cart = S.cart.filter(i=>P(i.pid));
  if(!S.cart.length) return `<div class="empty"><h2>Tu carrito está vacío</h2><p>Explora el catálogo y agrega lo que te guste.</p><button class="btn buy" data-act="cat" data-v="Teléfonos">Ver teléfonos</button></div>`;
  const t = cartTotals();
  return `<h1 style="margin-bottom:18px">Carrito de compras</h1>
  <div class="two">
    <section class="box">${S.cart.map((i,ix)=>{const p=P(i.pid); return `
      <div class="citem"><div class="th">${img(p,i.ci)}</div>
        <div style="min-width:0"><span class="brandname">${esc(p.brand)}</span><div style="font-weight:600">${esc(p.name)}</div>
          <div class="muted small">${esc(i.color)}${i.storage?' · '+esc(i.storage):''} · ${usd(i.unit)} c/u</div>
          ${i.qty>p.stock?`<div class="err">Solo quedan ${p.stock} unidades</div>`:''}
          <div class="row" style="margin-top:6px"><div class="qty"><button data-act="cqty" data-i="${ix}" data-d="-1" aria-label="Menos">−</button><span class="num">${i.qty}</span><button data-act="cqty" data-i="${ix}" data-d="1" aria-label="Más">+</button></div>
          <button class="link small" data-act="crem" data-i="${ix}">Eliminar</button></div></div>
        <div class="pr num" style="margin:0;font-size:18px">${usd(i.unit*i.qty)}</div></div>`}).join('')}
    </section>
    <aside class="box sum"><h2>Resumen</h2>
      <div class="sl"><span>Subtotal (${t.units} artículo${t.units===1?'':'s'})</span><span class="num">${usd(t.subtotal)}</span></div>
      ${t.discount?`<div class="sl" style="color:var(--ok)"><span>Cupón ${esc(S.coupon)}</span><span class="num">−${usd(t.discount)}</span></div>`:''}
      <div class="sl muted"><span>Envío</span><span>Se calcula al pagar</span></div>
      <div class="sl tot"><span>Total</span><span class="num">${usd(t.subtotal-t.discount)}</span></div>
      <div class="muted small">${bs((t.subtotal-t.discount)*S.cfg.tasa)} a la tasa del día</div>
      ${S.cfg.cupon.code?`<form id="couponf" class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><input id="cp" placeholder="Código de cupón" value="${esc(S.coupon)}" aria-label="Cupón"></div><button class="btn" type="submit">Aplicar</button></form>
      ${t.couponMsg?`<div class="small ${t.couponOk?'':'err'}">${t.couponMsg}</div>`:''}`:''}
      ${t.subtotal>=S.cfg.minFin?`<div class="note ok small">Este carrito se puede financiar: inicial desde ${usd(r2((t.subtotal-t.discount)*S.cfg.inicialMin))}.</div>`:`<div class="note small">Agrega ${usd(S.cfg.minFin-t.subtotal)} más para poder financiar tu compra.</div>`}
      <button class="btn buy block" data-act="tocheckout" ${S.cart.some(i=>i.qty>P(i.pid).stock)?'disabled':''}>Continuar compra</button>
      <button class="link" data-act="cat" data-v="">Seguir comprando</button>
    </aside>
  </div>`;
}
function payInfo(method){
  const d = S.cfg.datosPago || {};
  return `<b>${METODOS[method].n}</b><span>${esc(d[method] || '')}</span>`;
}
function vCheckout(){
  const u = me();
  if(!u){ S.after = 'checkout'; return vLogin('Inicia sesión o crea tu cuenta para completar tu compra o solicitar financiamiento.'); }
  if(isAdmin()) return `<div class="empty"><h2>Estás conectado como administrador</h2><p>Cierra sesión y entra con una cuenta de cliente para comprar.</p></div>`;
  if(!S.cart.length) return vCarrito();
  if(!S.co) S.co = {ship:u.addr?'local':'retiro', addr:u.addr||'', city:u.city||'', mode:'contado', n:midPlan(), ini:S.cfg.inicialMin, method:'pago_movil', later:false, when:'ahora', bank:BANKS[0], ref:'', amount:'', file:null, err:'', showPlan:false};
  const co = S.co, k = coCalc();
  const canFin = k.base >= S.cfg.minFin;
  if(!canFin) co.mode='contado';
  co.when = (co.method==='efectivo' || co.later) ? 'despues' : 'ahora';
  if(co.method==='efectivo') co.ship='retiro';
  const fin = co.mode==='financiado';
  const el = fin ? eligibility(k.financed) : null;
  const cur = METODOS[co.method].cur;
  const hoyCur = cur==='Bs' ? bs(r2(k.hoy*S.cfg.tasa)) : usd(k.hoy);
  const plans = Object.keys(S.cfg.plans).map(Number).sort((a,b)=>a-b);
  const down = r2(k.base*co.ini);
  const cuotaDe = n => r2(r2((k.base-down)*(1+S.cfg.plans[n]))/n);
  const nMax = plans[plans.length-1];
  const minCuota = canFin ? r2(r2((k.base-r2(k.base*S.cfg.inicialMin))*(1+S.cfg.plans[nMax]))/nMax) : 0;
  const short = {pago_movil:'Pago móvil', transferencia:'Transferencia', zelle:'Zelle', efectivo:'Efectivo'};
  const payTxt = (S.cfg.datosPago||{})[co.method] || '';
  return `<div class="crumbs"><button data-act="go" data-v="carrito">Carrito</button>›<span>Finalizar compra</span></div>
  <h1 style="margin-bottom:18px">Finalizar compra</h1>
  <div class="two">
  <div class="costeps">
    <section class="box"><h2><span class="stepn">1</span>Entrega</h2>
      <div class="seg seg3">${Object.entries(S.cfg.envio).map(([key,e])=>{const c=shipPrice(key,k.base);const dis=co.method==='efectivo'&&key!=='retiro';return `
        <label class="so ${dis?'dis':''}"><input type="radio" name="ship" value="${key}" data-on="ship" ${co.ship===key?'checked':''} ${dis?'disabled':''}><span class="ot">${esc(e.n)}</span><span class="os">${c?usd(c):'Gratis'}</span></label>`}).join('')}</div>
      ${co.ship!=='retiro'?`<div class="fg"><div class="field" style="grid-column:1/-1"><label for="co-addr">Dirección</label><input id="co-addr" data-in="addr" value="${esc(co.addr)}" placeholder="Calle, edificio, piso, punto de referencia" autocomplete="street-address"></div>
        <div class="field"><label for="co-city">Ciudad</label><input id="co-city" data-in="city" value="${esc(co.city)}" autocomplete="address-level2"></div>
        <div class="field"><label>Recibe</label><input value="${esc(u.name)}" disabled></div></div>
        <p class="muted small">${esc(S.cfg.envio[co.ship]?.d||'')}</p>`
      :`<p class="muted small">Retira en la tienda presentando tu cédula. Te avisamos cuando esté listo.</p>`}
    </section>

    <section class="box"><h2><span class="stepn">2</span>Forma de pago</h2>
      <div class="seg seg2">
        <label class="so"><input type="radio" name="mode" value="contado" data-on="mode" ${!fin?'checked':''}><span class="ot">De contado</span><span class="os">${usd(k.total)}</span></label>
        <label class="so ${canFin?'':'dis'}"><input type="radio" name="mode" value="financiado" data-on="mode" ${fin?'checked':''} ${canFin?'':'disabled'}><span class="ot">En cuotas</span><span class="os">${canFin?`desde ${usd(minCuota)} al mes`:`Desde ${usd(S.cfg.minFin)} de compra`}</span></label>
      </div>
      ${fin?`
        <div class="seg seg3">${plans.map(n=>`<label class="so"><input type="radio" name="plan" value="${n}" data-on="plan" ${co.n===n?'checked':''}><span class="ot">${n} cuotas</span><span class="os">${usd(cuotaDe(n))} al mes</span></label>`).join('')}</div>
        <div class="field rng"><label for="co-ini">Inicial: <b id="ini-l">${Math.round(co.ini*100)}% · ${usd(k.down)}</b></label><input id="co-ini" type="range" min="${Math.round(S.cfg.inicialMin*100)}" max="${Math.round(S.cfg.inicialMax*100)}" step="5" value="${Math.round(co.ini*100)}" data-on="ini"></div>
        <p class="muted small">Primera cuota hacia el ${fd(addMonths(S.today,1))}. Si pagas una cuota después de su fecha, se suma ${usd(S.cfg.mora)}. <button class="link small" data-act="toggleplan">${co.showPlan?'Ocultar fechas':'Ver todas las fechas'}</button></p>
        ${co.showPlan?`<div class="tbl"><table class="t"><tbody>${Array.from({length:co.n},(_,i)=>`<tr><td>Cuota ${i+1}</td><td>${fd(addMonths(S.today,i+1))}</td><td class="r num">${usd(i===co.n-1?r2(k.financed-k.cuota*(co.n-1)):k.cuota)}</td></tr>`).join('')}</tbody></table></div>`:''}
        ${el.ok?'':`<div class="note bad small">${el.why.map(esc).join('<br>')}</div>`}`:''}
    </section>

    <section class="box"><h2><span class="stepn">3</span>${fin?'Pago de la inicial':'Pago'}</h2>
      <div class="seg seg4">${Object.keys(METODOS).map(key=>`<label class="so"><input type="radio" name="met" value="${key}" data-on="method" ${co.method===key?'checked':''}><span class="ot">${short[key]}</span><span class="os">${METODOS[key].cur==='Bs'?'Bolívares':'Dólares'}</span></label>`).join('')}</div>
      <div class="bankdata"><span class="muted small">${co.method==='efectivo'?'Dónde pagar':'Datos para pagar'}</span><span>${esc(payTxt)}</span><span>Monto: <b class="num">${hoyCur}</b>${cur==='Bs'?` <span class="muted">(${usd(k.hoy)})</span>`:''}</span></div>
      ${co.method!=='efectivo'?`<label class="ck small"><input type="checkbox" data-on="later" ${co.later?'checked':''}>Pagaré después (guardamos tus productos ${S.cfg.reservaHoras} horas)</label>`
        :`<p class="muted small">Guardamos tus productos ${S.cfg.reservaHoras} horas. Pagas en caja al retirarlos.</p>`}
      ${co.when==='ahora'?`<div class="fg">
        ${cur==='Bs'?`<div class="field"><label for="co-bank">Banco de origen</label><select id="co-bank" data-in="bank">${BANKS.map(b=>`<option ${co.bank===b?'selected':''}>${b}</option>`).join('')}</select></div>`:''}
        <div class="field"><label for="co-ref">Referencia</label><input id="co-ref" data-in="ref" value="${esc(co.ref)}" placeholder="${cur==='Bs'?'Ej. 00418833':'Código de confirmación'}"></div>
        <div class="field"><label for="co-amt">Monto pagado (${cur})</label><input id="co-amt" data-in="amount" inputmode="decimal" value="${esc(co.amount)}" placeholder="${cur==='Bs'?r2(k.hoy*S.cfg.tasa):k.hoy}"></div>
        <div class="field"><label for="co-file">Comprobante</label><input id="co-file" type="file" accept="image/*,application/pdf" data-on="file"><span class="hint">${co.file?'Archivo listo: '+esc(co.file.name):'Captura o PDF del pago. Máximo 5 MB.'}</span></div>
      </div>`:''}
    </section>
  </div>

  <aside class="box sum"><h2>Resumen</h2>
    ${S.cart.map(i=>`<div class="sl small"><span>${i.qty} × ${esc(P(i.pid).name)}${i.storage?' '+esc(i.storage):''}</span><span class="num">${usd(i.unit*i.qty)}</span></div>`).join('')}
    <div class="sl" style="border-top:1px solid var(--line);padding-top:10px"><span>Envío</span><span class="num">${k.ship?usd(k.ship):'Gratis'}</span></div>
    ${k.discount?`<div class="sl" style="color:var(--ok)"><span>Cupón</span><span class="num">−${usd(k.discount)}</span></div>`:''}
    ${fin?`<div class="sl"><span>Luego, ${co.n} cuotas de</span><span class="num">${usd(k.cuota)}</span></div>`:''}
    <div class="sl tot"><span>${fin?'Pagas hoy':'Total'}</span><span class="num">${usd(k.hoy)}</span></div>
    ${cur==='Bs'?`<div class="muted small" style="text-align:right">${hoyCur}</div>`:''}
    ${co.err?`<div class="note bad small">${esc(co.err)}</div>`:''}
    <button class="btn buy block" data-act="placeorder" ${el&&!el.ok?'disabled':''}>${S.busy?'Procesando…':fin?'Solicitar crédito':'Confirmar pedido'}</button>
    ${fin?`<span class="muted small">Total del crédito: ${usd(k.costoTotal)} (recargo ${Math.round(S.cfg.plans[co.n]*100)}%).</span>`:''}
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
    <section class="box"><h2>Crear cuenta</h2><p class="muted small">Necesitas una cuenta para comprar o solicitar financiamiento. Tu cédula se usa para validar tus pagos.</p>
      <form id="regf" class="field" style="gap:14px" novalidate>
        <div class="fg"><div class="field"><label for="r-name">Nombre y apellido</label><input id="r-name" autocomplete="name"></div>
          <div class="field"><label for="r-ced">Cédula</label><input id="r-ced" placeholder="V-12.345.678"></div></div>
        <div class="fg"><div class="field"><label for="r-email">Correo</label><input id="r-email" type="email" autocomplete="email"></div>
          <div class="field"><label for="r-tel">Teléfono</label><input id="r-tel" placeholder="0414-000-0000" autocomplete="tel"></div></div>
        <div class="field"><label for="r-pass">Contraseña</label><input id="r-pass" type="password" autocomplete="new-password"><span class="hint">Mínimo 8 caracteres, con al menos un número.</span></div>
        <label class="ck small"><input type="checkbox" id="r-terms">Acepto los términos de venta y la política de privacidad</label>
        <div class="err" id="r-err"></div>
        <button class="btn buy" type="submit">Crear cuenta</button>
      </form>
    </section></div>`;
}
function vNuevaClave(){
  return `<div class="auth" style="grid-template-columns:1fr;max-width:480px"><section class="box"><h2>Nueva contraseña</h2>
    <form id="newpassf" class="field" style="gap:14px" novalidate>
      <div class="field"><label for="np-pass">Escribe tu nueva contraseña</label><input id="np-pass" type="password" autocomplete="new-password"><span class="hint">Mínimo 8 caracteres, con al menos un número.</span></div>
      <div class="err" id="np-err"></div><button class="btn brand" type="submit">Guardar contraseña</button></form></section></div>`;
}

function vFinanciamiento(){
  const n0 = midPlan();
  const sim = S.sim || (S.sim = {amt:389, n:n0, ini:Math.round(S.cfg.inicialMin*100)});
  if(!(sim.n in S.cfg.plans)) sim.n = n0;
  const down = r2(sim.amt*sim.ini/100), fin = r2((sim.amt-down)*(1+S.cfg.plans[sim.n])), qq = r2(fin/sim.n);
  const ok = sim.amt >= S.cfg.minFin;
  return `<div class="crumbs"><button data-act="go" data-v="inicio">Inicio</button>›<span>Financiamiento</span></div>
  <h1 style="margin-bottom:6px">Financiamiento</h1><p class="muted" style="margin-bottom:20px;max-width:70ch">Compra tu equipo pagando una inicial y el resto en cuotas mensuales fijas, sin trámites bancarios.</p>
  <div class="two">
    <section class="box"><h2>Simula tus cuotas</h2>
      <div class="fg">
        <div class="field"><label for="s-amt">Precio del equipo (USD)</label><input id="s-amt" inputmode="decimal" value="${sim.amt}" data-on="simamt"></div>
        <div class="field"><label for="s-n">Plan</label><select id="s-n" data-on="simn">${Object.keys(S.cfg.plans).map(n=>`<option value="${n}" ${+n===sim.n?'selected':''}>${n} cuotas · recargo ${Math.round(S.cfg.plans[n]*100)}%</option>`).join('')}</select></div>
        <div class="field rng" style="grid-column:1/-1"><label for="s-ini">Inicial: ${sim.ini}% · ${usd(down)}</label><input id="s-ini" type="range" min="${Math.round(S.cfg.inicialMin*100)}" max="${Math.round(S.cfg.inicialMax*100)}" step="5" value="${sim.ini}" data-on="simini"></div>
      </div>
      ${ok?`<div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        <div class="kpi"><div class="l">Pagas hoy</div><div class="v num">${usd(down)}</div></div>
        <div class="kpi"><div class="l">${sim.n} cuotas de</div><div class="v num">${usd(qq)}</div></div>
        <div class="kpi"><div class="l">Total</div><div class="v num">${usd(r2(down+fin))}</div></div></div>`
      :`<div class="note warn">El monto mínimo para financiar es ${usd(S.cfg.minFin)}.</div>`}
    </section>
    <aside class="box"><h2>Condiciones</h2>
      <table class="spec">
        <tr><td>Inicial mínima</td><td>${Math.round(S.cfg.inicialMin*100)}% del precio</td></tr>
        <tr><td>Planes</td><td>${Object.entries(S.cfg.plans).map(([n,p])=>`${n} cuotas (+${Math.round(p*100)}%)`).join(', ')}</td></tr>
        <tr><td>Compra mínima</td><td>${usd(S.cfg.minFin)}</td></tr>
        <tr><td>Mora</td><td>${usd(S.cfg.mora)} fijos por cada cuota pagada después de su vencimiento</td></tr>
        <tr><td>Cupo inicial</td><td>${usd(S.cfg.cupoBase)}; sube ${usd(S.cfg.cupoPorLiq)} por cada crédito liquidado</td></tr>
        <tr><td>Créditos simultáneos</td><td>Máximo ${S.cfg.maxCreditos}</td></tr>
        <tr><td>Requisitos</td><td>Cuenta registrada con cédula y no tener cuotas vencidas</td></tr>
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
  const tabs = [['resumen','Resumen',attn],['pedidos','Mis pedidos',0],['creditos','Mis créditos',cr.filter(c=>c.st==='en_mora').length],['pagos','Mis pagos',0],['notificaciones','Notificaciones',nf.filter(n=>!n.read).length],['datos','Mis datos',0]];
  const t = S.acct;
  let body='';
  if(t==='resumen'){
    const k = S.cupo || {}; const deuda = sum(cr,saldo);
    const nxt = cr.filter(c=>['activo','en_mora'].includes(c.st)).flatMap(c=>c.cuotas.filter(q=>q.status!=='pagada').map(q=>({c,q}))).sort((a,b)=>a.q.due-b.q.due)[0];
    const act = ords.filter(o=>!['entregado','cancelado'].includes(o.st));
    body = `<h1>Hola, ${esc(u.name.split(' ')[0])}</h1>
      <div class="kpis">
        <div class="kpi"><div class="l">Pedidos en curso</div><div class="v num">${act.length}</div></div>
        <div class="kpi ${cr.some(c=>c.st==='en_mora')?'alert':''}"><div class="l">Saldo de créditos</div><div class="v num">${usd(deuda)}</div></div>
        <div class="kpi"><div class="l">Próxima cuota</div><div class="v num" style="font-size:18px">${nxt?`${usd(cuotaDue(nxt.q))}<div class="muted small" style="font-family:var(--f-body);font-weight:500">${nxt.q.due<dayStart(S.today)?'Vencida el ':'Vence el '}${fd(nxt.q.due)}</div>`:'—'}</div></div>
        <div class="kpi"><div class="l">Cupo disponible</div><div class="v num">${usd(k.disponible)}</div><div class="muted small">de ${usd(k.limite)}</div></div>
      </div>
      ${cr.filter(c=>c.st==='en_mora').map(c=>`<div class="note bad">Tu crédito ${c.code} tiene cuotas vencidas. Cada cuota vencida suma ${usd(S.cfg.mora)} de mora. <button class="link" data-act="acct" data-v="creditos">Pagar ahora</button></div>`).join('')}
      ${ords.filter(o=>o.st==='pendiente_pago').map(o=>`<div class="note warn">El pedido ${o.code} está reservado hasta el ${fdt(o.deadline)}. ${o.method==='efectivo'?'Paga en caja al retirarlo.':'<button class="link" data-act="payorder" data-o="'+o.id+'">Subir comprobante</button>'}</div>`).join('')}
      ${ords.filter(o=>o.st==='pago_rechazado').map(o=>`<div class="note bad">No pudimos verificar el pago del pedido ${o.code}. <button class="link" data-act="payorder" data-o="${o.id}">Subir nuevo comprobante</button></div>`).join('')}
      <h2>Pedidos en curso</h2>${act.length?act.map(orderCard).join(''):'<div class="empty">No tienes pedidos en curso.</div>'}`;
  }
  if(t==='pedidos') body = `<h1>Mis pedidos</h1>${ords.length?ords.map(orderCard).join(''):'<div class="empty">Aún no has hecho pedidos.</div>'}`;
  if(t==='creditos') body = `<h1>Mis créditos</h1>${cr.length?cr.map(creditCard).join(''):`<div class="empty"><h2>No tienes créditos</h2><p>Puedes financiar compras desde ${usd(S.cfg.minFin)}.</p></div>`}`;
  if(t==='pagos') body = `<h1>Mis pagos</h1>${pays.length?`<div class="tbl"><table class="t"><thead><tr><th>Pago</th><th>Fecha</th><th>Concepto</th><th>Método</th><th>Referencia</th><th>Estado</th><th class="r">Monto</th></tr></thead><tbody>
    ${pays.map(p=>`<tr><td class="nw">${p.code}</td><td class="nw">${fd(p.created)}</td><td>${concept(p)}${p.note?`<div class="err small">${esc(p.note)}</div>`:''}</td><td>${METODOS[p.method].n}${p.bank?' · '+esc(p.bank):''}</td><td>${esc(p.ref)}</td><td>${tag(p.status)}</td><td class="r num nw">${amtTxt(p)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no has registrado pagos.</div>'}`;
  if(t==='notificaciones'){ body = `<h1>Notificaciones</h1><div class="tbl">${nf.length?nf.map(n=>`<div class="notif ${n.read?'':'unread'}">${ico('bell')}<span>${esc(n.text)}</span><span class="dt">${fdt(n.at)}</span></div>`).join(''):'<div class="notif">Sin notificaciones.</div>'}</div>`;
    if(nf.some(n=>!n.read)) setTimeout(async()=>{ const {error} = await sb.rpc('marcar_notificaciones_leidas'); if(!error){ nf.forEach(n=>n.read=true); renderChrome(); } }, 800); }
  if(t==='datos') body = `<h1>Mis datos</h1><section class="box"><form id="dataf" class="field" style="gap:14px">
      <div class="fg"><div class="field"><label>Nombre</label><input value="${esc(u.name)}" disabled></div><div class="field"><label>Cédula</label><input value="${esc(u.cedula)}" disabled></div>
      <div class="field"><label>Correo</label><input value="${esc(u.email)}" disabled></div><div class="field"><label for="d-tel">Teléfono</label><input id="d-tel" value="${esc(u.phone)}"></div>
      <div class="field" style="grid-column:1/-1"><label for="d-addr">Dirección principal</label><input id="d-addr" value="${esc(u.addr)}"></div><div class="field"><label for="d-city">Ciudad</label><input id="d-city" value="${esc(u.city)}"></div></div>
      <div><button class="btn brand" type="submit">Guardar cambios</button></div><span class="muted small">Para cambiar tu nombre o cédula escríbenos; los usamos para validar tus pagos.</span></form></section>`;
  return `<div class="panel"><nav class="side"><div class="who"><b>${esc(u.name)}</b><div class="muted small">Cliente desde ${fd(u.created)}</div></div>
    ${tabs.map(([k,l,n])=>`<button data-act="acct" data-v="${k}" aria-current="${t===k}">${l}${n?`<span class="c">${n}</span>`:''}</button>`).join('')}
    <button data-act="logout">Cerrar sesión</button></nav><div class="content">${body}</div></div>`;
}
function orderCard(o){
  const c = o.creditId ? C(o.creditId) : null;
  return `<article class="ord"><div class="oh"><div class="meta">
      <div><span>Pedido</span><b>${o.code}</b></div><div><span>Fecha</span>${fd(o.created)}</div><div><span>Total</span><b class="num">${usd(o.total)}</b></div>
      <div><span>Modalidad</span>${o.mode==='contado'?'Contado':'Financiado'+(c?` · ${c.n} cuotas`:'')}</div><div><span>Entrega</span>${esc(S.cfg.envio[o.ship.method]?.n||o.ship.method)}</div></div>${tag(o.status)}</div>
    <div class="ob2">
      ${o.items.map(i=>{const p=P(i.pid)||{name:i.name,colors:[{hex:'#777'}],shape:'phone'}; return `<div class="citem" style="grid-template-columns:56px 1fr;border:0;padding:0"><div class="th" style="height:56px">${img(p,i.ci)}</div><div><b>${esc(i.name)}</b><div class="muted small">${esc(i.color||'')}${i.storage?' · '+esc(i.storage):''} · ${i.qty} × ${usd(i.unit)}</div></div></div>`}).join('')}
      ${track(o)}
      ${o.tracking&&o.st!=='entregado'?`<div class="small">Envío por ${esc(o.courier||'')} · guía <b>${esc(o.tracking)}</b></div>`:''}
      ${o.st==='pendiente_pago'?`<div class="note warn small">Reservado hasta el ${fdt(o.deadline)}. ${o.method==='efectivo'?'Paga en caja al retirar.':''}</div>`:''}
      ${['pendiente_pago','pago_rechazado'].includes(o.st)?`<div class="row">${o.method!=='efectivo'?`<button class="btn buy sm" data-act="payorder" data-o="${o.id}">${o.st==='pago_rechazado'?'Subir nuevo comprobante':'Subir comprobante'}</button>`:''}<button class="btn danger sm" data-act="cancelask" data-o="${o.id}">Cancelar pedido</button></div>`:''}
    </div></article>`;
}
function creditCard(c){
  const pend = pendingCuotas(c); const today = dayStart(S.today);
  return `<article class="ord"><div class="oh"><div class="meta">
      <div><span>Crédito</span><b>${c.code}</b></div><div><span>Pedido</span>${O(c.orderId)?.code||''}</div><div><span>Financiado</span><span class="num">${usd(c.financed)}</span></div>
      <div><span>Plan</span>${c.n} cuotas · +${Math.round(c.pct*100)}%</div><div><span>Saldo</span><b class="num">${usd(saldo(c))}</b></div></div>${tag(c.status)}</div>
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
  const pend = S.payments.filter(p=>p.status==='pendiente');
  const mora = S.credits.filter(c=>c.st==='en_mora');
  const toShip = S.orders.filter(o=>['preparando','listo_retiro','pendiente_pago'].includes(o.st));
  const low = S.products.filter(p=>p.stock<=5);
  const tabs = [['resumen','Resumen',0],['pagos','Pagos por verificar',pend.length],['creditos','Créditos y cuotas',mora.length],['pedidos','Pedidos y envíos',toShip.length],['inventario','Inventario',low.length],['config','Configuración',0],['bitacora','Bitácora',0]];
  const fn = {resumen:aResumen, pagos:aPagos, creditos:aCreditos, pedidos:aPedidos, inventario:aInventario, config:aConfig, bitacora:aBitacora}[S.adm] || aResumen;
  return `<div class="panel"><nav class="side"><div class="who"><b>Administración</b><div class="muted small">${esc(u.name)}</div></div>
    ${tabs.map(([k,l,n])=>`<button data-act="adm" data-v="${k}" aria-current="${S.adm===k}">${l}${n?`<span class="c">${n}</span>`:''}</button>`).join('')}
    <button data-act="reload">Recargar información</button><button data-act="go" data-v="inicio">Ver tienda</button><button data-act="logout">Cerrar sesión</button></nav>
    <div class="content">${fn()}</div></div>`;
}
function aResumen(){
  const pend = S.payments.filter(p=>p.status==='pendiente');
  const mora = S.credits.filter(c=>c.st==='en_mora');
  const cxc = sum(S.credits,saldo), morasT = sum(S.credits.filter(c=>['activo','en_mora'].includes(c.st)).flatMap(c=>c.cuotas.filter(q=>q.status!=='pagada')),q=>q.mora);
  const ok = S.payments.filter(p=>(p.status==='verificado'||p.status==='aprobado') && p.reviewedAt);
  const months = Array.from({length:6},(_,i)=>addMonths(new Date(S.today.getFullYear(),S.today.getMonth(),1),i-5));
  const vals = months.map(m=>r2(sum(ok.filter(p=>p.reviewedAt.getFullYear()===m.getFullYear()&&p.reviewedAt.getMonth()===m.getMonth()),reportedUSD)));
  const mx = Math.max(100,...vals); const top = Math.ceil(mx/250)*250;
  const W=640,H=220,L=56,B=28,bw=56,gap=(W-L-10-bw*6)/5;
  const bars = vals.map((v,i)=>{ const h=(H-B-14)*v/top; const x=L+i*(bw+gap); const y=H-B-h;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${i===5?'#C9A227':'#D6D3CB'}"/><text x="${x+bw/2}" y="${y-5}" text-anchor="middle" font-size="11" fill="#151515">${v?usd(Math.round(v)).replace('.00',''):''}</text>
    <text x="${x+bw/2}" y="${H-9}" text-anchor="middle" font-size="12" fill="#6A6A6A">${months[i].toLocaleDateString('es-VE',{month:'short'})}</text>`; }).join('');
  const grid = [0,.5,1].map(f=>{const y=H-B-(H-B-14)*f;return `<line x1="${L}" x2="${W-10}" y1="${y}" y2="${y}" stroke="#E3E2DF"/><text x="${L-8}" y="${y+4}" text-anchor="end" font-size="11" fill="#6A6A6A">${usd(top*f).replace('.00','')}</text>`}).join('');
  const today = dayStart(S.today);
  const soon = S.credits.filter(c=>['activo','en_mora'].includes(c.st)).flatMap(c=>c.cuotas.filter(q=>q.status!=='pagada' && days(S.today,q.due)<=7).map(q=>({c,q}))).sort((a,b)=>a.q.due-b.q.due);
  const low = S.products.filter(p=>p.stock<=5);
  const short = pend.filter(p=>reportedUSD(p) < p.expected-0.5);
  return `<div class="row between"><h1>Resumen</h1><button class="btn sm" data-act="cierre">Ejecutar cierre diario ahora</button></div>
    <div class="kpis">
      <div class="kpi ${pend.length?'alert':''}"><div class="l">Comprobantes por verificar</div><div class="v num">${pend.length}</div></div>
      <div class="kpi ${mora.length?'alert':''}"><div class="l">Créditos en mora</div><div class="v num">${mora.length}</div></div>
      <div class="kpi"><div class="l">Cuentas por cobrar</div><div class="v num">${usd(cxc)}</div><div class="muted small">incluye ${usd(morasT)} de mora</div></div>
      <div class="kpi"><div class="l">Cobrado este mes</div><div class="v num">${usd(vals[5])}</div></div>
    </div>
    <div class="chart"><h3 style="margin-bottom:8px">Pagos verificados por mes (USD)</h3><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pagos verificados por mes">${grid}${bars}</svg></div>
    <div class="two" style="grid-template-columns:1fr 1fr">
      <section class="box"><h3>Cuotas vencidas y por vencer (7 días)</h3>
        ${soon.length?`<div class="tbl"><table class="t"><tbody>${soon.map(({c,q})=>`<tr><td>${esc(U(c.userId)?.name||'')}<div class="muted small">${c.code} · cuota ${q.n}</div></td><td class="nw">${fd(q.due)}</td><td class="r num">${usd(cuotaDue(q))}</td><td>${q.status==='en_revision'?'<span class="tag warn">En revisión</span>':q.due<today?'<span class="tag bad">Vencida</span>':'<span class="tag">Por vencer</span>'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Nada pendiente en los próximos 7 días.</p>'}</section>
      <section class="box"><h3>Alertas</h3>
        ${short.map(p=>`<div class="note warn small">${p.code} de ${esc(U(p.userId)?.name||'')}: el monto reportado es menor al esperado por ${usd(r2(p.expected-reportedUSD(p)))}.</div>`).join('')}
        ${low.map(p=>`<div class="note ${p.stock<=0?'bad':'warn'} small">${esc(p.name)}: ${p.stock<=0?'sin existencia':`quedan ${p.stock} unidades`}.</div>`).join('')}
        ${!short.length&&!low.length?'<p class="muted">Sin alertas.</p>':''}</section>
    </div>`;
}
function aPagos(){
  const f = S.admF.pagos;
  const list = S.payments.filter(p=>p.status==='pendiente' && (f==='todos'||p.kind===f)).sort((a,b)=>a.created-b.created);
  const recent = S.payments.filter(p=>p.status!=='pendiente' && p.reviewedAt).sort((a,b)=>b.reviewedAt-a.reviewedAt).slice(0,8);
  return `<h1>Pagos por verificar</h1>
    <div class="chips">${[['todos','Todos'],['contado','Contado'],['inicial','Solicitudes de crédito'],['cuota','Cuotas']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="pagos" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</div>
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Pago</th><th>Cliente</th><th>Concepto</th><th>Método</th><th class="r">Esperado</th><th class="r">Reportado</th><th>Recibido</th><th></th></tr></thead><tbody>
    ${list.map(p=>{const diff=r2(reportedUSD(p)-p.expected);return `<tr><td class="nw">${p.code}</td><td>${esc(U(p.userId)?.name||'')}</td><td>${concept(p)}</td><td>${METODOS[p.method].n}<div class="muted small">${esc(p.bank)} ${esc(p.ref)}</div></td>
      <td class="r num nw">${usd(p.expected)}</td><td class="r num nw">${amtTxt(p)}${diff<-0.5?`<div class="err small">Faltan ${usd(-diff)}</div>`:''}</td><td class="nw">${fdt(p.created)}</td>
      <td><button class="btn brand sm" data-act="review" data-p="${p.id}">Revisar</button></td></tr>`}).join('')}</tbody></table></div>`
    :`<div class="empty">No hay comprobantes pendientes${f!=='todos'?' en este filtro':''}.</div>`}
    <h2>Revisados recientemente</h2>
    ${recent.length?`<div class="tbl"><table class="t"><thead><tr><th>Pago</th><th>Cliente</th><th>Concepto</th><th>Revisado</th><th>Estado</th><th class="r">Monto</th></tr></thead><tbody>
    ${recent.map(p=>`<tr><td>${p.code}</td><td>${esc(U(p.userId)?.name||'')}</td><td>${concept(p)}</td><td class="nw">${fdt(p.reviewedAt)}</td><td>${tag(p.status)}</td><td class="r num nw">${amtTxt(p)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Todavía no hay pagos revisados.</p>'}`;
}
function aCreditos(){
  const f = S.admF.cred; const today = dayStart(S.today);
  const order = {en_mora:0, evaluacion:1, activo:2, liquidado:3, rechazado:4, cancelado:5};
  const list = S.credits.filter(c=>f==='todos'||c.st===f).sort((a,b)=>(order[a.st]??9)-(order[b.st]??9));
  return `<h1>Créditos y cuotas</h1>
    <div class="chips">${['todos','en_mora','activo','evaluacion','liquidado'].map(k=>`<button class="chip" data-act="admf" data-g="cred" data-v="${k}" aria-pressed="${f===k}">${k==='todos'?'Todos':CRE[k]} <span class="num">(${k==='todos'?S.credits.length:S.credits.filter(c=>c.st===k).length})</span></button>`).join('')}</div>
    ${list.length?list.map(c=>{const mt=sum(c.cuotas.filter(q=>q.status!=='pagada'),q=>q.mora); return `<article class="ord"><div class="oh"><div class="meta">
      <div><span>Crédito</span><b>${c.code}</b></div><div><span>Cliente</span><button class="link" data-act="edo" data-u="${c.userId}">${esc(U(c.userId)?.name||'')}</button></div>
      <div><span>Inicial</span><span class="num">${usd(c.down)} (${Math.round(c.iniPct*100)}%)</span></div><div><span>Financiado</span><span class="num">${usd(c.financed)}</span></div>
      <div><span>Saldo</span><b class="num">${usd(saldo(c))}</b>${mt?` <span class="mora small">incl. ${usd(mt)} mora</span>`:''}</div></div>${tag(c.status)}</div>
      <div class="ob2">${c.st==='evaluacion'?'<div class="muted small">La inicial está en “Pagos por verificar” (o el cliente aún no la sube). Al aprobarla se generan las cuotas desde esa fecha.</div>':['rechazado','cancelado'].includes(c.st)?'<div class="muted small">Sin cuotas.</div>':
      `<div class="tbl"><table class="t"><thead><tr><th>Cuota</th><th>Vence</th><th class="r">Monto</th><th class="r">Mora</th><th>Estado</th><th></th></tr></thead><tbody>
      ${c.cuotas.map(q=>{const late=q.status!=='pagada'&&q.due<today; return `<tr><td>${q.n}/${c.n}</td><td class="nw">${fd(q.due)}</td><td class="r num">${usd(q.amount)}</td><td class="r num">${q.mora?`<span class="mora">${usd(q.mora)}</span>`:'—'}</td>
      <td>${q.status==='pagada'?`<span class="tag ok">Pagada ${fd(q.paidAt)}</span>`:q.status==='en_revision'?'<span class="tag warn">En revisión</span>':late?`<span class="tag bad">Vencida · ${days(q.due,S.today)} días</span>`:'<span class="tag">Pendiente</span>'}</td>
      <td class="nw">${q.mora&&q.status!=='pagada'?`<button class="btn sm" data-act="condonar" data-q="${q.id}">Condonar mora</button>`:''}${q.status==='pendiente'?` <button class="btn sm" data-act="cajacuota" data-q="${q.id}">Pago en caja</button>`:''}</td></tr>`}).join('')}
      </tbody></table></div>`}</div></article>`}).join(''):'<div class="empty">No hay créditos en este filtro.</div>'}`;
}
function aPedidos(){
  const f = S.admF.ped;
  const groups = {activos:['pendiente_pago','pago_en_revision','credito_en_evaluacion','pago_rechazado','preparando','listo_retiro','enviado'], despacho:['preparando','listo_retiro'], todos:null};
  const list = S.orders.filter(o=>!groups[f]||groups[f].includes(o.st));
  return `<h1>Pedidos y envíos</h1>
    <div class="chips">${[['activos','En curso'],['despacho','Por despachar'],['todos','Todos']].map(([k,l])=>`<button class="chip" data-act="admf" data-g="ped" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</div>
    ${list.length?`<div class="tbl"><table class="t"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Entrega</th><th>Estado</th><th class="r">Total</th><th></th></tr></thead><tbody>
    ${list.map(o=>`<tr><td class="nw">${o.code}<div class="muted small">${o.mode==='contado'?'Contado':'Financiado'} · ${METODOS[o.method].n}</div></td><td class="nw">${fd(o.created)}</td><td>${esc(U(o.userId)?.name||'')}<div class="muted small">${esc(U(o.userId)?.phone||'')}</div></td>
      <td>${o.items.map(i=>`${i.qty} × ${esc(i.name)}${i.storage?' '+esc(i.storage):''}${i.color?` <span class="muted small">(${esc(i.color)})</span>`:''}`).join('<br>')}</td>
      <td>${esc(S.cfg.envio[o.ship.method]?.n||o.ship.method)}${o.ship.city?`<div class="muted small">${esc(o.ship.addr)}, ${esc(o.ship.city)}</div>`:''}${o.tracking?`<div class="muted small">${esc(o.courier||'')} · guía ${esc(o.tracking)}</div>`:''}</td>
      <td>${tag(o.status)}${o.st==='pendiente_pago'?`<div class="muted small">Vence ${fdt(o.deadline)}</div>`:''}</td><td class="r num nw">${usd(o.total)}</td>
      <td class="nw">${o.st==='preparando'?`<button class="btn brand sm" data-act="ship" data-o="${o.id}">Despachar</button>`:''}
        ${['enviado','listo_retiro'].includes(o.st)?`<button class="btn sm" data-act="deliver" data-o="${o.id}">Marcar entregado</button>`:''}
        ${['pendiente_pago','pago_rechazado'].includes(o.st)?`<button class="btn sm" data-act="cajaorder" data-o="${o.id}">Pago en caja</button>`:''}</td></tr>`).join('')}
    </tbody></table></div>`:'<div class="empty">No hay pedidos en este filtro.</div>'}`;
}
function aInventario(){
  const live = ['pendiente_pago','pago_en_revision','credito_en_evaluacion','pago_rechazado'], done = ['preparando','listo_retiro','enviado','entregado'];
  const qty = (pid, sts) => sum(S.orders.filter(o=>sts.includes(o.st)).flatMap(o=>o.items).filter(i=>i.pid===pid),i=>i.qty);
  return `<h1>Inventario</h1><p class="muted small">El stock se descuenta al crear el pedido (reserva) y se devuelve si el pedido se cancela o el crédito no se aprueba. Para cambiar precios, fotos o agregar productos usa Supabase &gt; Table Editor &gt; productos.</p>
    <div class="tbl"><table class="t"><thead><tr><th>Producto</th><th>Categoría</th><th class="r">Precio</th><th class="r">Disponible</th><th class="r">Reservado</th><th class="r">Vendido</th><th>Estado</th><th>Ajustar</th></tr></thead><tbody>
    ${S.products.map(p=>`<tr><td><b>${esc(p.name)}</b><div class="muted small">Código ${String(p.id).padStart(4,'0')}${p.active?'':' · oculto'}</div></td><td>${esc(p.cat)}</td><td class="r num">${usd(p.price)}</td><td class="r num"><b>${p.stock}</b></td><td class="r num">${qty(p.id,live)}</td><td class="r num">${qty(p.id,done)}</td>
      <td>${p.stock<=0?'<span class="tag bad">Agotado</span>':p.stock<=5?'<span class="tag warn">Stock bajo</span>':'<span class="tag ok">Normal</span>'}</td>
      <td class="nw"><button class="btn sm" data-act="stock" data-id="${p.id}" data-d="-1" aria-label="Restar uno">−1</button> <button class="btn sm" data-act="stock" data-id="${p.id}" data-d="1" aria-label="Sumar uno">+1</button> <button class="btn sm" data-act="stock" data-id="${p.id}" data-d="5" aria-label="Sumar cinco">+5</button></td></tr>`).join('')}
    </tbody></table></div>`;
}
function aConfig(){
  const c = S.cfg, d = c.datosPago || {};
  return `<h1>Configuración</h1><section class="box"><form id="cfgf" class="field" style="gap:16px">
    <div class="fg">
      <div class="field"><label for="c-tasa">Tasa del día (Bs por USD)</label><input id="c-tasa" inputmode="decimal" value="${c.tasa}"><span class="hint">Se usa para convertir pagos en bolívares. Actualízala a diario.</span></div>
      <div class="field"><label for="c-mora">Cargo fijo por mora (USD)</label><input id="c-mora" inputmode="decimal" value="${c.mora}"><span class="hint">Se aplica una vez por cada cuota vencida.</span></div>
      <div class="field"><label for="c-ini">Inicial mínima (%)</label><input id="c-ini" inputmode="numeric" value="${Math.round(c.inicialMin*100)}"></div>
      <div class="field"><label for="c-min">Compra mínima financiable (USD)</label><input id="c-min" inputmode="decimal" value="${c.minFin}"></div>
      ${Object.keys(c.plans).map(n=>`<div class="field"><label for="c-p${n}">Recargo plan ${n} cuotas (%)</label><input id="c-p${n}" data-plan="${n}" inputmode="decimal" value="${r2(c.plans[n]*100)}"></div>`).join('')}
      <div class="field"><label for="c-cupo">Cupo inicial por cliente (USD)</label><input id="c-cupo" inputmode="decimal" value="${c.cupoBase}"></div>
    </div>
    <h3>Datos para recibir pagos</h3>
    <div class="fg">${Object.entries(METODOS).map(([k,m])=>`<div class="field"><label for="c-d-${k}">${m.n}</label><input id="c-d-${k}" data-dp="${k}" value="${esc(d[k]||'')}"></div>`).join('')}</div>
    <div class="err" id="c-err"></div>
    <div><button class="btn brand" type="submit">Guardar configuración</button></div></form></section>`;
}
function aBitacora(){
  return `<h1>Bitácora</h1><div class="tbl"><table class="t"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead><tbody>
    ${S.audit.length?S.audit.map(a=>`<tr><td class="nw">${fdt(a.at)}</td><td class="nw">${esc(a.by)}</td><td>${esc(a.msg)}</td></tr>`).join(''):'<tr><td colspan="3" class="muted">Sin eventos.</td></tr>'}</tbody></table></div>`;
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
  M = Object.assign({method: ctx.method && ctx.method!=='efectivo' ? ctx.method : 'pago_movil'}, ctx);
  const cur = METODOS[M.method].cur;
  modal(esc(M.title), `
    <div class="note info small">${M.desc}</div>
    <div class="field"><label for="pm-met">Método</label><select id="pm-met" data-on="pmmet">${Object.entries(METODOS).filter(([k])=>k!=='efectivo').map(([k,m])=>`<option value="${k}" ${M.method===k?'selected':''}>${m.n}</option>`).join('')}</select></div>
    <div class="bankdata">${payInfo(M.method)}
      <span>Monto: <b class="num">${cur==='Bs'?bs(r2(M.amount*S.cfg.tasa)):usd(M.amount)}</b>${cur==='Bs'?` <span class="muted">(${usd(M.amount)})</span>`:''}</span></div>
    <form id="payf" class="fg" novalidate>
      ${cur==='Bs'?`<div class="field"><label for="pm-bank">Banco de origen</label><select id="pm-bank">${BANKS.map(b=>`<option>${b}</option>`).join('')}</select></div>`:''}
      <div class="field"><label for="pm-ref">Referencia</label><input id="pm-ref"></div>
      <div class="field"><label for="pm-amt">Monto pagado (${cur})</label><input id="pm-amt" inputmode="decimal" value="${cur==='Bs'?r2(M.amount*S.cfg.tasa):M.amount}"></div>
      <div class="field"><label for="pm-file">Comprobante (imagen o PDF)</label><input id="pm-file" type="file" accept="image/*,application/pdf"></div>
      <div class="err" id="pm-err" style="grid-column:1/-1"></div>
    </form>`, `<button class="btn" data-act="close">Cancelar</button><button class="btn buy" data-act="submitpay">Enviar comprobante</button>`);
}
function reviewModal(id){
  const p = S.payments.find(x=>x.id===id); const u = U(p.userId) || {}; M = {type:'review', id};
  const diff = r2(reportedUSD(p) - p.expected); const short = diff < -0.5;
  let extra = '';
  if(p.kind==='inicial'){ const c=C(p.creditId), h=historial(p.userId);
    extra = `<dt>Crédito</dt><dd>${c.code} · ${c.n} cuotas de ${usd(r2(c.financed/c.n))}</dd><dt>Financiado</dt><dd>${usd(c.financed)} (inicial ${Math.round(c.iniPct*100)}%)</dd>
      <dt>Cupo</dt><dd id="rc-cupo">Consultando…</dd><dt>Historial</dt><dd>${h.n} pedidos · ${h.liq} crédito(s) pagado(s) · ${h.moras} cuota(s) con mora</dd>`;
    sb.rpc('cupo_cliente', {p_usuario:p.userId}).then(({data})=>{ const el=$('#rc-cupo'); if(el && data) el.textContent = `${usd(data.limite)} · usado ${usd(data.usado)} (incluye esta solicitud)`; }); }
  if(p.kind==='cuota'){ const c=C(p.creditId); extra = `<dt>Cuotas</dt><dd>${p.cuotas.map(n=>{const q=c.cuotas.find(x=>x.n===n);return `${n} (${usd(q.amount)}${q.mora?` + ${usd(q.mora)} mora`:''})`}).join(', ')}</dd>`; }
  if(p.kind==='contado'){ const o=O(p.orderId); extra = `<dt>Pedido</dt><dd>${o.items.map(i=>`${i.qty} × ${esc(i.name)}`).join(', ')}</dd><dt>Entrega</dt><dd>${esc(S.cfg.envio[o.ship.method]?.n||'')}</dd>`; }
  const okL = p.kind==='contado'?'Verificar pago':p.kind==='inicial'?'Aprobar crédito':'Verificar cuota';
  modal(`Revisar ${p.code}`, `
    ${short?`<div class="note warn small">El monto reportado equivale a ${usd(reportedUSD(p))} y se esperaban ${usd(p.expected)}. Faltan ${usd(-diff)}.</div>`:`<div class="note ok small">El monto reportado cubre el monto esperado.</div>`}
    <div class="rcpt"><div id="rc-img" class="muted small">${p.path?'Cargando comprobante…':'Sin imagen adjunta.'}</div>
      <dl class="dl"><dt>Cliente</dt><dd>${esc(u.name)}<div class="muted small">${esc(u.cedula)} · ${esc(u.phone)}</div></dd><dt>Concepto</dt><dd>${concept(p)}</dd>
        <dt>Método</dt><dd>${METODOS[p.method].n}${p.bank?' · '+esc(p.bank):''}</dd><dt>Referencia</dt><dd>${esc(p.ref)}</dd><dt>Recibido</dt><dd>${fdt(p.created)}</dd>
        <dt>Esperado</dt><dd class="num">${usd(p.expected)}${p.currency==='Bs'?` · ${bs(r2(p.expected*p.tasa))}`:''}</dd><dt>Reportado</dt><dd class="num">${amtTxt(p)}</dd>${p.currency==='Bs'?`<dt>Tasa usada</dt><dd>${bs(p.tasa)}</dd>`:''}${extra}</dl></div>
    <div class="field"><label for="rv-note">Motivo si rechazas</label><select id="rv-note"><option>La referencia no aparece en el banco</option><option>El monto recibido es incompleto</option><option>La imagen no es legible</option><option>El titular no coincide con el cliente</option></select></div>`,
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
    <div class="field"><label for="sh-guia">Número de guía</label><input id="sh-guia"></div><div class="err" id="sh-err"></div></form>`,
    `<button class="btn" data-act="close">Cancelar</button><button class="btn brand" data-act="doship">Registrar despacho</button>`);
}
function estadoCuenta(uid){
  const u = U(uid) || {}, h = historial(uid);
  const cr = S.credits.filter(c=>c.userId===uid); const pays = S.payments.filter(p=>p.userId===uid);
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
  if(S.route.v==='producto' && (prev.v!=='producto' || prev.id!==S.route.id)) S.pd = {color:0, storage:0, qty:1};
  closeModal(); render(); window.scrollTo(0,0);
}
function render(){
  if(!S.ready) return;
  const v = S.route.v;
  if(v==='login' && me()){ location.hash = isAdmin() ? 'admin' : 'cuenta'; return; }
  const view = {inicio:vInicio, catalogo:vCatalogo, producto:vProducto, carrito:vCarrito, checkout:vCheckout, login:()=>vLogin(S.after?'Inicia sesión para continuar.':''),
    cuenta:vCuenta, admin:vAdmin, financiamiento:vFinanciamiento, 'nueva-clave':vNuevaClave}[v] || vInicio;
  $('#app').innerHTML = view();
  renderChrome();
  document.querySelectorAll('label.so, label.ch').forEach(l=>l.classList.toggle('on', !!l.querySelector('input:checked')));
}
async function afterLogin(){
  const a = S.after; S.after = null; S.co = null; S.acct = 'resumen'; S.adm = 'resumen';
  if(isAdmin()) return go('admin');
  if(a) return go(a);
  go('cuenta');
}
function addToCart(pid, ci, si, qty){
  const p = P(pid); const key = `${pid}-${ci}-${si}`;
  const inCart = sum(S.cart.filter(i=>i.pid===pid), i=>i.qty);
  if(inCart + qty > p.stock){ toast(`Solo hay ${p.stock} unidades disponibles de ${p.name}.`); return false; }
  const it = S.cart.find(i=>i.key===key);
  if(it) it.qty += qty; else S.cart.push({key, pid, ci, si, qty, name:p.name, color:p.colors[ci]?.n, storage:p.storages?p.storages[si].n:null, unit:unitPrice(p,si)});
  S.co = null; saveCart(); return true;
}
function syncCartPrices(){ // actualiza precios guardados en el carrito con los del catálogo
  S.cart.forEach(i=>{ const p=P(i.pid); if(p) i.unit = unitPrice(p, i.si); });
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
  if(S.cart.some(i=>i.qty > P(i.pid).stock)) return fail('Algunos productos ya no tienen suficiente existencia. Revisa tu carrito.');
  if(co.ship!=='retiro' && (co.addr.trim().length<8 || co.city.trim().length<3)) return fail('Escribe la dirección de entrega y la ciudad.');
  if(co.mode==='financiado'){ const el = eligibility(k.financed); if(!el.ok) return fail(el.why.join(' ')); }
  let pago = null;
  if(co.when==='ahora' && co.method!=='efectivo'){
    const cur = METODOS[co.method].cur;
    const ref = co.ref.trim();
    if(cur==='Bs' ? !/^\d{6,}$/.test(ref) : !/^[A-Za-z0-9]{6,}$/.test(ref)) return fail(cur==='Bs' ? 'La referencia debe tener al menos 6 dígitos.' : 'La confirmación de Zelle debe tener al menos 6 caracteres.');
    const amt = parseAmt(co.amount || (cur==='Bs' ? r2(k.hoy*S.cfg.tasa) : k.hoy));
    if(!(amt>0)) return fail('Escribe el monto que pagaste.');
    if(!co.file) return fail('Adjunta la imagen o PDF del comprobante.');
    pago = {banco: cur==='Bs' ? co.bank : '', referencia: ref, monto_reportado: amt, comprobante_path: await uploadProof(co.file)};
  }
  const payload = { items: S.cart.map(i=>({producto_id:i.pid, color_idx:i.ci, cap_idx:i.si, cantidad:i.qty})),
    modalidad: co.mode, n_cuotas: co.n, inicial_pct: co.ini, envio_metodo: co.ship, direccion: co.addr, ciudad: co.city,
    metodo_pago: co.method, cupon: k.couponOk ? S.coupon : '', pago };
  try{
    const res = await rpc('crear_pedido', {p: payload});
    S.cart = []; saveCart(); S.coupon = ''; S.co = null; S.acct = 'pedidos';
    await refresh();
    toast(pago ? `Pedido ${res.codigo} creado. Te avisaremos cuando verifiquemos tu pago.` : `Pedido ${res.codigo} reservado por ${S.cfg.reservaHoras} horas.`);
    go('cuenta');
  }catch(e){ fail(friendly(e)); }
}
async function submitPay(){
  const err = $('#pm-err'); const cur = METODOS[M.method].cur; const bank = cur==='Bs' ? $('#pm-bank').value : '';
  const ref = $('#pm-ref').value.trim();
  if(cur==='Bs' ? !/^\d{6,}$/.test(ref) : !/^[A-Za-z0-9]{6,}$/.test(ref)){ err.textContent = cur==='Bs' ? 'La referencia debe tener al menos 6 dígitos.' : 'La confirmación de Zelle debe tener al menos 6 caracteres.'; return; }
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
  go: d => go(d.v),
  reload: () => run(async()=>{ await refresh(); toast('Datos actualizados.'); }),
  cat: d => { S.f = {cat:d.v||null, brands:[], max:'', fin:false, stock:false, sort:'rel', q:''}; go('catalogo'); },
  clearf: () => { S.f = {cat:S.f.cat, brands:[], max:'', fin:false, stock:false, sort:'rel', q:''}; render(); },
  pd: d => go('producto', +d.id),
  pcolor: d => { S.pd.color = +d.i; render(); },
  pstor: d => { S.pd.storage = +d.i; render(); },
  pqty: d => { const p = P(S.route.id); S.pd.qty = Math.max(1, Math.min(p.stock, S.pd.qty + +d.d)); render(); },
  add: d => { const pid=+d.id; const onPd = S.route.v==='producto' && S.route.id===pid;
    if(addToCart(pid, onPd?S.pd.color:0, onPd?S.pd.storage:0, onPd?S.pd.qty:1)){ renderChrome(); toast(`${P(pid).name} agregado al carrito.`); } },
  buynow: d => { if(addToCart(+d.id, S.pd.color, S.pd.storage, S.pd.qty)) go('carrito'); },
  cqty: d => { const it = S.cart[+d.i]; const p = P(it.pid); const n = it.qty + +d.d;
    if(n > it.qty && sum(S.cart.filter(i=>i.pid===it.pid),i=>i.qty) >= p.stock){ toast(`Solo hay ${p.stock} unidades disponibles.`); return; }
    it.qty = n; if(it.qty<=0) S.cart.splice(+d.i,1); S.co=null; saveCart(); render(); },
  crem: d => { S.cart.splice(+d.i,1); S.co=null; saveCart(); render(); },
  tocheckout: () => { if(!me()) S.after = 'checkout'; go('checkout'); },
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
      amount: c?r2(c.down+o.shipCost):o.total, kind:'pedido', orderId:o.id, method:o.method}); },
  paycuotas: d => { const c = C(+d.c); const qs = pendingCuotas(c).slice(0, +d.k); const amt = r2(sum(qs, cuotaDue));
    payModal({title: qs.length===1?`Cuota ${qs[0].n} de ${c.n}`:`Liquidar crédito ${c.code}`, desc: qs.map(q=>`Cuota ${q.n}: ${usd(q.amount)}${q.mora?` + ${usd(q.mora)} de mora`:''}`).join(' · '), amount:amt, kind:'cuota', creditId:c.id, count:qs.length}); },
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
  doship: () => run(async()=>{ const g=$('#sh-guia').value.trim(); if(g.length<4){ $('#sh-err').textContent='Ingresa el número de guía.'; return; }
    await rpc('despachar_pedido', {pid:M.oid, p_transporte:$('#sh-cour').value, p_guia:g}); closeModal(); await refresh(); toast('Pedido despachado.'); }),
  deliver: d => run(async()=>{ await rpc('entregar_pedido', {pid:+d.o}); await refresh(); toast('Pedido marcado como entregado.'); }),
  stock: d => run(async()=>{ await rpc('ajustar_stock', {pid:+d.id, delta:+d.d}); await refresh(); }),
  cierre: () => run(async()=>{ const r = await rpc('ejecutar_cierre'); await refresh(); toast(`Cierre ejecutado: ${r.moras} mora(s), ${r.canceladas} reserva(s) cancelada(s), ${r.recordatorios} recordatorio(s).`); }),
  edo: d => estadoCuenta(d.u),
};

/* ===================== eventos ===================== */
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-act]'); if(!b) return;
  if(b.getAttribute('type')==='submit') return;
  e.preventDefault(); ACT[b.dataset.act]?.(b.dataset);
});
$('#ov').addEventListener('click', e=>{ if(e.target.id==='ov') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !$('#ov').hidden) closeModal(); });
document.addEventListener('input', e=>{
  const k = e.target.dataset.in; if(k && S.co){ S.co[k] = e.target.value; }
  if(e.target.id==='co-ini' && S.co){ const v=+e.target.value; const base = coCalc().base; $('#ini-l').textContent = `${v}% · ${usd(r2(base*v/100))}`; }
});
document.addEventListener('change', e=>{
  const t = e.target, on = t.dataset.on; if(!on) return;
  const f = S.f;
  if(on==='fcat'){ f.cat = t.value||null; f.brands=[]; }
  if(on==='fbrand'){ f.brands = t.checked ? [...f.brands, t.value] : f.brands.filter(b=>b!==t.value); }
  if(on==='fmax') f.max = t.value;
  if(on==='ffin') f.fin = t.checked;
  if(on==='fstock') f.stock = t.checked;
  if(on==='fsort') f.sort = t.value;
  if(on==='ship') S.co.ship = t.value;
  if(on==='mode') S.co.mode = t.value;
  if(on==='plan') S.co.n = +t.value;
  if(on==='ini') S.co.ini = +t.value/100;
  if(on==='method'){ S.co.method = t.value; S.co.amount=''; }
  if(on==='later') S.co.later = t.checked;
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
  if(id==='searchf'){ const qv=$('#q').value; S.f = {cat:null, brands:[], max:'', fin:false, stock:false, sort:'rel', q:qv}; go('catalogo'); render(); }
  if(id==='couponf'){ S.coupon = $('#cp').value.trim().toUpperCase(); S.co=null; render(); }
  if(id==='loginf') run(async()=>{
    const em=$('#l-email').value.trim().toLowerCase(), pw=$('#l-pass').value, er=$('#l-err');
    if(!em || !pw){ er.textContent='Escribe tu correo y contraseña.'; return; }
    const {data, error} = await sb.auth.signInWithPassword({email:em, password:pw});
    if(error){ er.textContent = /Invalid login/i.test(error.message) ? 'Correo o contraseña incorrectos.' : /not confirmed/i.test(error.message) ? 'Confirma tu correo con el enlace que te enviamos antes de ingresar.' : friendly(error); return; }
    S.session = data.session; await loadPrivate();
    toast(`Bienvenido, ${me()?.name.split(' ')[0] || ''}.`); afterLogin();
  });
  if(id==='regf') run(async()=>{
    const name=$('#r-name').value.trim().replace(/\s+/g,' '), ced=$('#r-ced').value.trim().toUpperCase().replace(/\s/g,''), em=$('#r-email').value.trim().toLowerCase(), tel=$('#r-tel').value.trim(), pw=$('#r-pass').value, er=$('#r-err');
    if(name.split(' ').length<2) return er.textContent='Escribe tu nombre y apellido.';
    if(!/^[VEJ]-?\d{1,2}\.?\d{3}\.?\d{3}$/.test(ced)) return er.textContent='La cédula debe tener el formato V-12.345.678.';
    if(!/^\S+@\S+\.\S+$/.test(em)) return er.textContent='Escribe un correo válido.';
    if(!/^0\d{3}-?\d{3}-?\d{4}$/.test(tel)) return er.textContent='El teléfono debe tener el formato 0414-000-0000.';
    if(pw.length<8 || !/\d/.test(pw)) return er.textContent='La contraseña debe tener al menos 8 caracteres y un número.';
    if(!$('#r-terms').checked) return er.textContent='Debes aceptar los términos.';
    const cedNorm = ced[0] + '-' + ced.replace(/\D/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    const {data, error} = await sb.auth.signUp({email:em, password:pw, options:{data:{nombre:name, cedula:cedNorm, telefono:tel}, emailRedirectTo: location.origin + location.pathname}});
    if(error){ er.textContent = /already registered|already been registered/i.test(error.message) ? 'Ya existe una cuenta con ese correo. Ingresa con tu contraseña.'
      : /Database error/i.test(error.message) ? 'Esa cédula ya está registrada en otra cuenta.' : /Password/i.test(error.message) ? 'La contraseña es muy débil. Usa al menos 8 caracteres con letras y números.' : friendly(error); return; }
    if(!data.session){ er.textContent=''; e.target.reset(); toast('Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego ingresa.'); return; }
    S.session = data.session; await loadPrivate(); toast(`Cuenta creada. Bienvenido, ${name.split(' ')[0]}.`); afterLogin();
  });
  if(id==='newpassf') run(async()=>{
    const pw=$('#np-pass').value, er=$('#np-err');
    if(pw.length<8 || !/\d/.test(pw)) return er.textContent='La contraseña debe tener al menos 8 caracteres y un número.';
    const {error} = await sb.auth.updateUser({password:pw});
    if(error){ er.textContent = friendly(error); return; }
    toast('Contraseña actualizada.'); await refresh(); afterLogin();
  });
  if(id==='dataf') run(async()=>{ await rpc('actualizar_mis_datos', {p_telefono:$('#d-tel').value, p_direccion:$('#d-addr').value, p_ciudad:$('#d-city').value}); await refresh(); toast('Datos actualizados.'); });
  if(id==='cfgf') run(async()=>{
    const n = x => parseAmt($('#'+x).value);
    const planes = {}; document.querySelectorAll('[data-plan]').forEach(i=>planes[i.dataset.plan] = r2(parseAmt(i.value)/100));
    const datos = {}; document.querySelectorAll('[data-dp]').forEach(i=>datos[i.dataset.dp] = i.value.trim());
    const v = {tasa:n('c-tasa'), mora:n('c-mora'), inicial_min:r2(n('c-ini')/100), min_financiable:n('c-min'), cupo_base:n('c-cupo'), planes, datos_pago:datos};
    if(!(v.tasa>0) || !(v.mora>=0) || !(v.inicial_min>=0 && v.inicial_min<=0.9) || !(v.min_financiable>=0) || !(v.cupo_base>=0) || Object.values(planes).some(x=>!(x>=0&&x<=1))){
      $('#c-err').textContent='Revisa los valores: deben ser números válidos y los porcentajes entre 0 y 100.'; return; }
    await rpc('actualizar_config', {p:v}); await refresh(); toast('Configuración guardada.');
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
