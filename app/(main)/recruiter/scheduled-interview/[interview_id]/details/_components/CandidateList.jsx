import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { Download } from "lucide-react";
import Image from "next/image";

function CandidateFeedbackDialog({ candidate }) {
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [cvAvailable, setCvAvailable] = useState(false);
  const [cvFilePath, setCvFilePath] = useState(null);
  const [candidatePicture, setCandidatePicture] = useState(null);

  const candidateName =
    candidate?.fullname ||
    candidate?.fullName ||
    candidate?.name ||
    candidate?.email ||
    "Unnamed Candidate";

  // --- Feedback extraction ---
  let feedback = candidate?.conversationTranscript?.feedback || {};

  if (typeof feedback === "string") {
    try {
      feedback = JSON.parse(feedback);
    } catch (e) {
      console.error("Error parsing feedback JSON:", e);
      feedback = {};
    }
  }

  // --- Ratings ---
  const rawRating = feedback?.rating || {};
  const rating = {
    TechnicalSkills:
      rawRating?.TechnicalSkills ?? rawRating?.["Technical Skills"] ?? 0,
    Communication: rawRating?.Communication ?? 0,
    ProblemSolving:
      rawRating?.ProblemSolving ?? rawRating?.["Problem Solving"] ?? 0,
    Experience: rawRating?.Experience ?? 0,
    Behavioral: rawRating?.Behavioral ?? 0,
    Analysis: rawRating?.Analysis ?? 0,
  };

  // --- Summary ---
  const summaryText = feedback?.summary || feedback?.summery || "";
  const summaryArray = Array.isArray(summaryText)
    ? summaryText
    : typeof summaryText === "string"
    ? summaryText.split("\n").filter((line) => line.trim())
    : [];

  // --- Recommendation message ---
  const recommendationMessage =
    feedback?.RecommendationMessage ||
    feedback?.recommendationMessage ||
    feedback?.["Recommendation Message"] ||
    "No recommendation message provided";

  // --- Overall score ---
  const ratings = Object.values(rating).filter(
    (val) => typeof val === "number"
  );
  const overallScore =
    ratings.length > 0
      ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
      : 0;

  const isRecommended = (feedback?.Recommendation || "")
    .toLowerCase()
    .includes("yes");

  // --- Fetch CV ---
  const fetchCandidateCV = async () => {
    if (!candidate?.email) return;
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("cv_file_path, picture")
        .eq("email", candidate.email)
        .single();

      if (error) {
        console.error("Error fetching CV info:", error);
        return;
      }

      if (userData?.cv_file_path) {
        setCvFilePath(userData.cv_file_path);
        setCvAvailable(true);
      }

      if (userData?.picture) {
        setCandidatePicture(userData.picture);
      }
    } catch (error) {
      console.error("Error fetching candidate CV:", error);
    }
  };

  // --- Download CV ---
  const downloadCV = async () => {
    if (!cvFilePath) {
      toast.error("CV not available");
      return;
    }
    setDownloadingCV(true);
    try {
      const { data, error } = await supabase.storage
        .from("cv-uploads")
        .download(cvFilePath);

      if (error) throw error;

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${candidateName}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("CV downloaded successfully!");
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error("Failed to download CV");
    } finally {
      setDownloadingCV(false);
    }
  };

  useEffect(() => {
    if (candidate?.email) {
      fetchCandidateCV();
    }
  }, [candidate?.email]);

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
                  {candidatePicture ? (
                    <Image
                      src={candidatePicture}
                      alt={candidateName}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <h2 className="text-white font-bold">
                        {candidateName?.[0]?.toUpperCase() || "?"}
                      </h2>
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold">{candidateName}</h2>
                    <h2 className="text-gray-500 text-sm">
                      {candidate?.email || "No Email"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-primary text-2xl font-bold">
                    {overallScore}/10
                  </h2>
                  {cvAvailable && (
                    <Button
                      onClick={downloadCV}
                      disabled={downloadingCV}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingCV ? "Downloading..." : "Download CV"}
                    </Button>
                  )}
                </div>
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

              {/* Recommendation Section */}
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
                    {feedback?.Recommendation || "Recommendation"}
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

export default CandidateFeedbackDialog;
