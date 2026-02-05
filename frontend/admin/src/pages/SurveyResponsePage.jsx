import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SurveyResponsesPage = () => {
    const { surveyId } = useParams();
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchResponses = async () => {
        setLoading(true);
        try {
            setError(null);
            const res = await axios.get(`${API_BASE}/api/response/${surveyId}`);
            setResponses(res.data?.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResponses();
    }, [surveyId]);

    const questionIds = useMemo(() => {
        if (responses.length === 0) return [];
        return responses[0].response.map(r => r.qid);
    }, [responses]);

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Survey Responses
                </h2>
                <button
                    onClick={fetchResponses}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition text-sm font-medium"
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="mb-4 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                    User Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                    Phone Number
                                </th>

                                {questionIds.map(qid => (
                                    <th
                                        key={qid}
                                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase"
                                    >
                                        {qid}
                                    </th>
                                ))}

                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                    Submitted At
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && responses.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4 + questionIds.length}
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        No responses found
                                    </td>
                                </tr>
                            )}

                            {responses.map((item, index) => (
                                <tr
                                    key={item._id}
                                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/40 transition"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {index + 1}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        {item.user.fullname}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                                        {item.user.phone_no}
                                    </td>

                                    {item.response.map((r, i) => (
                                        <td
                                            key={i}
                                            className="px-4 py-3 text-sm text-center font-mono text-gray-800"
                                        >
                                            {r.optionId}
                                        </td>
                                    ))}

                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                        {new Date(item.createdAt).toISOString().split("T")[0]}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SurveyResponsesPage;
