export type FieldType = "text" | "radio" | "checkbox";

export type ShowIfCondition = {
  questionId: number;
  value?: string;
  includes?: string;
};

export interface SurveyField {
  id: number;
  type: FieldType;
  label: string;
  options?: string[];
  showIf?: ShowIfCondition;
}

export type AnswerValue = string | string[] | number | undefined;

export type AnswersMap = Record<number, AnswerValue>;
