import React, { useState, useEffect } from "react";
import { Play, Square, Volume2, VolumeX } from "lucide-react";

export default function AudioPlayer({ text, isEstafa }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [synth, setSynth] = useState(null);
  const [utterance, setUtterance] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    } else {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!synth || !text) return;

    // Cuando cambia el texto, detenemos cualquier voz anterior y creamos una nueva locución
    synth.cancel();
    setIsPlaying(false);

    const newUtterance = new SpeechSynthesisUtterance(text);
    newUtterance.lang = "es-ES";
    
    // Si es estafa, hacemos la voz un pelín más lenta y seria para dar impacto
    if (isEstafa) {
      newUtterance.rate = 0.95;
      newUtterance.pitch = 0.9;
    } else {
      newUtterance.rate = 1.05;
      newUtterance.pitch = 1.0;
    }

    newUtterance.onend = () => {
      setIsPlaying(false);
    };

    newUtterance.onerror = () => {
      setIsPlaying(false);
    };

    setUtterance(newUtterance);

    // Limpieza al desmontar
    return () => {
      synth.cancel();
    };
  }, [synth, text, isEstafa]);

  const toggleSpeak = () => {
    if (!isSupported || !synth || !utterance) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      synth.cancel(); // Asegurar que no haya voces pendientes acumuladas
      synth.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (!isSupported) {
    return (
      <div className="audio-player-bar" style={{ opacity: 0.6, cursor: "not-allowed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <VolumeX size={18} style={{ color: "var(--text-muted)" }} />
          <span className="audio-status">Audio no soportado en este dispositivo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-player-bar">
      <div className="audio-controls">
        <button 
          onClick={toggleSpeak} 
          className="audio-btn" 
          aria-label={isPlaying ? "Detener Audio" : "Escuchar en Voz Alta"}
        >
          {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <span className="audio-status">
          {isPlaying ? "Leyendo explicación..." : "Escuchar explicación en voz alta"}
        </span>
      </div>
      <Volume2 size={18} className={isPlaying ? "pulse-animation" : ""} style={{ color: "var(--accent-purple)" }} />
      
      {/* Añadimos estilos en línea para una pequeña animación de pulso cuando habla */}
      {isPlaying && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes audioPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          .pulse-animation {
            animation: audioPulse 1.2s infinite ease-in-out;
          }
        `}} />
      )}
    </div>
  );
}
