/**
 * Evaluates a single rule condition against the current survey answers.
 * @param {Object} condition - Single condition object { questionId, operator, value, equals }
 * @param {Object} answers - Current answers map
 * @returns {boolean} Whether the condition is met
 */
export const evaluateCondition = (condition, answers) => {
  if (!condition || !condition.questionId) return true;

  const targetQid = condition.questionId;
  const userAnswer = answers instanceof Map ? answers.get(targetQid) : answers[targetQid];

  // If prerequisite question has not been answered, condition fails
  if (userAnswer === undefined || userAnswer === null) {
    return false;
  }

  // Handle standard mongoose showIf structure where 'equals' is used
  const compareValue = condition.value !== undefined ? condition.value : condition.equals;
  const operator = condition.operator || "equals";

  const answerStr = userAnswer.toString().trim().toLowerCase();
  const compareStr = compareValue.toString().trim().toLowerCase();

  switch (operator) {
    case "equals":
      // If it's a checkbox, check if it contains or matches
      if (Array.isArray(userAnswer)) {
        return userAnswer.map(a => a.toString().toLowerCase()).includes(compareStr);
      }
      return answerStr === compareStr;

    case "notEquals":
      if (Array.isArray(userAnswer)) {
        return !userAnswer.map(a => a.toString().toLowerCase()).includes(compareStr);
      }
      return answerStr !== compareStr;

    case "greaterThan":
      return Number(userAnswer) > Number(compareValue);

    case "lessThan":
      return Number(userAnswer) < Number(compareValue);

    case "contains":
      if (Array.isArray(userAnswer)) {
        return userAnswer.map(a => a.toString().toLowerCase().trim()).includes(compareStr);
      }
      return answerStr.includes(compareStr);

    default:
      return answerStr === compareStr;
  }
};

/**
 * Evaluates whether a question should be shown based on its skip logic rules.
 * Supports standard Mongoose 'showIf' and multiple advanced conditions.
 * @param {Object} question - The question object
 * @param {Object} answers - Current survey answers
 * @returns {boolean} True if the question should be shown, false if skipped
 */
export const shouldShowQuestion = (question, answers) => {
  if (!question) return false;

  // 1. Standard single condition (showIf: { questionId, equals })
  if (question.showIf && question.showIf.questionId) {
    return evaluateCondition(question.showIf, answers);
  }

  // 2. Advanced multiple conditions (e.g. showIfs or skipRules list)
  if (Array.isArray(question.skipRules) && question.skipRules.length > 0) {
    // Evaluates with AND logic (all conditions must be met)
    return question.skipRules.every(rule => evaluateCondition(rule, answers));
  }

  // No skip logic defined, always show
  return true;
};

/**
 * Calculates the next valid question index in the flattened survey questions array.
 * Skips over any questions whose skip logic conditions evaluate to false.
 * @param {Array} flatQuestions - Flattened list of all survey questions
 * @param {number} startIndex - Index to evaluate next (usually currentIndex + 1)
 * @param {Object} answers - Map of current answers in the session
 * @returns {number} The next index to ask, or -1 if the survey is complete
 */
export const getNextQuestionIndex = (flatQuestions, startIndex, answers) => {
  if (!flatQuestions || startIndex >= flatQuestions.length || startIndex < 0) {
    return -1;
  }

  for (let i = startIndex; i < flatQuestions.length; i++) {
    const question = flatQuestions[i];
    if (shouldShowQuestion(question, answers)) {
      return i;
    }
    console.log(`[Skip Logic] Skipping question ${question.qid} for index ${i} based on rules`);
  }

  return -1; // No more questions
};
