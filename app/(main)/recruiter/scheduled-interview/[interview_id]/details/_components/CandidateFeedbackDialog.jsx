import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export default function CandidateListFeedbackDialog({ candidate }) {
  // 👇 ADD THIS — it shows you exactly what data you are getting
  console.log("CANDIDATE DATA:", candidate);
  console.log("TRANSCRIPT:", candidate?.conversationTranscript);
  console.log("FEEDBACK RAW:", candidate?.conversationTranscript?.feedback);

  // --- Candidate name ---
  const candidateName =
    candidate?.fullname ||
    candidate?.fullName ||
    candidate?.name ||
    candidate?.email ||
    "Unnamed Candidate";

  // --- Extract feedback safely ---
  let feedback = candidate?.conversationTranscript?.feedback || {};

  if (typeof feedback === "string") {
    try {
      feedback = JSON.parse(feedback);
    } catch (e) {
      console.error("Error parsing feedback JSON:", e, feedback);
      feedback = {};
    }
  }

  // --- Ratings ---
  const rawRating = feedback?.rating || {};
  const rating = {
    TechnicalSkills:
      rawRating?.TechnicalSkills ||
      rawRating?.technicalSkills ||
      rawRating?.technical_skills ||
      rawRating?.technical ||
      0,
    Communication:
      rawRating?.Communication || rawRating?.communication || 0,
    ProblemSolving:
      rawRating?.ProblemSolving ||
      rawRating?.problemSolving ||
      rawRating?.problem_solving ||
      0,
    Experience: rawRating?.Experience || rawRating?.experience || 0,
    Behavioral: rawRating?.Behavioral || rawRating?.behavioral || 0,
    Analysis: rawRating?.Analysis || rawRating?.analysis || 0,
  };

  // --- Summary ---
  const summaryText = feedback?.summary || feedback?.summery || "";
  const summaryArray =
    typeof summaryText === "string"
      ? summaryText
          .split(/(?<=[.!?])\s+/)
          .filter((line) => line.trim())
      : Array.isArray(summaryText)
      ? summaryText
      : [];

  // --- Recommendation ---
  const recommendationMessage =
    feedback?.["Recommendation Message"] ||
    feedback?.RecommendationMessage ||
    feedback?.recommendationMessage ||
    feedback?.recommendation_message ||
    "No recommendation message provided";

  const recommendationText =
    feedback?.Recommendation || feedback?.recommendation || "Recommendation";
  const isRecommended = recommendationText.toLowerCase().includes("yes");

  // --- Overall score ---
  const ratings = Object.values(rating).filter(
    (val) => typeof val === "number"
  );
  const overallScore =
    ratings.length > 0
      ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
      : 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-primary hover:bg-primary/10">
          View Report
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feedback Report</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-5 space-y-4">
              {/* Candidate Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <h2 className="text-white font-bold">
                      {candidateName?.[0]?.toUpperCase() || "?"}
                    </h2>
                  </div>
                  <div>
                    <h2 className="font-bold">{candidateName}</h2>
                    <h2 className="text-gray-500 text-sm">
                      {candidate?.email || "No Email"}
                    </h2>
                  </div>
                </div>
                <h2 className="text-primary text-2xl font-bold">
                  {overallScore}/10
                </h2>
              </div>

              {/* Skills Assessment */}
              <div>
                <h2 className="font-bold">Skills Assessment</h2>
                <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-4">
                  {Object.entries(rating).map(([skill, score]) => (
                    <div key={skill}>
                      <div className="flex justify-between text-sm mb-1">
                        {skill.replace(/([A-Z])/g, " $1").trim()}{" "}
                        <span>{score}/10</span>
                      </div>
                      <Progress
                        value={score * 10}
                        className="h-2 mt-1 [&>div]:bg-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Summary */}
              <div className="mt-5">
                <h2 className="font-bold">Performance Summary</h2>
                <div className="p-5 bg-secondary my-3 rounded-md">
                  {summaryArray.length > 0 ? (
                    summaryArray.map((line, index) => (
                      <p key={index} className="mb-2 last:mb-0">
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500">No summary available</p>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              <div
                className={`p-5 rounded-md ${
                  isRecommended
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border-red-200 border"
                }`}
              >
                <div>
                  <h2
                    className={`font-medium text-lg ${
                      isRecommended ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {recommendationText}
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-gray-700">
                    {recommendationMessage}
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
