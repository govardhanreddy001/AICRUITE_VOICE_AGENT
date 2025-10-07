"use client";
import { supabase } from "@/services/supabaseClient";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import InterviewDetailContainer from "./_components/InteviewDetailContainer";
import CandidateList from "./_components/CandidateList";

function InterviewDetail() {
  const { interview_id } = useParams();
  const { user } = useUser();
  const [interviewDetail, setInterviewDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (interview_id) {
      GetInterviewDetail();
    }
  }, [interview_id, user]);

  const GetInterviewDetail = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("interviews")
        .select(`
          interview_id,
          jobPosition,
          jobDescription,
          type,
          questionList,
          duration,
          created_at,
          userEmail,
          interview_results (
            id,
            email,
            fullName,
            conversationTranscript,
            recommendations,
            interviewId,
            completedAt
          )
        `)
        .eq("interview_id", interview_id)
        .single();

      if (error) throw error;

      setInterviewDetail(data);
    } catch (err) {
      console.error("Error fetching interview details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-5 flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!interviewDetail) {
    return (
      <div className="mt-5 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-600">
        No interview found
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-6">
      <h2 className="font-bold text-2xl">Interview Details</h2>
      <InterviewDetailContainer interviewDetail={interviewDetail} />
      <CandidateList candidateList={interviewDetail.interview_results || []} />
    </div>
  );
}

export default InterviewDetail;
