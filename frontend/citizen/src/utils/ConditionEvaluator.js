export function shouldShowField(field, answers) {
	if (!field.showIf) return true;

	const { questionId, equals, operator = "==" } = field.showIf;
	const answerValue = answers[questionId];

	if (answerValue === undefined || answerValue === null || answerValue === "") {
		return false;
	}

	if (operator === ">") {
		return Number(answerValue) > Number(equals);
	} else if (operator === "<") {
		return Number(answerValue) < Number(equals);
	} else {
		const targetVal = String(equals).toLowerCase();
		if (Array.isArray(answerValue)) {
			return answerValue.some(v => String(v).toLowerCase() === targetVal);
		}
		return String(answerValue).toLowerCase() === targetVal;
	}
}
