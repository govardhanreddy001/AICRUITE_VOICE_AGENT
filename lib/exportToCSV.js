import { saveAs } from "file-saver";
import Papa from "papaparse";

const exportToCSV = (candidates) => {
  const uniqueCandidates = Object.values(
    candidates.reduce((acc, c) => {
      const key = c.email || c.id;
      acc[key] = c;
      return acc;
    }, {})
  );

  const data = uniqueCandidates.map((c) => {
    const transcript = c.conversationTranscript || {};
    const feedback = transcript.feedback || {};
    const ratings = feedback.rating || {};

    return {
      Name: c.fullName || c.fullname || "Unnamed",
      Email: c.email,

      // ⭐ Ratings
      TechnicalSkills: ratings.TechnicalSkills ?? "",
      Communication: ratings.Communication ?? "",
      ProblemSolving: ratings.ProblemSolving ?? "",
      Experience: ratings.Experience ?? "",
      Behavioral: ratings.Behavioral ?? "",
      Analysis: ratings.Analysis ?? "",

      // ⭐ Feedback
      Recommendation: feedback.Recommendation ?? "",
      RecommendationMessage: feedback["Recommendation Message"] ?? "",
      Summary: feedback.summery ?? "",
    };
  });

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "candidates.csv");
};

export default exportToCSV;
