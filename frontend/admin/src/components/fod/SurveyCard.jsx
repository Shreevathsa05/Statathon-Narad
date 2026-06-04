import { Globe, Volume2 } from "lucide-react";

export default function SurveyCard({ survey, onClick, index = 0 }) {
  const isProcessing =
    survey.status === "translating" || survey.status === "generating_audio";
  const questionCount =
    survey.questionSections?.reduce(
      (acc, section) => acc + (section.questions?.length || 0),
      0,
    ) || 0;
  const sectionCount = survey.questionSections?.length || 0;
  const languages = survey.supportedLanguages?.join(", ") || "English";

  let displayName = survey.name || "Untitled Survey";
  if (displayName.startsWith("Survey on Survey on")) {
    displayName = displayName.replace("Survey on Survey on", "Survey on");
  }

  const audioMap = survey.questionSections?.[0]?.questions?.[0]?.audio;
  const hasAudio =
    audioMap && Object.values(audioMap).some((val) => val && val.trim() !== "");

  return (
    <div
      className={`bg-bg border border-border rounded-md shadow-sm p-4 flex flex-col gap-4 transition-all h-full opacity-0 animate-fade-in-card ${isProcessing ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:border-black hover:shadow-md"}`}
      onClick={() => !isProcessing && onClick()}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-base font-medium text-text-primary m-0 leading-tight line-clamp-2 overflow-hidden">
          {displayName}
        </h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border uppercase tracking-wider shrink-0 ${
            survey.status === "active"
              ? "bg-geist-blue/10 text-geist-blue border-geist-blue/20"
              : survey.status === "translating"
                ? "bg-purple-500/10 text-purple-700 border-purple-500/20"
                : survey.status === "generating_audio"
                  ? "bg-indigo-500/10 text-indigo-700 border-indigo-500/20"
                  : survey.status === "pending"
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                    : "bg-geist-error/10 text-geist-error border-geist-error/20"
          }`}
        >
          {survey.status === "generating_audio"
            ? "Generating Audio"
            : survey.status}
        </span>
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[13px] text-text-muted">
          <span>
            {sectionCount} Sections • {questionCount} Questions
          </span>
          <span className="font-mono text-[12px]">
            #{survey.surveyId?.substring(0, 8)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted h-[18px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <Globe size={12} />
            {hasAudio && <Volume2 size={12} className="text-text-muted" />}
            <span className="capitalize whitespace-nowrap overflow-hidden text-ellipsis ml-1">
              {languages}
            </span>
          </div>
          <div className="flex gap-1 items-center">
            {survey.allowedChannels?.map((ch) => (
              <span
                key={ch}
                className="uppercase text-[9px] px-1 bg-border/30 rounded border border-border/50 text-text-secondary"
              >
                {ch}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
