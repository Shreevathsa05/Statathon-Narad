import { SurveyField } from "@/types/survey";

type DynamicFieldProps = {
  field: SurveyField;
  value: string | undefined;
  onChange: (id: number, value: string) => void;
};

export default function DynamicField({
  field,
  value,
  onChange,
}: DynamicFieldProps) {
  switch (field.type) {
    case "text":
      return (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );

    case "radio":
      return (
        <>
          {field.options?.map((opt) => (
            <label key={opt}>
              <input
                type="radio"
                checked={value === opt}
                onChange={() => onChange(field.id, opt)}
              />
              {opt}
            </label>
          ))}
        </>
      );

    default:
      return null;
  }
}
