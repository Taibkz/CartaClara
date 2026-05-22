import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock data for the robust demo mode
export const MOCK_DOCUMENTS = {
  multa: {
    tipoDocumento: "Multa de Tránsito (Exceso de Velocidad)",
    gravedad: "alta",
    resumenHumano: "Has superado el límite de velocidad en la autovía A-92 (km 124) conduciendo a 138 km/h en una zona de 120 km/h. La multa es de 100€, pero si la pagas pronto se queda a la mitad (50€). No conlleva pérdida de puntos en el carnet de conducir.",
    montoAPagar: 100,
    montoProntoPago: 50,
    fechaLimite: "2026-06-15",
    accionesRequeridas: [
      "Verifica si el vehículo de la foto es el tuyo y la matrícula es correcta.",
      "Si decides pagar rápido para ahorrar el 50%, accede a la web de la DGT (dgt.es) o llama al 060 con el número de expediente.",
      "Si crees que no eres tú o hay un error, puedes presentar una alegación antes de la fecha límite, pero perderás el descuento del 50%."
    ],
    esPosibleEstafa: false,
    motivoSospecha: null,
    traducciones: {
      en: "Speeding ticket on highway A-92. €100 fine, or €50 if paid early. No points lost. Pay via dgt.es or by calling 060.",
      ar: "مخالفة سرعة على الطريق السريع A-92. الغرامة 100 يورو، أو 50 يورو في حال الدفع السريع. لا توجد نقاط مخصومة. ادفع عبر dgt.es.",
      ro: "Amendă de viteză pe autostrada A-92. Amendă de 100 €, sau 50 € dacă este plătită rapid. Nu se pierd puncte. Plătiți pe dgt.es.",
      fr: "Amende pour excès de vitesse sur l'A-92. 100€ d'amende, ou 50€ si payée rapidement. Pas de points retirés. Payez sur dgt.es.",
      zh: "A-92高速公路上超速罚单。罚款100欧元，若快速付款则为50欧元。不扣分。请访问dgt.es付款。"
    }
  },
  hacienda: {
    tipoDocumento: "Carta de la Agencia Tributaria (Hacienda - IRPF)",
    gravedad: "media",
    resumenHumano: "Hacienda te envía una propuesta de devolución de la declaración de la renta. Han calculado que te corresponde un reembolso de 324,50€ a tu favor. No debes pagar nada, al contrario, te van a ingresar ese dinero en tu cuenta bancaria registrada.",
    montoAPagar: 0,
    montoDevolucion: 324.50,
    fechaLimite: "2026-07-01",
    accionesRequeridas: [
      "Entra en la Sede Electrónica de la Agencia Tributaria con tu certificado digital o Clave PIN.",
      "Verifica que el número de cuenta bancaria (IBAN) que tienen registrado sea el correcto.",
      "Si todo es correcto, simplemente espera a que realicen la transferencia (suele tardar unas semanas)."
    ],
    esPosibleEstafa: false,
    motivoSospecha: null,
    traducciones: {
      en: "Tax return proposal from Hacienda. They owe you €324.50. You do not need to pay anything. Verify your bank account on their website.",
      ar: "رسالة من مصلحة الضرائب (Hacienda). يستحق لك استرداد ضريبي بقيمة 324.50 يورو. لا داعي لدفع أي شيء. تحقق من حسابك البنكي.",
      ro: "Propunere de returnare a taxelor de la Hacienda. Vă datorează 324,50 €. Nu trebuie să plătiți nimic. Verificați contul bancar.",
      fr: "Proposition de remboursement d'impôt par la Hacienda. Ils vous doivent 324,50€. Rien à payer. Vérifiez votre compte bancaire.",
      zh: "税务局（Hacienda）退税建议书。他们应退还您324.50欧元。您无需支付任何费用。请验证您的银行账户。"
    }
  },
  cita_medica: {
    tipoDocumento: "Citación Médica (Servicio Andaluz de Salud)",
    gravedad: "baja",
    resumenHumano: "Tienes una cita programada para una consulta de Cardiología en el Hospital Ruiz de Alda en Granada. La cita es el jueves 18 de junio a las 11:30 en la consulta número 4 de la segunda planta.",
    montoAPagar: 0,
    fechaLimite: "2026-06-18",
    accionesRequeridas: [
      "Acude al Hospital Ruiz de Alda 15 minutos antes de la hora (11:30).",
      "Lleva tu tarjeta sanitaria física o digital en el móvil.",
      "Pasa tu tarjeta por el lector del dispensador de turnos en la entrada para registrar tu llegada.",
      "Si no puedes asistir, cancela o cambia la cita llamando al número indicado o mediante la app Salud Responde."
    ],
    esPosibleEstafa: false,
    motivoSospecha: null,
    traducciones: {
      en: "Cardiology appointment at Ruiz de Alda Hospital in Granada on June 18 at 11:30. Bring your health card. Cancel via Salud Responde if needed.",
      ar: "موعد في عيادة القلب بمستشفى Ruiz de Alda في غرناطة يوم 18 يونيو الساعة 11:30. أحضر بطاقتك الصحية.",
      ro: "Programare la cardiologie la Spitalul Ruiz de Alda din Granada pe 18 iunie la 11:30. Aduceți cardul de sănătate.",
      fr: "Rendez-vous en cardiologie à l'hôpital Ruiz de Alda à Grenade le 18 juin à 11h30. Apportez votre carte de santé.",
      zh: "6月18日11:30在格拉纳达Ruiz de Alda医院的心脏科预约。请携带您的医保卡。"
    }
  },
  estafa: {
    tipoDocumento: "Carta Sospechosa de Fraude / Phishing Postal",
    gravedad: "fraude",
    resumenHumano: "¡CUIDADO! Esta carta aparenta ser de Correos reclamando el pago de 2,99€ de tasas de aduana por un paquete pendiente. Sin embargo, contiene un código QR sospechoso que te redirige a una web falsa para robar los datos de tu tarjeta. ES UNA ESTAFA.",
    montoAPagar: 2.99,
    fechaLimite: "Urgente",
    accionesRequeridas: [
      "NO escanees el código QR que viene en la carta.",
      "NO introduzcas los datos de tu tarjeta bancaria en ningún enlace de este documento.",
      "Destruye la carta o denúnciala a la Policía Nacional o al INCIBE (Instituto Nacional de Ciberseguridad).",
      "Recuerda que Correos nunca cobra aduanas mediante cartas urgentes sin remitente oficial claro ni datos personales tuyos."
    ],
    esPosibleEstafa: true,
    motivoSospecha: "La carta carece de tus datos personales exactos (dice 'Estimado vecino'), utiliza un lenguaje alarmista para forzar un pago rápido, el enlace QR no pertenece a la web oficial correos.es, y el remitente es un apartado de correos anónimo.",
    traducciones: {
      en: "WARNING: Fake letter claiming to be from Correos (Post Office) asking for €2.99. It's a scam! Do not scan the QR code or enter bank details.",
      ar: "تحذير: رسالة مزيفة تدعي أنها من البريد (Correos) تطلب دفع 2.99 يورو. إنها عملية احتيال! لا تمسح رمز QR.",
      ro: "ATENȚIE: Scrisoare falsă pretinzând a fi de la Correos cerând 2,99 €. Este o înșelătorie! Nu scanați codul QR.",
      fr: "ATTENTION: Fausse lettre prétendant venir de Correos demandant 2,99€. C'est une arnaque! Ne scannez pas le QR code.",
      zh: "警告：冒充邮局（Correos）要求支付2.99欧元的虚假信件。这是一个骗局！请勿扫描二维码。"
    }
  },
  publicidad: {
    tipoDocumento: "Carta Comercial (Publicidad / Oferta de Fibra)",
    gravedad: "baja",
    resumenHumano: "Es una carta publicitaria de una compañía telefónica ofreciendo un paquete de Fibra y Móvil en oferta. No es ninguna multa, ni recibo, ni tienes ninguna obligación. Es correo comercial que puedes tirar a la basura si no te interesa.",
    montoAPagar: 0,
    fechaLimite: null,
    accionesRequeridas: [
      "Ignora la carta si no estás interesado en cambiar de compañía telefónica.",
      "Si te interesa la oferta, llama al número oficial de la compañía (nunca uses números no verificados).",
      "Deposita el papel en el contenedor azul de reciclaje."
    ],
    esPosibleEstafa: false,
    motivoSospecha: null,
    traducciones: {
      en: "Advertising letter from a telecom company offering fiber optic. It is not a bill or fine. You can safely recycle it.",
      ar: "رسالة إعلانية من شركة اتصالات تعرض باقة ألياف بصرية. ليست فاتورة أو مخالفة. يمكنك التخلص منها بأمان.",
      ro: "Scrisoare publicitară de la o companie de telecomunicații. Nu este o factură sau amendă. O puteți recicla în siguranță.",
      fr: "Lettre publicitaire d'un opérateur télécom proposant une offre fibre. Ce n'est ni une facture ni une amende. Vous pouvez la jeter.",
      zh: "电信公司提供光纤套餐的广告信。不是账单或罚单。您可以安全地将其回收。"
    }
  }
};

/**
 * Convierte un objeto File a formato compatible con Gemini API (base64)
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(",")[1],
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analiza un documento usando la API de Gemini (o modo mock si se indica)
 * @param {File} file - Archivo de imagen o PDF
 * @param {string} apiKey - Clave de la API de Gemini
 * @param {boolean} isDemoMode - Si debe usar los mocks de prueba offline
 * @param {string} mockKey - Clave del mock a usar en modo demo
 */
export const analizarDocumento = async (file, apiKey, isDemoMode = false, mockKey = null) => {
  if (isDemoMode) {
    // Simulamos un retraso de red para dar efecto de escaneo
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    if (mockKey && MOCK_DOCUMENTS[mockKey]) {
      return MOCK_DOCUMENTS[mockKey];
    }
    // Por defecto devolvemos la multa si no se especificó un mock
    return MOCK_DOCUMENTS.multa;
  }

  if (!apiKey) {
    throw new Error("Se requiere una API Key de Gemini. Introduce una o activa el 'Modo Demo'.");
  }

  try {
    // Inicializar el SDK de Google Generative AI
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Preparar el archivo
    const imagePart = await fileToGenerativePart(file);

    const systemPrompt = `
    Eres 'CartaClara', un asistente de inteligencia social diseñado en Granada para traducir el lenguaje legal, burocrático y administrativo español a un lenguaje sumamente sencillo y comprensible para cualquier ciudadano común (especialmente personas mayores, inmigrantes y personas vulnerables).

    Analiza la imagen de la carta adjunta y devuelve ÚNICAMENTE un objeto JSON válido con los siguientes campos estrictos (no incluyas markdown, solo el objeto JSON plano):
    {
      "tipoDocumento": "string (Ej: Multa de Tráfico, Carta de Hacienda, Cita Médica, Publicidad, Estafa de Correos...)",
      "gravedad": "string ('alta' si requiere pagar o responder con urgencia, 'media' si requiere trámite pero sin peligro inmediato, 'baja' si es informativo o publicitario, 'fraude' si parece una estafa)",
      "resumenHumano": "string (explicación en 2-3 frases muy sencillas y empáticas en español, explicando qué es la carta en un lenguaje llano, libre de tecnicismos burocráticos)",
      "montoAPagar": number o null (monto exacto a pagar en euros si aplica, sino null o 0)",
      "montoProntoPago": number o null (monto con descuento por pago rápido si aplica, ej. en multas, sino null)",
      "montoDevolucion": number o null (monto a recibir a tu favor si Hacienda u otra entidad te devuelve dinero, sino null)",
      "fechaLimite": "string o null (fecha límite de pago o acción en lenguaje claro y legible en español, ej: '15 de Junio, 2026', o null)",
      "accionesRequeridas": ["string" (lista de 2 a 4 pasos súper sencillos y numerados que el ciudadano debe seguir para resolver el trámite)],
      "esPosibleEstafa": boolean (true si detectas indicadores de phishing, cuentas falsas, códigos QR maliciosos, o suplantación de identidad comercial),
      "motivoSospecha": "string o null (explicación de por qué es sospechoso si esPosibleEstafa es true, sino null)",
      "traducciones": {
        "en": "string (resumen de 1 frase en inglés)",
        "ar": "string (resumen de 1 frase en árabe)",
        "ro": "string (resumen de 1 frase en rumano)",
        "fr": "string (resumen de 1 frase en francés)",
        "zh": "string (resumen de 1 frase en chino)"
      }
    }

    Es sumamente importante que el tono de 'resumenHumano' sea claro, tranquilizador, empático y directo. Si hay un pago obligatorio, explícalo sin rodeos. Si es una estafa, enciende todas las alarmas en el resumen.

    CRITICAL: No utilices NINGÚN emoji en ninguna de las respuestas de texto del objeto JSON (como resumenHumano, tipoDocumento o accionesRequeridas). Toda la redacción debe ser sobria, limpia y profesional, ya que la aplicación se encarga de inyectar los iconos de interfaz nativos correspondientes.
    `;

    const result = await model.generateContent([systemPrompt, imagePart]);
    const responseText = result.response.text();
    
    // Limpiar posibles bloques de markdown en la respuesta
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error al analizar con Gemini:", error);
    throw new Error("No se pudo analizar el documento. Asegúrate de que la API Key es válida y que la imagen es clara.");
  }
};
