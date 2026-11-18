"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  Flag,
  Flame,
  PencilLine,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { SubjectId } from "../mock-data";
import { OrbitSystem, ProgressRing, RingsDecor, StarNode, SubjectBackdrop, SubjectScene } from "./art";
import { CONTINUE, ME, PATH, WEEK, WORLDS, type PathChapter, type PathItem, type World } from "./data";

const ACTIVITIES: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "Lý thuyết", icon: BookOpen, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
  { label: "Bài tập", icon: PencilLine, tone: "bg-orange-50 text-orange-700 ring-orange-200" },
  { label: "Dạy AI", icon: Bot, tone: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  { label: "Ôn tập", icon: RotateCcw, tone: "bg-green-50 text-green-700 ring-green-200" },
];

function worldOf(id: SubjectId): World {
  return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
}

function StarsInline({ stars, light }: { stars: number; light?: boolean }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${stars}/4 sao`}>
      {[0, 1, 2, 3].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < stars ? "fill-amber-400 text-amber-400" : light ? "text-white/40" : "text-slate-300",
          )}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------- home

/** "Học tập" landing: greeting with the orbit illustration, resume card, then the three subject worlds. */
export function LearnHome({ onOpen }: { onOpen: (id: SubjectId) => void }) {
  const resume = worldOf(CONTINUE.world);
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-white ring-1 ring-blue-100">
        <div className="grid items-center md:grid-cols-[1.15fr_1fr]">
          <div className="space-y-5 p-6 md:p-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              <Sparkles className="size-3.5" /> Chuỗi {ME.streakDays} ngày, giữ lửa nhé!
            </p>
            <h1 className="font-display text-3xl leading-tight font-bold md:text-4xl">
              Chào {ME.name}!<span className="block text-blue-600">Hôm nay mình bay tới hành tinh nào?</span>
            </h1>
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-3">
                <ProgressRing
                  value={ME.goalDone / ME.goalTotal}
                  size={64}
                  stroke={7}
                  color="#2563eb"
                  label={`${ME.goalDone}/${ME.goalTotal}`}
                />
                <div className="text-sm">
                  <p className="font-semibold">Mục tiêu hôm nay</p>
                  <p className="text-muted-foreground">Hoàn thành {ME.goalTotal} hoạt động</p>
                </div>
              </div>
              <ol className="flex gap-1.5" aria-label="Chuỗi học trong tuần">
                {WEEK.map((d) => (
                  <li
                    key={d.day}
                    className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-full",
                        d.done ? "bg-orange-100 text-orange-600" : "bg-muted",
                        d.today && "ring-2 ring-orange-300 ring-offset-2",
                      )}
                    >
                      {d.done ? (
                        <Flame className="size-4" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-slate-300" />
                      )}
                    </span>
                    {d.day}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <OrbitSystem className="mx-auto h-52 w-full max-w-md md:h-72" planets={WORLDS} />
        </div>
      </section>

      <section className="relative flex flex-col gap-4 overflow-hidden rounded-[1.75rem] bg-blue-600 p-5 text-white sm:flex-row sm:items-center md:p-6">
        <RingsDecor className="pointer-events-none absolute -top-16 -right-10 size-56 text-white/10" />
        <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-2xl font-bold">
          {resume.glyph}
        </span>
        <div className="relative flex-1">
          <p className="text-sm text-blue-100">
            Học tiếp · {resume.name} · {CONTINUE.activity}
          </p>
          <p className="font-display text-xl font-bold">{CONTINUE.lesson}</p>
          <StarsInline stars={CONTINUE.stars} light />
        </div>
        <button
          type="button"
          onClick={() => onOpen(resume.id)}
          className="relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
        >
          Học tiếp <ArrowRight className="size-4" />
        </button>
      </section>

      <section aria-labelledby="worlds-title" className="space-y-4">
        <div>
          <h2 id="worlds-title" className="font-display text-2xl font-bold">
            Ba hành tinh môn học
          </h2>
          <p className="text-sm text-muted-foreground">
            Mỗi hành tinh là một lộ trình bài học, đi đúng thứ tự trong sách.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {WORLDS.map((w) => (
            <WorldCard key={w.id} world={w} onOpen={() => onOpen(w.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function WorldCard({ world, onOpen }: { world: World; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="d-world group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white text-left ring-1 ring-black/5 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none"
    >
      <div className="relative h-40 overflow-hidden">
        <div className="d-world-art absolute inset-0">
          <SubjectScene id={world.id} className="h-full w-full" />
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow-sm">
          {world.lessonsDone}/{world.lessonsTotal} bài
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className={cn("font-display text-2xl font-bold", world.ink)}>{world.name}</h3>
          <p className="text-sm text-muted-foreground">{world.tagline}</p>
        </div>
        <div className="mt-auto flex items-center gap-3">
          <ProgressRing value={world.stars / world.starsTotal} size={44} stroke={5} color={world.color} />
          <div className="text-sm">
            <p className="font-semibold">
              {world.stars}/{world.starsTotal} sao
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round((world.stars / world.starsTotal) * 100)}% hành trình
            </p>
          </div>
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white transition group-hover:gap-2"
            style={{ background: world.color }}
          >
            Vào học <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------- subject world

/** A subject page: themed cover, themed background and the lesson path grouped by chapter. */
export function SubjectWorld({ id, onBack }: { id: SubjectId; onBack: () => void }) {
  const world = worldOf(id);
  const [query, setQuery] = useState("");
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Các hành tinh
      </button>

      {/* Split cover: text on the left, the 2:1 illustration on the right, so the art is never cropped. */}
      <section className="overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5 md:grid md:grid-cols-[1fr_1.3fr]">
        <div className="relative aspect-[2/1] md:order-2 md:aspect-auto md:min-h-64">
          <SubjectScene id={id} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 md:order-1 md:p-8">
          <div>
            <p className={cn("text-[11px] font-bold tracking-[.25em] uppercase", world.ink)}>Hành tinh</p>
            <h1 className="font-display text-4xl leading-none font-bold md:text-5xl">{world.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{world.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing
              value={world.stars / world.starsTotal}
              size={56}
              stroke={6}
              color={world.color}
              label={`${Math.round((world.stars / world.starsTotal) * 100)}%`}
            />
            <div className="space-y-1 text-sm">
              <p className="inline-flex items-center gap-1.5 font-semibold">
                <Check className="size-4 text-green-600" /> {world.lessonsDone}/{world.lessonsTotal} bài hoàn
                thành
              </p>
              <p className="flex items-center gap-1.5 font-semibold">
                <Star className="size-4 fill-amber-400 text-amber-400" /> {world.stars}/{world.starsTotal} sao
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative isolate space-y-5 rounded-[2rem] p-1 md:p-2">
        <SubjectBackdrop id={id} className="absolute inset-0 -z-10" />
        <label className="relative block max-w-md">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Tìm bài học trong ${world.name}...`}
            aria-label="Tìm bài học"
            className="h-11 w-full rounded-full bg-white pr-4 pl-10 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>
        {PATH.map((chapter) => (
          <ChapterPath key={chapter.id} chapter={chapter} world={world} query={query} />
        ))}
      </div>
    </div>
  );
}

function ChapterPath({ chapter, world, query }: { chapter: PathChapter; world: World; query: string }) {
  const [open, setOpen] = useState(true);
  const q = query.trim().toLowerCase();
  const items = chapter.items.filter((it) => it.title.toLowerCase().includes(q));
  if (items.length === 0) return null;
  const lessons = chapter.items.filter((it) => it.kind === "lesson");
  const done = lessons.filter((it) => it.kind === "lesson" && it.stars === 4).length;
  return (
    <section className="rounded-[1.75rem] bg-white/85 p-4 ring-1 ring-black/5 md:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="font-display text-xl font-bold">{chapter.title}</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {done}/{lessons.length} bài hoàn thành
        </span>
        <ChevronDown
          className={cn("ml-auto size-5 text-muted-foreground transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <ol className="relative mt-5 space-y-4 pl-16">
          <span
            aria-hidden
            className="absolute top-6 bottom-6 left-[24px] w-1 rounded-full"
            style={{
              background: `repeating-linear-gradient(to bottom, ${world.color}66 0 10px, transparent 10px 18px)`,
            }}
          />
          {items.map((it) =>
            it.kind === "lesson" ? (
              <PathLesson key={it.id} item={it} world={world} />
            ) : (
              <PathMilestone key={it.id} item={it} />
            ),
          )}
        </ol>
      )}
    </section>
  );
}

type LessonItem = Extract<PathItem, { kind: "lesson" }>;

/** One lesson on the path. The 4 activity chips show on hover/keyboard focus (desktop) or after a tap. */
function PathLesson({ item, world }: { item: LessonItem; world: World }) {
  const [open, setOpen] = useState(false);
  const done = item.stars === 4;
  return (
    <li className="relative">
      <div className="absolute top-0 -left-16">
        <StarNode stars={item.stars} no={item.no} color={world.color} done={done} />
      </div>
      <div
        className={cn(
          "group rounded-2xl bg-white p-4 ring-1 transition focus-within:ring-2 focus-within:ring-blue-300",
          done ? "ring-amber-200" : "ring-black/5",
          "hover:shadow-[0_14px_30px_-20px_rgba(37,99,235,.7)]",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left outline-none"
        >
          <span className={cn("text-xs font-bold tracking-wider uppercase", world.ink)}>Bài {item.no}</span>
          <span className="font-semibold">{item.title}</span>
          {done ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              <Trophy className="size-3.5" /> Hoàn thành bài học
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
              <StarsInline stars={item.stars} />
            </span>
          )}
        </button>
        {/* Collapsed until hover / keyboard focus / tap, then slides open (no empty space while hidden). */}
        <div className="d-reveal" data-open={open}>
          <div>
            <div className="grid grid-cols-2 gap-2 pt-3 sm:grid-cols-4">
              {ACTIVITIES.map((a, i) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition hover:-translate-y-0.5",
                      a.tone,
                    )}
                  >
                    <Icon className="size-4" />
                    {a.label}
                    {i < item.stars && (
                      <Star
                        aria-label="đã đạt sao"
                        className="ml-auto size-3.5 fill-amber-400 text-amber-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function PathMilestone({ item }: { item: Extract<PathItem, { kind: "milestone" }> }) {
  return (
    <li className="relative">
      <span className="absolute top-0 -left-16 grid size-[52px] place-items-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-white">
        <Flag className="size-5" />
      </span>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">Cột mốc định kỳ</p>
          <p className="font-display text-lg font-bold">{item.title}</p>
          <p className="text-sm text-amber-900/70">{item.note} · hoàn thành để giữ chuỗi học</p>
        </div>
        <button
          type="button"
          className="ml-auto rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          Làm đề
        </button>
      </div>
    </li>
  );
}
