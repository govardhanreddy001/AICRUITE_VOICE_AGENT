"use client";

import { useUser } from "@/app/provider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { Video } from "lucide-react";
import React, { useEffect, useState } from "react";
import InterviewCard from "../dashboard/_components/interviewcard";
import { useRouter } from "next/navigation";

function ScheduledInterview() {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (user?.email) {
      GetInterviewList();
    }
  }, [user]);

  const GetInterviewList = async () => {
    const { data, error } = await supabase
      .from("interviews")
      .select(`
        interview_id,
        jobPosition,
        jobDescription,
        duration,
        created_at,
        interview_results(*)
      `)
      .eq("userEmail", user?.email) // recruiter’s interviews
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message, error.details);
      setInterviewList([]);
    } else {
      console.log("Fetched interviews:", data);
      setInterviewList(data || []);
    }
  };

  return (
    <div className="mt-5">
      <h2 className="font-bold text-2xl mb-4">Your Scheduled Interviews</h2>

      {interviewList.length === 0 ? (
        <div className="p-5 flex flex-col items-center gap-3 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Video className="text-primary h-10 w-10" />
          <h2 className="text-base">You don’t have any interviews yet</h2>
          <Button
            className="cursor-pointer"
            onClick={() =>
              router.push("/recruiter/dashboard/create-interview")
            }
          >
            + Create New Interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {interviewList.map((interview) => (
            <InterviewCard
              key={interview.interview_id}
              interview={interview}
              viewDetail={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ScheduledInterview;
