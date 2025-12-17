"use client";

export default function DynamicField({ field, value, onChange }) {
  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          placeholder={field.label}
          value={value || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          placeholder={field.label}
          value={value ?? ""}
          onChange={(e) =>
            onChange(field.id, e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      );

    case "radio":
      return (
        <div>
          <label>{field.label}</label>
          {field.options.map((opt) => (
            <label key={opt}>
              <input
                type="radio"
                name={`question-${field.id}`}
                checked={value === opt}
                onChange={() => onChange(field.id, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div>
          <label>{field.label}</label>
          {field.options.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt);

            return (
              <label key={opt}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const next = selected
                      ? value.filter((v) => v !== opt)
                      : [...(value || []), opt];
                    onChange(field.id, next);
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}
