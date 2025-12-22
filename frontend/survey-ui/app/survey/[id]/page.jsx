import SurveyRenderer from "@/components/survey/surveyRenderer";

async function getSurveySchema(surveyId) {
  "use cache";

  const res = await fetch(
    `http://localhost:3000/api/survey/${surveyId}`,
    { cache: "force-cache" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch survey");
  }

  const json = await res.json();
  return json.data;
}

export default async function SurveyPage(props) {
  const params = await props.params;
  const surveyId = params.id;
  const survey = await getSurveySchema(surveyId);
  return <SurveyRenderer questions={survey.questions} supportedLanguages={survey.supportedLanguages} surveyId={surveyId}/>;
}
