export function shouldShowField(field, answers) {
  if (!field.showIf) return true;

  const { questionId, equals } = field.showIf;
  return answers[questionId] === equals;
}
