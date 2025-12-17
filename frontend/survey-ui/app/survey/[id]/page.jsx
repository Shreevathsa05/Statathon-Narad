import SurveyRenderer from "@/components/survey/SurveyRenderer";

export default async function SurveyPage({ params }) {
  const surveyId = params.id;

  const res = await fetch(`http://localhost:3000/api/surveys/${surveyId}`, {
    cache: "no-store",
  });
  const schema = await res.json();

  return <SurveyRenderer schema={schema} />;
}
