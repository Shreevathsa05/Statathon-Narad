"use client";

export default function DynamicField({ field, value, onChange, language }) {
  switch (field.type) {
    case "mcq":
      return (
        <div className="space-y-4">
          <p className="font-medium text-lg">
            {field.text?.[language]}
          </p>

          <div className="space-y-2">
            {field.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer
                  ${value === opt.id ? "border-blue-600 bg-blue-50" : ""}
                `}
              >
                <input
                  type="radio"
                  name={field.qid}
                  checked={value === opt.id}
                  onChange={() => onChange(field.qid, opt.id)}
                />
                <span>{opt.label?.[language]}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-2">
          <p className="font-medium">{field.text?.[language]}</p>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={value || ""}
            onChange={(e) =>
              onChange(field.qid, e.target.value)
            }
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <p className="font-medium">{field.text?.[language]}</p>
          <input
            type="number"
            className="w-full border rounded-md px-3 py-2"
            value={value ?? ""}
            onChange={(e) =>
              onChange(
                field.qid,
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </div>
      );

    default:
      return null;
  }
}
