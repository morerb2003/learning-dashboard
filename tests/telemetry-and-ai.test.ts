import assert from "node:assert/strict";
import test from "node:test";
import {
  recordCourseView,
  getCourseViews,
  recordLearnerXp,
  getLearnerLeaderboard,
  recordActivityPulse,
  getRecentActivityFeed,
} from "../lib/telemetry.ts";
import { askAiTutor, generateAiQuiz } from "../lib/ai/service.ts";
import { withAiProtection } from "../lib/ai/protection.ts";

test("Telemetry: records and retrieves course views", async () => {
  const courseId = `course-test-${Date.now()}`;
  const viewer1 = "student-1";
  const viewer2 = "student-2";

  // First view
  const res1 = await recordCourseView(courseId, viewer1);
  assert.ok(res1.total >= 1);
  assert.ok(res1.unique >= 1);

  // Second view by different student
  const res2 = await recordCourseView(courseId, viewer2);
  assert.ok(res2.total >= res1.total);

  // Retrieve stats
  const stats = await getCourseViews(courseId);
  assert.ok(stats.total >= 2);
});

test("Telemetry: records learner XP and maintains ranked leaderboard", async () => {
  const time = Date.now();
  const studentA = `learner_alpha_${time}`;
  const studentB = `learner_beta_${time}`;

  // Record XP
  await recordLearnerXp(studentA, "Alpha", 150);
  await recordLearnerXp(studentB, "Beta", 450);

  const leaderboard = await getLearnerLeaderboard(10);
  assert.ok(Array.isArray(leaderboard));
  assert.ok(leaderboard.length > 0);

  // High score should be higher ranked
  const entryB = leaderboard.find((e) => e.userId === studentB);
  const entryA = leaderboard.find((e) => e.userId === studentA);

  assert.ok(entryB, "Beta should be on the leaderboard");
  assert.ok(entryA, "Alpha should be on the leaderboard");
  assert.ok(entryB.xp > entryA.xp, "Beta XP must be greater than Alpha XP");
  assert.ok(entryB.rank <= entryA.rank, "Beta must have higher or equal rank");
});

test("Telemetry: activity pulse feed pushes and returns chronologically", async () => {
  const eventTitle = `Completed Next.js Lab at ${Date.now()}`;
  await recordActivityPulse({
    type: "lesson_complete",
    title: eventTitle,
    actor: "Learner John",
  });

  const feed = await getRecentActivityFeed(10);
  assert.ok(Array.isArray(feed));
  assert.ok(feed.length > 0);

  const match = feed.find((e) => e.title === eventTitle);
  assert.ok(match, "Recent event must appear in the activity feed");
  assert.equal(match.actor, "Learner John");
  assert.equal(match.type, "lesson_complete");
});

test("AI Suite: askAiTutor generates structured explanation with takeaways", async () => {
  const { result } = await askAiTutor(
    {
      courseTitle: "Advanced Next.js 16",
      lessonTitle: "Server Components and Streaming",
    },
    "What is the difference between Server and Client Components?",
    "test-student-1"
  );

  assert.ok(result.answer, "AI Tutor should provide an answer");
  assert.ok(result.answer.length > 20, "Answer should be substantive");
  assert.ok(Array.isArray(result.keyTakeaways), "Key takeaways should be an array");
  assert.ok(result.keyTakeaways.length > 0, "Should have at least 1 takeaway");
  assert.ok(result.recommendedAction, "Should provide a recommended action");
});

test("AI Suite: generateAiQuiz produces valid questions, options, and correct answers", async () => {
  const { result: quiz } = await generateAiQuiz(
    {
      topic: "TypeScript Generics and Utility Types",
      difficulty: "intermediate",
      count: 3,
    },
    "test-teacher-1"
  );

  assert.ok(quiz.title, "Quiz should have a title");
  assert.ok(quiz.description, "Quiz should have a description");
  assert.ok(Array.isArray(quiz.questions), "Quiz should have questions array");
  assert.equal(quiz.questions.length, 3, "Quiz should have exactly 3 questions");

  for (const q of quiz.questions) {
    assert.ok(q.question, "Question text must exist");
    assert.equal(q.options.length, 4, "Each question must have 4 options");
    assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, "Correct index must be valid (0-3)");
    assert.ok(q.explanation, "Each question must have an explanation");
  }
});

test("AI Suite: withAiProtection caches identical queries", async () => {
  let computeCount = 0;
  const prompt = `Explain memoization ${Date.now()}`;

  const generator = async () => {
    computeCount++;
    return { data: "computed result" };
  };

  // First call: runs generator
  const run1 = await withAiProtection({
    userId: "user-cache-test",
    feature: "tutor",
    prompt,
    generator,
    ttlSeconds: 60,
  });

  assert.equal(computeCount, 1);
  assert.equal(run1.cached, false);
  assert.equal(run1.result.data, "computed result");

  // Second call: serves from cache
  const run2 = await withAiProtection({
    userId: "user-cache-test",
    feature: "tutor",
    prompt,
    generator,
    ttlSeconds: 60,
  });

  assert.equal(computeCount, 1, "Generator should NOT run again for cached prompt");
  assert.equal(run2.cached, true, "Should report as cached");
  assert.equal(run2.result.data, "computed result");
});
