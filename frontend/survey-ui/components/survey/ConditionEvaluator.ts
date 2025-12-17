import { SurveyField, AnswersMap } from "@/types/survey";

export function shouldShowField(
    field: SurveyField,
    answers: AnswersMap
): boolean {
    if (!field.showIf) return true;

    const condition = field.showIf;
    const answer = answers[condition.questionId];

    if (condition.value !== undefined) {
        return answer === condition.value;
    }

    if (condition.includes) {
        return Array.isArray(answer) && answer.includes(condition.includes);
    }

    return true;
}
