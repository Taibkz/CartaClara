import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Upload, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Calendar, 
  History, 
  Sparkles, 
  Key, 
  RotateCcw, 
  ShieldAlert, 
  Trash2, 
  HelpCircle,
  Clock,
  Sparkle
} from "lucide-react";
import { analizarDocumento, MOCK_DOCUMENTS } from "./services/gemini";
import AudioPlayer from "./components/AudioPlayer";
import LanguageSelector from "./components/LanguageSelector";

export default function App() {
  // App States
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true); // Demo mode active by default for presentation ease!
  const [selectedMockKey, setSelectedMockKey] = useState("multa");
  
  // Navigation & Flow
  // Views: 'home' (dashboard/history), 'scan' (camera/file-drop), 'loading' (processing animation), 'result' (detailed info)
  const [currentView, setCurrentView] = useState("home"); 
  const [historial, setHistorial] = useState([]);
  
  // Document Scan States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingText, setLoadingText] = useState("Analizando carta...");
  const [resultado, setResultado] = useState(null);
  const [activeTranslationLang, setActiveTranslationLang] = useState("es");

  // Camera Integration Refs & States
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Load API Key and History from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("cartaclara_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsDemoMode(false); // If they loaded a key, disable demo by default
    }
    
    const savedHistorial = localStorage.getItem("cartaclara_historial");
    if (savedHistorial) {
      setHistorial(JSON.parse(savedHistorial));
    } else {
      // Pre-cargar historial con algunos ejemplos para que la UI no se vea vacía e inútil
      const defaultHistory = [
        {
          id: "hist_1",
          fechaEscaneo: "Hace 2 horas",
          tipoDocumento: "Multa de Tránsito (Exceso de Velocidad)",
          gravedad: "alta",
          montoAPagar: 100,
          fechaLimite: "2026-06-15",
          datosCompletos: MOCK_DOCUMENTS.multa
        },
        {
          id: "hist_2",
          fechaEscaneo: "Ayer",
          tipoDocumento: "Carta de la Agencia Tributaria (Hacienda)",
          gravedad: "media",
          montoAPagar: 0,
          fechaLimite: "2026-07-01",
          datosCompletos: MOCK_DOCUMENTS.hacienda
        },
        {
          id: "hist_3",
          fechaEscaneo: "Hace 3 días",
          tipoDocumento: "Carta Sospechosa de Fraude / Phishing",
          gravedad: "fraude",
          montoAPagar: 2.99,
          fechaLimite: "Urgente",
          datosCompletos: MOCK_DOCUMENTS.estafa
        }
      ];
      setHistorial(defaultHistory);
      localStorage.setItem("cartaclara_historial", JSON.stringify(defaultHistory));
    }
  }, []);

  // Save API Key to localStorage
  const handleSaveApiKey = (e) => {
    e.preventDefault();
    localStorage.setItem("cartaclara_api_key", apiKey);
    setShowKeyInput(false);
    setIsDemoMode(false);
    alert("API Key de Gemini guardada localmente de forma segura. ¡Ya puedes hacer análisis reales!");
  };

  // Delete API Key
  const handleDeleteApiKey = () => {
    localStorage.removeItem("cartaclara_api_key");
    setApiKey("");
    setIsDemoMode(true);
    alert("API Key eliminada. Se ha vuelto al 'Modo Demo'.");
  };

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Detener cámara si estaba activa
      stopCamera();
    }
  };

  // Webcam Capture Support
  const startCamera = async () => {
    setCameraError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Usar cámara trasera en móviles preferentemente
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Error accediendo a la cámara:", err);
      setCameraError("No pudimos abrir la cámara. Sube una foto o una carta ya guardada.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    // Dibujar frame de video en canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Obtener data URL
    canvas.toBlob((blob) => {
      const file = new File([blob], "captura_carta.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }, "image/jpeg");
  };

  // Trigger analysis
  const handleScanSubmit = async () => {
    if (!selectedFile && !isDemoMode) {
      alert("Por favor, haz una foto o selecciona una carta antes de escanear.");
      return;
    }

    setCurrentView("loading");
    setActiveTranslationLang("es");

    // Secuencia divertida de textos para dar efecto wow de que la IA está descifrando burocracia
    const stepsTexts = [
      "Leyendo el documento...",
      "Traduciendo del lenguaje de Hacienda al humano...",
      "Identificando fechas de vencimiento y montos...",
      "Verificando indicadores de fraudes o estafas...",
      "Preparando tu resumen simplificado..."
    ];

    let stepIdx = 0;
    const textInterval = setInterval(() => {
      if (stepIdx < stepsTexts.length - 1) {
        stepIdx++;
        setLoadingText(stepsTexts[stepIdx]);
      }
    }, 500);

    try {
      const data = await analizarDocumento(
        selectedFile,
        apiKey,
        isDemoMode,
        selectedMockKey
      );

      setResultado(data);
      
      // Guardar en el historial si es un análisis real o si queremos simularlo
      const nuevoHistorialItem = {
        id: "hist_" + Date.now(),
        fechaEscaneo: "Ahora mismo",
        tipoDocumento: data.tipoDocumento,
        gravedad: data.gravedad,
        montoAPagar: data.montoAPagar || 0,
        fechaLimite: data.fechaLimite || "No aplica",
        datosCompletos: data
      };

      const nuevoHistorial = [nuevoHistorialItem, ...historial];
      setHistorial(nuevoHistorial);
      localStorage.setItem("cartaclara_historial", JSON.stringify(nuevoHistorial));

      setCurrentView("result");
    } catch (err) {
      alert(err.message || "Ocurrió un error al procesar el archivo.");
      setCurrentView("scan");
    } finally {
      clearInterval(textInterval);
    }
  };

  // Select item from history
  const handleSelectHistory = (item) => {
    setResultado(item.datosCompletos);
    setActiveTranslationLang("es");
    setCurrentView("result");
  };

  // Delete history item
  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation(); // Evitar que abra el detalle
    if (confirm("¿Estás seguro de eliminar este registro del historial?")) {
      const nuevoHistorial = historial.filter(item => item.id !== id);
      setHistorial(nuevoHistorial);
      localStorage.setItem("cartaclara_historial", JSON.stringify(nuevoHistorial));
    }
  };

  // Export to Calendar (Add to Calendar button effect)
  const handleCalendarExport = () => {
    if (!resultado) return;
    const title = `VENCIMIENTO: ${resultado.tipoDocumento}`;
    const desc = `Acción requerida simplificada por CartaClara: ${resultado.accionesRequeridas[0]}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&sf=true&output=xml`;
    window.open(url, "_blank");
  };

  return (
    <div className="app-container">
      
      {/* HEADER PRINCIPAL */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <h1 className="brand-name">CartaClara</h1>
            <span className="brand-badge">Summer of Code Granada</span>
          </div>
        </div>
        
        {/* Toggle para configurar API Key */}
        <button 
          onClick={() => setShowKeyInput(!showKeyInput)} 
          className={`toggle-btn ${showKeyInput ? "active" : ""}`}
          title="Configurar clave Gemini"
        >
          <Key size={18} />
        </button>
      </header>

      {/* CARD DE CONFIGURACIÓN DE API KEY (ACCORDION) */}
      {showKeyInput && (
        <div className="config-card">
          <div className="config-row">
            <span className="config-title">
              <Key size={14} /> Gemini 2.5 API Key (Gratuita)
            </span>
            {apiKey && (
              <button 
                onClick={handleDeleteApiKey} 
                style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <Trash2 size={12} /> Borrar
              </button>
            )}
          </div>
          
          <form onSubmit={handleSaveApiKey} className="config-row" style={{ gap: "0.5rem" }}>
            <input 
              type="password" 
              placeholder={apiKey ? "••••••••••••••••••••••••" : "Escribe tu API Key de Gemini..."} 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              className="input-key"
              required={!apiKey}
            />
            <button type="submit" className="lang-btn active" style={{ padding: "0.5rem 1rem" }}>
              Guardar
            </button>
          </form>
          
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            ¿No tienes una clave? Consíguela gratis en 1 minuto buscando "Google AI Studio" o mantén activo el <strong>Modo Demo</strong> para usar cartas de prueba.
          </p>
        </div>
      )}

      {/* BANNER DE SELECCIÓN DE MODO DEMO / PRESENTACIÓN */}
      <div className="config-card" style={{ borderLeft: "4px solid var(--accent-purple)", background: "rgba(139, 92, 246, 0.03)" }}>
        <div className="config-row">
          <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#c084fc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkle size={14} /> Demostración Summer of Code
          </span>
          <button 
            onClick={() => setIsDemoMode(!isDemoMode)} 
            className={`toggle-btn ${isDemoMode ? "active" : ""}`}
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", fontWeight: "700" }}
          >
            {isDemoMode ? "MODO DEMO ACTIVO" : "MODO IA REAL (API)"}
          </button>
        </div>
        
        {isDemoMode && (
          <div className="quick-demo-wrapper" style={{ marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Selecciona una carta pre-cargada para simular el análisis al instante:
            </span>
            <div className="quick-demo-tags">
              <button 
                onClick={() => setSelectedMockKey("multa")} 
                className={`demo-tag ${selectedMockKey === "multa" ? "active" : ""}`}
              >
                🚨 Multa Tráfico
              </button>
              <button 
                onClick={() => setSelectedMockKey("hacienda")} 
                className={`demo-tag ${selectedMockKey === "hacienda" ? "active" : ""}`}
              >
                🏦 Hacienda
              </button>
              <button 
                onClick={() => setSelectedMockKey("cita_medica")} 
                className={`demo-tag ${selectedMockKey === "cita_medica" ? "active" : ""}`}
              >
                🏥 Cita Médica
              </button>
              <button 
                onClick={() => setSelectedMockKey("estafa")} 
                className={`demo-tag ${selectedMockKey === "estafa" ? "active" : ""}`}
              >
                🛑 Posible Estafa
              </button>
              <button 
                onClick={() => setSelectedMockKey("publicidad")} 
                className={`demo-tag ${selectedMockKey === "publicidad" ? "active" : ""}`}
              >
                📦 Publicidad
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VISTA 1: DASHBOARD DE INICIO Y HISTORIAL */}
      {currentView === "home" && (
        <div className="main-dashboard">
          
          <div className="welcome-hero">
            <h2 className="welcome-title">Entiende tus cartas al instante</h2>
            <p className="welcome-subtitle">
              Saca una foto a cualquier carta oficial, multa o citación, y nuestro asistente social con IA te la explicará en lenguaje humano sencillo.
            </p>
          </div>

          {/* Historial de cartas procesadas */}
          <div className="history-section">
            <h3 style={{ fontSize: "1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <History size={16} /> Tu historial de documentos
            </h3>
            
            {historial.length === 0 ? (
              <div className="promo-box" style={{ padding: "2rem 1rem" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>Aún no has analizado ninguna carta.</p>
                <p style={{ fontSize: "0.75rem" }}>¡Pulsa el botón flotante de abajo para escanear tu primer documento!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {historial.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleSelectHistory(item)} 
                    className="history-card"
                  >
                    <div className="history-info">
                      <span className="history-title">{item.tipoDocumento}</span>
                      <span className="history-meta" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Clock size={10} /> {item.fechaEscaneo} 
                        {item.montoAPagar > 0 && `• 💰 ${item.montoAPagar}€`}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className={`history-indicator indicator-${item.gravedad}`} />
                      <button 
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                        title="Eliminar de historial"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="promo-box">
            🏆 <strong>¿Por qué CartaClara?</strong> Apoya a personas mayores contra la exclusión digital y a inmigrantes traduciendo cartas complejas a su idioma nativo de forma clara y accesible.
          </div>

          {/* Botón flotante/principal para escanear */}
          <button 
            onClick={() => {
              setCurrentView("scan");
              // Intentar iniciar la cámara por defecto si el usuario está en móvil
              startCamera();
            }} 
            className="btn-scan-main"
          >
            <Camera size={20} /> Escanear Nueva Carta
          </button>
        </div>
      )}

      {/* VISTA 2: CAPTURA POR CÁMARA O CARGA DE ARCHIVO */}
      {currentView === "scan" && (
        <div className="main-dashboard" style={{ animation: "slideUp 0.3s ease" }}>
          
          <button 
            onClick={() => { stopCamera(); setCurrentView("home"); }} 
            className="btn-back"
          >
            <ArrowLeft size={16} /> Volver al Inicio
          </button>

          <h2 style={{ fontSize: "1.3rem", fontWeight: "700", textAlign: "center", marginBottom: "0.5rem" }}>
            Capturar o Subir Carta
          </h2>

          {/* Zona de escáner cámara / visualizador de preview */}
          <div className="scanner-container">
            {cameraActive ? (
              // Video Stream activo de la webcam
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Animación láser decorativa de escaneo */}
                <div className="laser-line" />
                
                <div style={{ position: "absolute", bottom: "1.25rem", left: "0", right: "0", display: "flex", justifyContent: "center", gap: "1rem", zIndex: 12 }}>
                  <button 
                    onClick={capturePhoto} 
                    className="btn-scan-main" 
                    style={{ width: "auto", margin: 0, padding: "0.75rem 1.5rem" }}
                  >
                    📸 Capturar Foto
                  </button>
                  <button 
                    onClick={stopCamera} 
                    className="lang-btn active"
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "50px", background: "rgba(10, 11, 16, 0.8)", border: "1px solid var(--border-color)", color: "#fff" }}
                  >
                    Subir Archivo
                  </button>
                </div>
              </>
            ) : previewUrl ? (
              // Vista previa del archivo seleccionado / foto capturada
              <>
                <img src={previewUrl} alt="Vista previa del documento" className="preview-image" />
                <div className="laser-line" />
                <div style={{ position: "absolute", bottom: "1.25rem", left: "0", right: "0", display: "flex", justifyContent: "center", gap: "1.25rem", padding: "0 1.25rem", zIndex: 12 }}>
                  <button 
                    onClick={() => { setPreviewUrl(null); setSelectedFile(null); startCamera(); }}
                    className="lang-btn"
                    style={{ flex: 1, padding: "0.85rem", background: "rgba(10, 11, 16, 0.85)", color: "#fff" }}
                  >
                    Repetir Foto
                  </button>
                </div>
              </>
            ) : (
              // Estado inicial: drag and drop de archivos / iniciar cámara
              <label className="scanner-info">
                <div className="scanner-icon-circle">
                  <Upload size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "0.25rem" }}>
                    Arrastra o selecciona tu carta
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Soporta imágenes JPG, PNG o documentos PDF
                  </p>
                </div>
                
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileChange} 
                  className="hidden-input"
                />
                
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); startCamera(); }}
                  className="lang-btn active"
                  style={{ marginTop: "0.5rem", padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <Camera size={14} /> Usar Cámara en Vivo
                </button>
              </label>
            )}
            
            {cameraError && !previewUrl && (
              <div style={{ position: "absolute", bottom: "1rem", padding: "0 1.5rem", textAlign: "center", width: "100%", zIndex: 5 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-danger)", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.4rem 0.8rem", borderRadius: "8px", display: "inline-block" }}>
                  {cameraError}
                </span>
              </div>
            )}
          </div>

          {/* Información y botón para iniciar análisis */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
            {isDemoMode ? (
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>
                ⚡ Modo Demo: Se analizará la carta de prueba: <strong>{MOCK_DOCUMENTS[selectedMockKey].tipoDocumento}</strong>.
              </p>
            ) : (
              selectedFile && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>
                  📂 Archivo listo: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )
            )}

            <button 
              onClick={handleScanSubmit} 
              className="btn-scan-main"
              disabled={!selectedFile && !isDemoMode}
              style={{ opacity: (!selectedFile && !isDemoMode) ? 0.6 : 1 }}
            >
              🚀 Comenzar Análisis Inteligente
            </button>
          </div>
        </div>
      )}

      {/* VISTA 3: PROCESANDO ANALISIS (LOADING) */}
      {currentView === "loading" && (
        <div className="loading-box" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div className="loading-circle" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h2 className="scanner-feedback">{loadingText}</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "260px", margin: "0 auto" }}>
              Nuestra IA está interpretando la jerga burocrática y legal para hacerla comprensible.
            </p>
          </div>
        </div>
      )}

      {/* VISTA 4: RESULTADO DETALLADO */}
      {currentView === "result" && resultado && (
        <div className="results-container">
          
          <button 
            onClick={() => { setPreviewUrl(null); setSelectedFile(null); setCurrentView("home"); }} 
            className="btn-back"
          >
            <ArrowLeft size={16} /> Volver al Inicio
          </button>

          {/* 1. Tarjeta superior del semáforo de urgencia */}
          <div className={`severity-card severity-${resultado.gravedad}`}>
            <div className="severity-header">
              <span className="severity-badge">{resultado.gravedad}</span>
              <div style={{ color: "#fff", display: "flex", gap: "0.25rem" }}>
                {resultado.gravedad === "alta" && <AlertTriangle size={20} />}
                {resultado.gravedad === "media" && <Info size={20} />}
                {resultado.gravedad === "baja" && <CheckCircle2 size={20} />}
                {resultado.gravedad === "fraude" && <ShieldAlert size={20} />}
              </div>
            </div>
            <h3 className="severity-title">{resultado.tipoDocumento}</h3>
          </div>

          {/* 2. Tarjeta de Contenidos core */}
          <div className="result-card">
            
            {/* Alerta de fraude muy destacada si aplica */}
            {resultado.esPosibleEstafa && (
              <div className="fraud-warning-box">
                <ShieldAlert size={24} style={{ color: "var(--color-fraud-accent)", flexShrink: 0, marginTop: "0.1rem" }} />
                <div className="fraud-warning-text">
                  <strong style={{ display: "block", marginBottom: "0.25rem", color: "#fff" }}>¡Alerta de Posible Estafa Detectada!</strong>
                  {resultado.motivoSospecha}
                </div>
              </div>
            )}

            {/* El traductor humano */}
            <div>
              <span className="section-label">
                <Sparkles size={14} style={{ color: "var(--accent-purple)" }} /> Explicación en lenguaje sencillo
              </span>
              <div className="human-translation-box">
                {activeTranslationLang === "es" ? resultado.resumenHumano : resultado.traducciones[activeTranslationLang]}
              </div>
            </div>

            {/* Lector por audio (Accesibilidad) */}
            <AudioPlayer 
              text={activeTranslationLang === "es" ? resultado.resumenHumano : resultado.traducciones[activeTranslationLang]} 
              isEstafa={resultado.gravedad === "fraude"} 
            />

            {/* Selector de idiomas para inmigrantes */}
            <LanguageSelector 
              translations={resultado.traducciones} 
              currentLang={activeTranslationLang} 
              onChangeLang={(lang) => setActiveTranslationLang(lang)} 
            />

            {/* Rejilla de importes y plazos */}
            <div className="info-row-grid">
              
              {/* Importes */}
              <div className="info-item">
                <span className="section-label" style={{ fontSize: "0.65rem", marginBottom: 0 }}>
                  {resultado.montoDevolucion ? "Te devuelven" : "Importe a pagar"}
                </span>
                <span className={`info-val-large ${(resultado.montoAPagar > 0 && resultado.gravedad !== "fraude") ? "alert-text" : resultado.montoDevolucion ? "safe-text" : ""}`}>
                  {resultado.montoDevolucion 
                    ? `${resultado.montoDevolucion}€` 
                    : resultado.montoAPagar > 0 
                      ? `${resultado.montoAPagar}€` 
                      : "0,00€"}
                </span>
                {resultado.montoProntoPago && (
                  <span style={{ fontSize: "0.7rem", color: "var(--color-safe)", fontWeight: "700", marginTop: "0.2rem" }}>
                    🏷️ Pago rápido: {resultado.montoProntoPago}€
                  </span>
                )}
              </div>

              {/* Plazos de vencimiento */}
              <div className="info-item">
                <span className="section-label" style={{ fontSize: "0.65rem", marginBottom: 0 }}>
                  Fecha límite
                </span>
                <span className={`info-val-large ${resultado.fechaLimite === "Urgente" ? "alert-text" : ""}`} style={{ fontSize: "1.1rem", marginTop: "0.4rem" }}>
                  {resultado.fechaLimite || "Sin plazo límite"}
                </span>
              </div>
            </div>

            {/* Pasos requeridos paso a paso */}
            <div>
              <span className="section-label">
                📋 ¿Qué tienes que hacer exactamente?
              </span>
              <div className="steps-list">
                {resultado.accionesRequeridas.map((step, idx) => (
                  <div key={idx} className="step-card">
                    <span className="step-number">{idx + 1}</span>
                    <p className="step-text">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción útiles */}
            {resultado.fechaLimite && resultado.fechaLimite !== "Urgente" && resultado.fechaLimite !== "No aplica" && (
              <button 
                onClick={handleCalendarExport} 
                className="lang-btn active" 
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.85rem", borderRadius: "12px", width: "100%", background: "rgba(139, 92, 246, 0.05)" }}
              >
                <Calendar size={16} /> Programar aviso en Google Calendar
              </button>
            )}

            <button 
              onClick={() => { setPreviewUrl(null); setSelectedFile(null); setCurrentView("scan"); }} 
              className="btn-scan-main"
              style={{ marginTop: 0 }}
            >
              🔄 Analizar otro documento
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
