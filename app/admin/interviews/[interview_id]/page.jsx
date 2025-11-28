'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft, XCircle } from 'lucide-react';
import moment from 'moment-timezone';   // ⭐ UPDATED

export default function InterviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params?.interview_id;

  const [interview, setInterview] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (interviewId) fetchDetails();
  }, [interviewId]);

  const fetchDetails = async () => {
    setLoading(true);

    const { data: interviewData, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .eq('interview_id', interviewId)
      .single();

    if (interviewError) {
      setInterview(null);
      setLoading(false);
      return;
    }
    setInterview(interviewData);

    const { data: resultsData } = await supabase
      .from('interview_results')
      .select('*')
      .eq('interviewId', interviewId);

    setResults(resultsData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-16">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Interview Not Found</h2>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Button onClick={() => router.back()} variant="outline" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Interview Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {interview.jobPosition || 'Untitled Interview'}
          </CardTitle>

          <CardDescription>
            Created by: <span className="font-medium">{interview.userEmail}</span>
            <span className="ml-4 text-gray-500">
              {/* ⭐ IST TIME FIX */}
              {moment.utc(interview.created_at).tz("Asia/Kolkata").format("MMM DD, YYYY hh:mm A")}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-semibold">Description:</span> {interview.jobDescription}
          </div>
          <div>
            <span className="font-semibold">Interview ID:</span> {interview.interview_id}
          </div>
          <div>
            <span className="font-semibold">Total Candidates:</span> {results.length}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Results */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Results</CardTitle>
          <CardDescription>All candidates who participated in this interview</CardDescription>
        </CardHeader>

        <CardContent>
          {results.length === 0 ? (
            <div className="text-gray-500">No candidates have participated yet.</div>
          ) : (
            <div className="divide-y">
              {results.map((result) => {
                let transcriptObj = null;
                try {
                  transcriptObj = result.conversationTranscript;
                } catch {
                  transcriptObj = null;
                }

                const feedback = transcriptObj?.feedback || {};
                const ratings = feedback?.rating || {};
                const summary = feedback?.summery || feedback?.summary || '';
                const recommendation = feedback?.Recommendation || '';
                const recommendationMsg =
                  feedback?.RecommendationMessage ||
                  feedback?.["Recommendation Message"] ||
                  '';

                const ratingValues = Object.values(ratings).filter(
                  (val) => typeof val === 'number'
                );
                const avgScore = ratingValues.length
                  ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(2)
                  : 'N/A';

                return (
                  <div key={result.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {result.fullName}
                        </h3>
                        <div className="text-xs text-gray-500">{result.email}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{avgScore}</div>
                        <div className="text-xs text-gray-500">Average Score</div>
                      </div>
                    </div>

                    {/* Ratings Breakdown */}
                    {Object.keys(ratings).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {Object.entries(ratings).map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold text-gray-800">{value}/10</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    {summary && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">Summary:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {summary}
                        </p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {recommendation && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">Recommendation:</h4>
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            recommendation.toLowerCase().includes('recommended')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {recommendation}
                        </div>

                        {recommendationMsg && (
                          <p className="text-sm text-gray-600 mt-1">{recommendationMsg}</p>
                        )}
                      </div>
                    )}

                    {/* ⭐ FIXED CompletedAt timezone */}
                    <div className="text-xs text-gray-400">
                      Completed:{' '}
                      {result.completedAt
                        ? moment.utc(result.completedAt).tz("Asia/Kolkata").format("MMM DD, YYYY hh:mm A")
                        : 'Not completed'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
