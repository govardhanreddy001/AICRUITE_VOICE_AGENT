import { Calendar, Clock, MessageCircleQuestionIcon, Trash2, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment-timezone";   // ⭐ UPDATED: timezone support
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import exportToCSV from "@/lib/exportToCSV";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function InterviewDetailContainer({ interviewDetail }) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  // ⭐ FULL EXCEL EXPORT — WITH IST TIMEZONE FIX
  const handleDownloadExcel = () => {
    if (!interviewDetail?.interview_results || interviewDetail.interview_results.length === 0) {
      toast.error("No candidate data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      interviewDetail.interview_results.map((c) => {
        const transcript = c.conversationTranscript || {};
        const feedback = transcript.feedback || {};
        const rating = feedback.rating || {};

        return {
          "Candidate Name": c.fullName || c.fullname,
          Email: c.email,

          // ⭐ FIXED — Convert UTC → IST
          "Completed At": moment
            .utc(c.completed_at || c.completedAt)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm"),

          // ⭐ Ratings
          TechnicalSkills: rating.TechnicalSkills ?? "",
          Communication: rating.Communication ?? "",
          ProblemSolving: rating.ProblemSolving ?? "",
          Experience: rating.Experience ?? "",
          Behavioral: rating.Behavioral ?? "",
          Analysis: rating.Analysis ?? "",

          // ⭐ Feedback fields
          Recommendation: feedback.Recommendation ?? "",
          RecommendationMessage: feedback["Recommendation Message"] ?? "",
          Summary: feedback.summery ?? "",

          // ⭐ Conversation Transcript
          Transcript: JSON.stringify(transcript),
        };
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "interview_results.xlsx");

    toast.success("Excel downloaded successfully!");
  };

  // ⭐ Parse interview questions safely
  const parsedQuestions = (() => {
    const raw = interviewDetail?.questionList;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.interviewQuestions)) return parsed.interviewQuestions;
      return [];
    } catch {
      return [];
    }
  })();

  // ⭐ Delete Interview
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supabase.from("interview_results").delete().eq("interviewId", interviewDetail.interview_id);
      await supabase.from("interviews").delete().eq("interview_id", interviewDetail.interview_id);

      toast.success("Interview deleted successfully!");
      setShowDeleteAlert(false);
      router.push("/recruiter/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete interview");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="p-5 bg-white border rounded-xl shadow-sm mt-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{interviewDetail?.jobPosition}</h2>

          <div className="flex gap-2">
            {/* EXCEL Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
            >
              <FileDown size={16} />
              Download Excel
            </Button>

            {/* CSV Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!interviewDetail?.interview_results?.length) {
                  toast.error("No candidate data to export");
                  return;
                }
                exportToCSV(interviewDetail.interview_results);
                toast.success("CSV downloaded!");
              }}
              className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <FileDown size={16} />
              Download CSV
            </Button>

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAlert(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 size={16} />
              Delete Interview
            </Button>
          </div>
        </div>

        {/* Interview Meta */}
        <div className="mt-4 flex items-center justify-between lg:pr-52">
          <div>
            <h2 className="text-sm text-gray-500">Duration</h2>
            <div className="font-bold text-sm flex gap-2 items-center">
              <Clock className="h-4 w-4" />
              {interviewDetail?.duration}
            </div>
          </div>

          <div>
            <h2 className="text-sm text-gray-500">Created on</h2>
            <div className="font-bold text-sm flex gap-2 items-center">
              <Calendar className="h-4 w-4" />

              {/* ⭐ FIXED — Convert UTC → IST */}
              {moment
                .utc(interviewDetail?.created_at)
                .tz("Asia/Kolkata")
                .format("MMMM Do YYYY, h:mm a")}
            </div>
          </div>

          {interviewDetail?.type && (
            <div>
              <h2 className="text-sm text-gray-500">Type</h2>
              <div className="font-bold text-sm">
                {JSON.parse(interviewDetail.type)[0]}
              </div>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="mt-5">
          <h2 className="font-bold">Job Description</h2>
          <p className="text-sm whitespace-pre-wrap">{interviewDetail?.jobDescription}</p>
        </div>

        {/* Questions */}
        <div className="mt-5">
          <h2 className="font-bold">Interview Questions</h2>
          <div className="grid grid-cols-1 gap-3 mt-3">
            {parsedQuestions.map((q, i) => (
              <div key={i} className="text-sm flex gap-2 items-start">
                <MessageCircleQuestionIcon className="h-4 w-4 text-primary" />
                {i + 1}. {q?.question}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will permanently delete:
              <ul className="mt-2 list-disc list-inside">
                <li>Interview</li>
                <li>All candidate responses</li>
                <li>All feedback</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InterviewDetailContainer;
