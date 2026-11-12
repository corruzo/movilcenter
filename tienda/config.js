/* =====================================================================
   CONFIGURACIÓN DE LA TIENDA
   Este es el único archivo que necesitas editar.
   ===================================================================== */
window.TIENDA = {
  // 1. Datos de conexión de Supabase (ver LEEME.md, paso 4)
  supabaseUrl: 'https://ylkgjujchkdvtnhbqqmb.supabase.co',        // ej. https://abcdefghijk.supabase.co
  supabaseAnonKey: 'sb_publishable_sz3Z-qq4_gVUoF3sKOyoJQ_byOQ1iYC',       // la "Publishable key" (sb_publishable_...) o la "anon public". Es pública, no es secreta.
  // Ruta propia que reenvía a Supabase (ver vercel.json). Así la tienda funciona aunque una red bloquee supabase.co.
  // Si cambias de proyecto de Supabase, cambia también la dirección en vercel.json.
  proxy: '/sb',
                                                  // NUNCA pegues aquí la "Secret key" ni la "service_role".

  // 2. Datos generales de la página. El nombre, logo, WhatsApp, RIF y datos de pago
  //    de cada tienda se cambian desde el panel de administración > Configuración.
  marca: {
    legal: "Priority One y Papa's Store",   // aparece en el pie de página
    ciudad: 'Caracas'                       // se muestra si una tienda no tiene dirección
  }
};
