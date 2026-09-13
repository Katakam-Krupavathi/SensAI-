"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileCheck,
  Target,
  BarChart3,
  Lightbulb,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import { scoreResumeAgainstJob, scoreResumeGeneral } from "@/actions/ats-score";

export default function AtsChecker({ resumeContent, initialAtsScore, initialFeedback }) {
  const [jobDescription, setJobDescription] = useState("");
  const [activeAnalysisType, setActiveAnalysisType] = useState("job"); // 'job' | 'general'

  // Parse initial feedback if stored as JSON string
  let parsedInitialFeedback = null;
  if (initialFeedback) {
    try {
      parsedInitialFeedback =
        typeof initialFeedback === "string"
          ? JSON.parse(initialFeedback)
          : initialFeedback;
    } catch (e) {
      parsedInitialFeedback = {
        summary: initialFeedback,
        atsScore: initialAtsScore || 70,
        matchedKeywords: [],
        missingKeywords: [],
        strengths: [],
        improvements: [initialFeedback],
        formattingFeedback: [],
      };
    }
  }

  const {
    loading: isScoringJob,
    fn: scoreJobFn,
    data: jobScoreResult,
  } = useFetch(scoreResumeAgainstJob);

  const {
    loading: isScoringGeneral,
    fn: scoreGeneralFn,
    data: generalScoreResult,
  } = useFetch(scoreResumeGeneral);

  const currentResult = jobScoreResult || generalScoreResult || parsedInitialFeedback;
  const isAnalyzing = isScoringJob || isScoringGeneral;

  const handleScoreAgainstJob = async () => {
    if (!resumeContent) return;
    setActiveAnalysisType("job");
    await scoreJobFn({ resumeContent, jobDescription });
  };

  const handleScoreGeneral = async () => {
    if (!resumeContent) return;
    setActiveAnalysisType("general");
    await scoreGeneralFn({ resumeContent });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500 border-green-500/30 bg-green-500/10";
    if (score >= 60) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-red-500 border-red-500/30 bg-red-500/10";
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { label: "High ATS Compatibility", variant: "default" };
    if (score >= 60) return { label: "Moderate Match (Needs Optimization)", variant: "secondary" };
    return { label: "Low ATS Compatibility", variant: "destructive" };
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Input Controls Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                ATS Compatibility & Keyword Matcher
              </CardTitle>
              <CardDescription>
                Analyze how well your resume matches target job postings and pass automated applicant tracking systems.
              </CardDescription>
            </div>
            {currentResult?.atsScore !== undefined && (
              <div className="flex items-center gap-2">
                <div
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border ${getScoreColor(
                    currentResult.atsScore
                  )}`}
                >
                  <span className="text-2xl font-black">{Math.round(currentResult.atsScore)}</span>
                  <span className="text-[10px] font-medium tracking-tight uppercase">Score</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Target Job Description (Optional for general audit)</span>
              <span className="text-xs text-muted-foreground">
                Paste the full job posting to check keyword alignment
              </span>
            </label>
            <Textarea
              placeholder="Paste job description, required skills, and qualifications here..."
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="resize-y font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleScoreAgainstJob}
              disabled={isAnalyzing || !jobDescription.trim() || !resumeContent}
              className="flex-1 min-w-[200px]"
            >
              {isScoringJob ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Job Match...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Score Against Job Description
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleScoreGeneral}
              disabled={isAnalyzing || !resumeContent}
              className="flex-1 min-w-[200px]"
            >
              {isScoringGeneral ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Auditing Resume Structure...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Run General ATS Audit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {currentResult && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Executive Overview */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  ATS Audit & Match Overview
                </CardTitle>
                <Badge variant={getScoreBadge(currentResult.atsScore).variant}>
                  {getScoreBadge(currentResult.atsScore).label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground bg-muted/40 p-4 rounded-lg border">
                {currentResult.summary}
              </p>

              {/* Keywords Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Matched Keywords */}
                <div className="p-4 rounded-lg border bg-green-500/5 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Matched Keywords ({currentResult.matchedKeywords?.length || 0})
                  </h4>
                  {currentResult.matchedKeywords?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {currentResult.matchedKeywords.map((kw, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 text-xs py-0.5"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No specific target keywords matched yet.</p>
                  )}
                </div>

                {/* Missing Keywords */}
                <div className="p-4 rounded-lg border bg-amber-500/5 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    Missing / Recommended Skills ({currentResult.missingKeywords?.length || 0})
                  </h4>
                  {currentResult.missingKeywords?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {currentResult.missingKeywords.map((kw, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs py-0.5"
                        >
                          + {kw}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No major missing keywords detected!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actionable Recommendations & Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Improvements */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Lightbulb className="h-4 w-4" />
                  Actionable Improvements & Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {currentResult.improvements?.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Identified Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {currentResult.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Formatting & Structure Feedback */}
          {currentResult.formattingFeedback?.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  ATS Formatting & Parseability Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {currentResult.formattingFeedback.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold">→</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
