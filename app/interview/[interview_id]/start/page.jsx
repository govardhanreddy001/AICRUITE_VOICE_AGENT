"use client";

import { InterviewDataContext } from "@/context/InterviewDataContext";
import { Mic, Phone, Timer } from "lucide-react";
import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import AlertConfirmation from "./_components/AlertConfirmation";
import axios from "axios";
import { FEEDBACK_PROMPT } from "@/services/Constants";
import TimmerComponent from "./_components/TimmerComponent";
import { getVapiClient } from "@/lib/vapiconfig";
import { supabase } from "@/services/supabaseClient";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import moment from "moment-timezone";   // ⭐ ADDED

function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
  const vapi = getVapiClient();
  const [activeUser, setActiveUser] = useState(false);
  const [start, setStart] = useState(false);
  const [subtitles, setSubtitles] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const conversation = useRef(null);
  const { interview_id } = useParams();

  const router = useRouter();
  const [userProfile, setUserProfile] = useState({
    picture: null,
    name: interviewInfo?.candidate_name || "Candidate",
  });
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // Restore interviewInfo from localStorage
  useEffect(() => {
    if (!interviewInfo && typeof window !== "undefined") {
      const stored = localStorage.getItem("interviewInfo");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.interview_id === interview_id) {
            setInterviewInfo(parsed);
          } else {
            localStorage.removeItem("interviewInfo");
            router.replace(`/interview/${interview_id}`);
          }
        } catch {
          localStorage.removeItem("interviewInfo");
          router.replace(`/interview/${interview_id}`);
        }
      } else {
        router.replace(`/interview/${interview_id}`);
      }
    }
  }, [interviewInfo, interview_id, setInterviewInfo, router]);

  useEffect(() => {
    if (interviewInfo && interviewInfo.jobPosition && vapi && !start) {
      setStart(true);
      startCall();
    }
  }, [interviewInfo, vapi]);

  const startCall = async () => {
    const jobPosition = interviewInfo?.jobPosition || "Unknown Position";
    const questionList =
      interviewInfo?.questionList?.interviewQuestions?.map((q) => q?.question) || [];

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${interviewInfo?.candidate_name}, how are you? Ready for your interview on ${interviewInfo?.jobPosition}?`,
      transcriber: { provider: "deepgram", model: "nova-3", language: "en-US" },
      voice: { provider: "playht", voiceId: "jennifer" },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
You are an AI voice assistant conducting interviews.
Ask questions one at a time and wait for candidate responses.
Questions: ${questionList}
Encourage the candidate and end with a positive summary.
`.trim(),
          },
        ],
      },
    };

    vapi.start(assistantOptions);
  };

  useEffect(() => {
    if (!vapi) return;

    const handleMessage = (message) => {
      if (message?.role === "assistant" && message?.content) {
        setSubtitles(message.content);
      }

      if (message?.conversation) {
        const filtered = message.conversation.filter((m) => m.role !== "system");
        conversation.current = JSON.stringify(filtered, null, 2);
      }
    };

    const handleSpeechStart = () => {
      setIsSpeaking(true);
      setActiveUser(false);
      toast("AI is speaking...");
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      setActiveUser(true);
    };

    vapi.on("message", handleMessage);
    vapi.on("call-start", () => {
      toast("Call started...");
      setStart(true);
    });
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-end", () => {
      toast("Call ended. Generating feedback...");
      setIsGeneratingFeedback(true);
      GenerateFeedback();
    });

    return () => {
      vapi.off("message", handleMessage);
      vapi.off("call-start", () => {});
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-end", () => {});
    };
  }, [vapi]);

  const GenerateFeedback = async () => {
    if (!interviewInfo || !conversation.current) {
      toast.error("Interview data missing. Restart the interview.");
      router.replace(`/interview/${interview_id}`);
      return;
    }

    try {
      const result = await axios.post("/api/ai-feedback", {
        conversation: conversation.current,
      });

      const Content = result?.data?.content
        ?.replace("```json", "")
        ?.replace("```", "")
        ?.trim();

      if (!Content) throw new Error("No content returned");

      let parsedTranscript = JSON.parse(Content);

      const { error: insertError } = await supabase.from("interview_results").insert([
        {
          fullName: interviewInfo?.candidate_name,
          email: interviewInfo?.userEmail,
          interviewId: interview_id,
          conversationTranscript: parsedTranscript,
          recommendations: "Not recommended",

          // ⭐ FIXED TIMEZONE (save IST instead of UTC)
          completedAt: moment().tz("Asia/Kolkata").format(),
        },
      ]);

      if (insertError) throw insertError;

      toast.success("Feedback generated!");

      localStorage.removeItem("interviewInfo");

      router.replace(`/interview/${interviewInfo?.interview_id}/completed`);
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to generate feedback");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const stopInterview = () => vapi.stop();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* UI unchanged */}
      {/* ... your full UI stays the same ... */}
    </div>
  );
}

export default StartInterview;
