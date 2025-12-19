import React from "react";

export default function LanguageSelector({ languages, selected, onChange }) {
  const toggle = (lang) => {
    onChange(
      selected.includes(lang)
        ? selected.filter((l) => l !== lang)
        : [...selected, lang]
    );
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Supported Languages
      </label>

      <div className="grid grid-cols-2 gap-x-10 gap-y-2">
        {languages.map((lang) => (
          <label key={lang} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(lang)}
              onChange={() => toggle(lang)}
              className="accent-black"
            />
            {lang}
          </label>
        ))}
      </div>
    </div>
  );
}
