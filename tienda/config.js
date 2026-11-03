/* =====================================================================
   CONFIGURACIÓN DE LA TIENDA
   Este es el único archivo que necesitas editar.
   ===================================================================== */
window.TIENDA = {
  // 1. Datos de conexión de Supabase (ver LEEME.md, paso 4)
  supabaseUrl: 'https://qyryldoieutnbwpjgeuu.supabase.co',        // ej. https://abcdefghijk.supabase.co
  supabaseAnonKey: 'sb_publishable_RUix41H20CEa6AyZKHYdtw_hpHqdW67',       // la "Publishable key" (sb_publishable_...) o la "anon public". Es pública, no es secreta.
                                                  // NUNCA pegues aquí la "Secret key" ni la "service_role".

  // 2. Datos generales de la página. El nombre, logo, WhatsApp, RIF y datos de pago
  //    de cada tienda se cambian desde el panel de administración > Configuración.
  marca: {
    legal: "Priority One y Papa's Store",   // aparece en el pie de página
    ciudad: 'Caracas'                       // se muestra si una tienda no tiene dirección
  }
};
