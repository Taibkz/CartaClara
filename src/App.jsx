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
  Clock,
  Sparkle,
  AlertCircle,
  Building2,
  Mail,
  Award,
  CheckSquare,
  Tag,
  VolumeX,
  FileText,
  ShieldCheck,
  ChevronRight,
  Settings
} from "lucide-react";
import { analizarDocumento, MOCK_DOCUMENTS } from "./services/gemini";
import AudioPlayer from "./components/AudioPlayer";
import LanguageSelector from "./components/LanguageSelector";

// Custom SVG Logo Component: Represents an envelope + magnifying glass + glowing AI scan core
const BrandLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4.5" fill="#8b5cf6" fillOpacity="0.5" stroke="#a78bfa" strokeWidth="1.5"/>
    <line x1="15" y1="16" x2="18.5" y2="19.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

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
            <BrandLogo />
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
          <Settings size={18} />
        </button>
      </header>

      {/* CARD DE CONFIGURACIÓN DE API KEY (ACCORDION) */}
      {showKeyInput && (
        <div className="config-card">
          <div className="config-row">
            <span className="config-title">
              <Key size={14} style={{ color: "var(--accent-purple)" }} /> Gemini 2.5 API Key (Gratuita)
            </span>
            {apiKey && (
              <button 
                onClick={handleDeleteApiKey} 
                style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: "600" }}
              >
                <Trash2 size={12} /> Borrar clave
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
            <button type="submit" className="lang-btn active" style={{ padding: "0.6rem 1.1rem" }}>
              Guardar
            </button>
          </form>
          
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
            ¿No tienes una clave? Consíguela gratis buscando "Google AI Studio" o mantén activo el <strong>Modo Demo</strong> para probar con cartas del evento.
          </p>
        </div>
      )}

      {/* BANNER DE SELECCIÓN DE MODO DEMO / PRESENTACIÓN */}
      <div className="config-card" style={{ borderLeft: "4px solid var(--accent-purple)", background: "rgba(139, 92, 246, 0.02)" }}>
        <div className="config-row">
          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#c084fc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={14} /> Demostración Interactiva
          </span>
          <button 
            onClick={() => setIsDemoMode(!isDemoMode)} 
            className={`toggle-btn ${isDemoMode ? "active" : ""}`}
            style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem", fontWeight: "750", width: "auto", height: "auto" }}
          >
            {isDemoMode ? "MODO DEMO" : "IA EN VIVO"}
          </button>
        </div>
        
        {isDemoMode && (
          <div className="quick-demo-wrapper" style={{ marginTop: "0.4rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "500" }}>
              Selecciona un documento de demostración:
            </span>
            {/* SEGMENTED TAB SELECTOR (iOS / Premium SaaS look) */}
            <div className="quick-demo-tabs">
              <button 
                onClick={() => setSelectedMockKey("multa")} 
                className={`demo-tab-btn ${selectedMockKey === "multa" ? "active" : ""}`}
                title="Multa de Tránsito"
              >
                <AlertCircle size={15} />
                <span>Multa</span>
              </button>
              <button 
                onClick={() => setSelectedMockKey("hacienda")} 
                className={`demo-tab-btn ${selectedMockKey === "hacienda" ? "active" : ""}`}
                title="Carta de Hacienda"
              >
                <Building2 size={15} />
                <span>Hacienda</span>
              </button>
              <button 
                onClick={() => setSelectedMockKey("cita_medica")} 
                className={`demo-tab-btn ${selectedMockKey === "cita_medica" ? "active" : ""}`}
                title="Citación Médica"
              >
                <Calendar size={15} />
                <span>Médico</span>
              </button>
              <button 
                onClick={() => setSelectedMockKey("estafa")} 
                className={`demo-tab-btn ${selectedMockKey === "estafa" ? "active" : ""}`}
                title="Posible Estafa"
              >
                <ShieldAlert size={15} />
                <span>Estafa</span>
              </button>
              <button 
                onClick={() => setSelectedMockKey("publicidad")} 
                className={`demo-tab-btn ${selectedMockKey === "publicidad" ? "active" : ""}`}
                title="Carta Comercial"
              >
                <Mail size={15} />
                <span>Publicidad</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VISTA 1: DASHBOARD DE INICIO Y HISTORIAL */}
      {currentView === "home" && (
        <div className="main-dashboard">
          
          <div className="welcome-hero">
            <div className="welcome-logo-badge">
              <Sparkle size={12} fill="currentColor" />
              <span>Asistente Social con Inteligencia Artificial</span>
            </div>
            <h2 className="welcome-title">Entiende tus cartas al instante</h2>
            <p className="welcome-subtitle">
              Saca una foto a cualquier carta oficial, multa o cita. Nuestra IA la traducirá a un lenguaje sencillo libre de tecnicismos.
            </p>
          </div>

          {/* Historial de cartas procesadas */}
          <div className="history-section">
            <h3 style={{ fontSize: "0.95rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "700" }}>
              <History size={16} style={{ color: "var(--accent-purple)" }} /> Historial de documentos
            </h3>
            
            {historial.length === 0 ? (
              <div className="promo-box" style={{ padding: "2.5rem 1rem" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "500" }}>Tu historial está vacío.</p>
                <p style={{ fontSize: "0.75rem" }}>¡Haz clic en el botón flotante de abajo para realizar tu primer escaneo!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {historial.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleSelectHistory(item)} 
                    className="history-card"
                  >
                    <div className="history-info">
                      <span className="history-title">{item.tipoDocumento}</span>
                      <span className="history-meta" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Clock size={10} /> {item.fechaEscaneo} 
                        {item.montoAPagar > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", marginLeft: "0.3rem", color: "var(--color-danger)" }}>
                            <Tag size={10} /> {item.montoAPagar}€
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className={`history-indicator indicator-${item.gravedad}`} />
                      <button 
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.25rem" }}
                        title="Eliminar de historial"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="promo-box">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
              <Award size={18} style={{ color: "#fbbf24" }} />
            </div>
            <strong>¿Por qué CartaClara?</strong> Apoya a personas mayores contra la exclusión digital y asiste a inmigrantes traduciendo cartas a su idioma nativo de forma clara y accesible.
          </div>

          {/* Botón flotante/principal para escanear */}
          <button 
            onClick={() => {
              setCurrentView("scan");
              // Iniciar cámara trasera automáticamente en móviles
              startCamera();
            }} 
            className="btn-scan-main"
          >
            <Camera size={20} />
            <span>Escanear Nueva Carta</span>
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

          <h2 style={{ fontSize: "1.25rem", fontWeight: "750", textAlign: "center", marginBottom: "0.6rem" }}>
            Capturar o Subir Carta
          </h2>

          {/* Zona de escáner cámara / visualizador de preview */}
          <div className="scanner-container">
            {/* Viewfinder brackets adicionales (Top-Right, Bottom-Left) */}
            <div className="scanner-corners-tr" />
            <div className="scanner-corners-bl" />

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
                    style={{ width: "auto", margin: 0, padding: "0.75rem 1.5rem", gap: "0.5rem" }}
                  >
                    <Camera size={16} />
                    <span>Hacer Foto</span>
                  </button>
                  <button 
                    onClick={stopCamera} 
                    className="lang-btn active"
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "50px", background: "rgba(7, 8, 13, 0.8)", border: "1px solid var(--border-color)", color: "#fff", fontWeight: "700" }}
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
                    style={{ flex: 1, padding: "0.85rem", background: "rgba(7, 8, 13, 0.85)", color: "#fff" }}
                  >
                    Repetir Foto
                  </button>
                </div>
              </>
            ) : (
              // Estado inicial: drag and drop de archivos / iniciar cámara
              <label className="scanner-info">
                <div className="scanner-icon-circle">
                  <Upload size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: "750", marginBottom: "0.25rem" }}>
                    Arrastra o selecciona tu carta
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
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
                <span style={{ fontSize: "0.72rem", color: "var(--color-danger)", background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.2)", padding: "0.4rem 0.8rem", borderRadius: "8px", display: "inline-block" }}>
                  {cameraError}
                </span>
              </div>
            )}
          </div>

          {/* Información y botón para iniciar análisis */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
            {isDemoMode ? (
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                <Sparkles size={12} style={{ color: "var(--accent-purple)" }} />
                <span>Simulando análisis con carta: <strong>{MOCK_DOCUMENTS[selectedMockKey].tipoDocumento}</strong>.</span>
              </p>
            ) : (
              selectedFile && (
                <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                  <FileText size={12} />
                  <span>Documento listo: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </p>
              )
            )}

            <button 
              onClick={handleScanSubmit} 
              className="btn-scan-main"
              disabled={!selectedFile && !isDemoMode}
              style={{ opacity: (!selectedFile && !isDemoMode) ? 0.6 : 1 }}
            >
              <Sparkles size={18} />
              <span>Comenzar Análisis Inteligente</span>
            </button>
          </div>
        </div>
      )}

      {/* VISTA 3: PROCESANDO ANALISIS (LOADING) */}
      {currentView === "loading" && (
        <div className="loading-box" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div className="loading-circle" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <h2 className="scanner-feedback">{loadingText}</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: "260px", margin: "0 auto", lineHeight: 1.5 }}>
              Interpretando términos jurídicos y formalidades administrativas para ti.
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
              <span className="severity-badge">
                {resultado.gravedad === "alta" && <AlertTriangle size={12} />}
                {resultado.gravedad === "media" && <Info size={12} />}
                {resultado.gravedad === "baja" && <ShieldCheck size={12} />}
                {resultado.gravedad === "fraude" && <ShieldAlert size={12} />}
                {resultado.gravedad === "fraude" ? "Posible Estafa" : resultado.gravedad}
              </span>
              <div style={{ color: "#fff" }}>
                {resultado.gravedad === "alta" && <AlertTriangle size={20} />}
                {resultado.gravedad === "media" && <Info size={20} />}
                {resultado.gravedad === "baja" && <ShieldCheck size={20} />}
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
                <ShieldAlert size={22} style={{ color: "var(--color-fraud-accent)", flexShrink: 0, marginTop: "0.15rem" }} />
                <div className="fraud-warning-text">
                  <strong style={{ display: "block", marginBottom: "0.25rem", color: "#fff", fontSize: "0.88rem" }}>Indicadores de Estafa Detectados</strong>
                  {resultado.motivoSospecha}
                </div>
              </div>
            )}

            {/* El traductor humano */}
            <div>
              <span className="section-label">
                <Sparkles size={14} style={{ color: "var(--accent-purple)" }} /> Explicación Simplificada
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
                <span className="section-label" style={{ fontSize: "0.62rem", marginBottom: 0 }}>
                  {resultado.montoDevolucion ? "Reembolso a tu favor" : "Importe a pagar"}
                </span>
                <span className={`info-val-large ${(resultado.montoAPagar > 0 && resultado.gravedad !== "fraude") ? "alert-text" : resultado.montoDevolucion ? "safe-text" : ""}`}>
                  {resultado.montoDevolucion 
                    ? `${resultado.montoDevolucion}€` 
                    : resultado.montoAPagar > 0 
                      ? `${resultado.montoAPagar}€` 
                      : "0,00€"}
                </span>
                {resultado.montoProntoPago && (
                  <span style={{ fontSize: "0.68rem", color: "var(--color-safe)", fontWeight: "800", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Tag size={10} /> Pago rápido: {resultado.montoProntoPago}€
                  </span>
                )}
              </div>

              {/* Plazos de vencimiento */}
              <div className="info-item">
                <span className="section-label" style={{ fontSize: "0.62rem", marginBottom: 0 }}>
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
                <CheckSquare size={13} /> Pasos a seguir sugeridos
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
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.85rem", borderRadius: "14px", width: "100%", background: "rgba(139, 92, 246, 0.05)" }}
              >
                <Calendar size={15} />
                <span>Programar en Google Calendar</span>
              </button>
            )}

            <button 
              onClick={() => { setPreviewUrl(null); setSelectedFile(null); setCurrentView("scan"); }} 
              className="btn-scan-main"
              style={{ marginTop: 0 }}
            >
              <RotateCcw size={16} />
              <span>Escanear otro documento</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
