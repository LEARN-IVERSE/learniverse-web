import type { Page } from "@playwright/test";

// Fake K5 activity API: a 3-question exercise graded in the browser test, shaped like learniverse-api.
const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";

const QUESTIONS = [
  {
    id: "q-choice",
    type: "single_choice",
    prompt_md: "Phương trình nào là phương trình bậc nhất hai ẩn?",
    options: ["$2x + 3y = 5$", "$xy = 4$"],
  },
  {
    id: "q-truth",
    type: "true_false",
    prompt_md: "Cặp số $(2; 1)$ là nghiệm của $2x - y = 3$.",
    options: null,
  },
  {
    id: "q-blank",
    type: "fill_blank",
    prompt_md: "Với $x + y = 5$ và $x = 3$, $y$ bằng bao nhiêu?",
    options: null,
  },
];
const KEY: Record<string, unknown> = { "q-choice": 0, "q-truth": true, "q-blank": ["2"] };
const RIGHT = (id: string, given: unknown) =>
  Array.isArray(KEY[id]) ? (KEY[id] as string[]).includes(String(given).trim()) : KEY[id] === given;

type Options = { available?: boolean; readCompleted?: boolean };

export async function mockActivityApi(
  page: Page,
  { available = true, readCompleted }: Options = {},
): Promise<void> {
  const base = "**/api/v1/subjects/math/lessons/lesson-1";
  await page.route(`${base}/activities`, (route) =>
    route.fulfill({
      json: {
        kind: "lesson",
        periodic: null,
        read: { started: true, completed: Boolean(readCompleted), remaining_seconds: 0 },
        activities: ["theory", "exercise", "review"].map((activity) => ({
          activity,
          available,
          earned: false,
          best_score: null,
          open_attempt_id: null,
        })),
      },
    }),
  );
  if (readCompleted !== undefined) {
    await page.route(`${base}/read/*`, (route) =>
      route.fulfill({
        json: { started: true, completed: readCompleted, remaining_seconds: readCompleted ? 0 : 120 },
      }),
    );
  }
  await page.route(`${base}/attempts`, async (route) => {
    if (!available) {
      return route.fulfill({
        status: 409,
        json: { error: { code: "activity_not_ready", message: "Chức năng này chưa mở: chưa đủ câu hỏi." } },
      });
    }
    const { activity } = route.request().postDataJSON() as { activity: string };
    return route.fulfill({
      json: {
        id: ATTEMPT_ID,
        activity,
        status: "in_progress",
        total: QUESTIONS.length,
        questions: QUESTIONS,
        deadline: null,
        time_limit_seconds: null,
      },
    });
  });
  await page.route(`**/api/v1/attempts/${ATTEMPT_ID}/submit`, (route) => {
    const { answers } = route.request().postDataJSON() as {
      answers: { question_id: string; answer: unknown }[];
    };
    const graded = QUESTIONS.map((q) => {
      const given = answers.find((a) => a.question_id === q.id)?.answer ?? null;
      return {
        ...q,
        your_answer: given,
        correct_answer: KEY[q.id],
        is_correct: RIGHT(q.id, given),
        explanation_md: "Lời giải mẫu.",
      };
    });
    const correct = graded.filter((q) => q.is_correct).length;
    const passed = correct === QUESTIONS.length;
    return route.fulfill({
      json: {
        attempt_id: ATTEMPT_ID,
        activity: "exercise",
        total: QUESTIONS.length,
        correct,
        wrong: QUESTIONS.length - correct,
        score: Math.round((correct / QUESTIONS.length) * 100) / 10,
        passed,
        star_awarded: passed,
        lesson_stars: passed ? 1 : 0,
        lesson_completed: false,
        questions: graded,
        review_topics: passed ? [] : [{ position: 1, title: "Phương trình bậc nhất hai ẩn" }],
        late: false,
        streak: passed ? { current: 3, best: 3, increased: true } : null,
      },
    });
  });
}

/** A 2-minute periodic test whose submit is recorded, to check the automatic hand-in. */
export async function mockPeriodicApi(page: Page, submitted: { body: unknown[] }): Promise<void> {
  const base = "**/api/v1/subjects/math/lessons/midterm-1-review";
  const lesson = {
    subject_code: "math",
    subject_name: "Toán 9",
    unit_title: "Giữa học kì I",
    code: "midterm-1-review",
    kind: "periodic",
    label: null,
    title: "Ôn tập giữa kì I",
    sections: [],
  };
  await page.route(base, (route) => route.fulfill({ json: lesson }));
  await page.route(`${base}/activities`, (route) =>
    route.fulfill({
      json: {
        kind: "periodic",
        read: null,
        periodic: { question_count: 3, time_limit_minutes: 2, pass_percent: 50 },
        activities: [
          { activity: "periodic", available: true, earned: false, best_score: null, open_attempt_id: null },
        ],
      },
    }),
  );
  await page.route(`${base}/attempts`, (route) =>
    route.fulfill({
      json: {
        id: "22222222-2222-4222-8222-222222222222",
        activity: "periodic",
        status: "in_progress",
        total: QUESTIONS.length,
        questions: QUESTIONS,
        deadline: new Date(Date.now() + 120_000).toISOString(),
        time_limit_seconds: 120,
      },
    }),
  );
  await page.route("**/api/v1/attempts/22222222-2222-4222-8222-222222222222/submit", (route) => {
    submitted.body.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        attempt_id: "22222222-2222-4222-8222-222222222222",
        activity: "periodic",
        total: 3,
        correct: 0,
        wrong: 3,
        score: 0,
        passed: false,
        star_awarded: false,
        lesson_stars: 0,
        lesson_completed: false,
        questions: [],
        review_topics: [],
        late: false,
        streak: null,
      },
    });
  });
}
