import SurveyRenderer from "@/components/survey/SurveyRenderer";

type SurveyPageProps = {
  params: {
    surveyId: string;
  };
};

export default async function SurveyPage({ params }: SurveyPageProps) {
  const res = await fetch(
    `${process.env.BASE_URL}/api/surveys/${params.surveyId}`
  );

  const schema = await res.json();

  return <SurveyRenderer schema={schema} />;
}
