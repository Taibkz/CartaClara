import React from "react";
import { Globe } from "lucide-react";

export default function LanguageSelector({ translations, currentLang, onChangeLang }) {
  const languages = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" },
    { code: "ro", label: "Română" },
    { code: "fr", label: "Français" },
    { code: "zh", label: "中文" }
  ];

  // Filtrar solo los idiomas disponibles en las traducciones
  const availableLanguages = languages.filter(
    lang => lang.code === "es" || (translations && translations[lang.code])
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <span className="section-label">
        <Globe size={14} /> Traducir a otro idioma
      </span>
      <div className="lang-selector-grid">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onChangeLang(lang.code)}
            className={`lang-btn ${currentLang === lang.code ? "active" : ""}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
