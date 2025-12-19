export function shouldShowField(field, answers) {
  if (!field.showIf) return true;

  const { questionId, value } = field.showIf;
  return answers[questionId] === value;
}
