import { saveAs } from "file-saver";
import Papa from "papaparse";

const exportToCSV = (candidates) => {
  // Deduplicate by email (or id)
  const uniqueCandidates = Object.values(
    candidates.reduce((acc, c) => {
      const key = c.email || c.id; // use email if available, fallback id
      acc[key] = c; // overwrites duplicates, keeps latest
      return acc;
    }, {})
  );

  const data = uniqueCandidates.map((c) => {
    const transcript = c.conversationTranscript || {};
    const feedback = transcript.feedback || {};
    const ratings = feedback.rating || {};

    return {
      Name: c.fullName || c.fullname || "Unnamed",
      Email: c.email || "No Email",
      // Ratings
      Score: feedback.overallScore || "N/A",
      TechnicalSkills: ratings.TechnicalSkills || 0,
      Communication: ratings.Communication || 0,
      ProblemSolving: ratings.ProblemSolving || 0,
      Experience: ratings.Experience || 0,
      Behavioral: ratings.Behavioral || 0,
      Analysis: ratings.Analysis || 0,
      Thinking: ratings.Thinking || 0,

      // Recommendations & Summary
      Recommendation: feedback.Recommendation || c.recommendations || "",
      RecommendationMessage:
        feedback["Recommendation Message"] ||
        feedback.RecommendationMessage ||
        "",
      Summary: feedback.summary || "",
    };
  });

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "candidates.csv");
};

export default exportToCSV;
