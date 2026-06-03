export default function SurveyCard({ survey, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-[#0A0A0A] hover:bg-[#111111] p-6 flex flex-col gap-3 cursor-pointer transition"
        >
            {/* Top */}
            <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded-md bg-[#111111] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1A1]">
                    📄
                </div>

                <span className="flex items-center gap-1 px-2 py-[3px] text-[11px] bg-[#50E3C2]/10 text-[#50E3C2] rounded">
                    <span className="w-[5px] h-[5px] bg-[#50E3C2] rounded-full" />
                    {survey.status}
                </span>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-[#EDEDED] line-clamp-2">
                {survey.name}
            </p>

            <p className="text-xs text-[#525252] font-mono truncate">
                ID: {survey.surveyId}
            </p>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-[#1A1A1A] mt-auto">
                <span className="text-[11px] text-[#525252] font-mono">
                    Since {new Date(survey.createdAt).toLocaleDateString()}
                </span>

                <span className="text-[#404040] group-hover:text-[#A1A1A1] transition">
                    →
                </span>
            </div>
        </div>
    );
}