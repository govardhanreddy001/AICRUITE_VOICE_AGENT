import { Calendar, Clock, MessageCircleQuestionIcon, Trash2, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import exportToCSV from "@/lib/exportToCSV"; // ✅ Make sure this path is correct

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

  // ✅ Excel export logic
  const handleDownloadExcel = () => {
    if (!interviewDetail?.interview_results || interviewDetail.interview_results.length === 0) {
      toast.error("No candidate data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      interviewDetail.interview_results.map((c) => ({
        "Candidate Name": c.fullName,
        Email: c.email,
        "Completed At": moment(c.completedAt).format("YYYY-MM-DD HH:mm"),
        Recommendations: c.recommendations,
        Transcript: JSON.stringify(c.conversationTranscript),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "interview_results.xlsx");

    toast.success("Excel downloaded successfully!");
  };

  // ✅ Parse questions safely
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

  // ✅ Delete interview logic
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error: resultsError } = await supabase
        .from("interview_results")
        .delete()
        .eq("interviewId", interviewDetail.interview_id);

      if (resultsError) console.error("Error deleting interview results:", resultsError);

      const { error: interviewError } = await supabase
        .from("interviews")
        .delete()
        .eq("interview_id", interviewDetail.interview_id);

      if (interviewError) throw interviewError;

      toast.success("Interview deleted successfully!");
      setShowDeleteAlert(false);
      router.push("/recruiter/dashboard");
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast.error("Failed to delete interview. Please try again.");
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
            {/* ✅ Excel Download Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
            >
              <FileDown size={16} />
              Download Excel
            </Button>

            {/* ✅ CSV Download Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!interviewDetail?.interview_results || interviewDetail.interview_results.length === 0) {
                  toast.error("No candidate data to export for CSV");
                  return;
                }
                exportToCSV(interviewDetail.interview_results);
                toast.success("CSV downloaded successfully!");
              }}
              className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <FileDown size={16} />
              Download CSV
            </Button>

            {/* Delete Interview Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAlert(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Interview
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between lg:pr-52">
          <div>
            <h2 className="text-sm text-gray-500">Duration</h2>
            <h2 className="font-bold flex text-sm items-center gap-2">
              <Clock className="h-4 w-4" />
              {interviewDetail?.duration}
            </h2>
          </div>

          <div>
            <h2 className="text-sm text-gray-500">Created on</h2>
            <h2 className="font-bold flex text-sm items-center gap-2">
              <Calendar className="h-4 w-4" />
              {moment(interviewDetail?.created_at).format("MMMM Do YYYY, h:mm a")}
            </h2>
          </div>

          {interviewDetail?.type && (
            <div>
              <h2 className="text-sm text-gray-500">Type</h2>
              <h2 className="font-bold flex text-sm items-center gap-2">
                <Clock className="h-4 w-4" />
                {JSON.parse(interviewDetail?.type)[0]}
              </h2>
            </div>
          )}
        </div>

        <div className="mt-5">
          <h2 className="font-bold">Job Description</h2>
          <p className="text-sm leading-6 whitespace-pre-wrap">
            {interviewDetail?.jobDescription}
          </p>
        </div>

        <div className="mt-5">
          <h2 className="font-bold">Interview Questions</h2>
          <div className="grid grid-cols-1 mt-3 gap-5">
            {parsedQuestions.map((item, index) => (
              <h2 className="text-sm flex items-center gap-2" key={index}>
                <MessageCircleQuestionIcon className="h-4 w-4 text-primary" />
                <span>
                  {index + 1}. {item?.Interviewquestion || item?.question}
                </span>
              </h2>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the interview for{" "}
              <strong>{interviewDetail?.jobPosition}</strong>? This action cannot be undone and will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The interview link</li>
                <li>All candidate responses ({interviewDetail["interview_results"]?.length || 0} candidates)</li>
                <li>All feedback and ratings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Interview"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InterviewDetailContainer;
