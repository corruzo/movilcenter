/* =====================================================================
   CONFIGURACIÓN DE LA TIENDA
   Este es el único archivo que necesitas editar.
   ===================================================================== */
window.TIENDA = {
  // 1. Datos de conexión de Supabase (ver LEEME.md, paso 4)
  supabaseUrl: 'https://qyryldoieutnbwpjgeuu.supabase.co',        // ej. https://abcdefghijk.supabase.co
  supabaseAnonKey: 'sb_publishable_RUix41H20CEa6AyZKHYdtw_hpHqdW67',       // la "Publishable key" (sb_publishable_...) o la "anon public". Es pública, no es secreta.
                                                  // NUNCA pegues aquí la "Secret key" ni la "service_role".

  // 2. Datos de la marca
  marca: {
    a: 'Movil',                    // primera parte del nombre (negro)
    b: 'Center',                   // segunda parte del nombre (dorado)
    legal: 'MovilCenter C.A.',     // razón social
    rif: 'J-00000000-0',
    ciudad: 'Caracas',
    whatsapp: '584140000000',      // número con código de país, sin + ni espacios
    correo: 'ventas@ejemplo.com',
    horario: 'Lunes a sábado, 9:00 a 18:00',
    logo: ''                       // opcional: ruta de tu logo, ej. 'logo.png' (súbelo junto a estos archivos)
  }
};
