"use client";

import {
  ArrowLeft,
  BookOpen,
  Bot,
  ChevronDown,
  Flag,
  GraduationCap,
  MessageCircle,
  PencilLine,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  CHAPTERS,
  POSTS,
  SUBJECTS,
  TOP_CONTRIBUTORS,
  TOP_STUDY_TIME,
  type Lesson,
  type Ranked,
  type Subject,
} from "./mock-data";

/** Visual personality of a sample; shared views adapt spacing, radius and color intensity. */
export type Look = "classic" | "playful" | "minimal";

export type Section = "learn" | "social" | "rank";

export const NAV_ITEMS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "learn", label: "Học tập", icon: GraduationCap },
  { id: "social", label: "Mạng xã hội", icon: Users },
  { id: "rank", label: "Bảng xếp hạng", icon: Trophy },
];

// Static class names per subject color (Tailwind cannot see dynamically built class names).
const SUBJECT_STYLES: Record<string, { soft: string; text: string; solid: string; ring: string }> = {
  blue: { soft: "bg-blue-50", text: "text-blue-700", solid: "bg-blue-600", ring: "ring-blue-200" },
  emerald: {
    soft: "bg-emerald-50",
    text: "text-emerald-700",
    solid: "bg-emerald-600",
    ring: "ring-emerald-200",
  },
  amber: { soft: "bg-amber-50", text: "text-amber-700", solid: "bg-amber-500", ring: "ring-amber-200" },
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-600",
];

/** djb2 string hash: spreads similar Vietnamese names over the palette better than a plain char sum. */
function nameHash(name: string): number {
  let h = 5381;
  for (const ch of name) h = ((h * 33) ^ (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

/** Default avatar: first letter of the display name on a color fixed by the name. */
export function InitialAvatar({ name, className }: { name: string; className?: string }) {
  const hash = nameHash(name);
  const initial = name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "?";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
        AVATAR_COLORS[hash % AVATAR_COLORS.length],
        className,
      )}
    >
      {initial}
    </span>
  );
}

export function StarProgress({ stars }: { stars: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${stars}/4 sao`}>
      {[0, 1, 2, 3].map((i) => (
        <Star
          key={i}
          className={cn("size-4", i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
        />
      ))}
      {stars === 4 && (
        <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700">
          Hoàn thành
        </Badge>
      )}
    </span>
  );
}

const LESSON_ACTIONS: { label: string; icon: LucideIcon }[] = [
  { label: "Lý thuyết", icon: BookOpen },
  { label: "Bài tập", icon: PencilLine },
  { label: "Dạy AI", icon: Bot },
  { label: "Ôn tập", icon: RotateCcw },
];

/** Lesson row: the 4 activity icons appear on hover/keyboard focus (desktop) or after a tap (mobile). */
export function LessonRow({ lesson, look }: { lesson: Lesson; look: Look }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "group flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
        look === "playful" ? "rounded-2xl bg-white shadow-sm" : "rounded-lg hover:bg-muted/60",
        look === "minimal" && "rounded-none border-b hover:bg-transparent",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex flex-1 flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="font-medium">{lesson.title}</span>
        <StarProgress stars={lesson.stars} />
      </button>
      <div
        className={cn(
          "flex gap-1 transition-opacity",
          open ? "opacity-100" : "hidden sm:flex sm:opacity-0",
          "sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
        )}
      >
        {LESSON_ACTIONS.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            size="sm"
            variant={look === "playful" ? "secondary" : "ghost"}
            className={cn(look === "playful" && "rounded-full")}
            aria-label={label}
          >
            <Icon className="size-4" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function SubjectCard({ subject, look, onOpen }: { subject: Subject; look: Look; onOpen: () => void }) {
  const s = SUBJECT_STYLES[subject.color];
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden pt-0",
        look === "playful" && "rounded-3xl border-0 shadow-md ring-2",
        look === "playful" && s.ring,
        look === "minimal" && "shadow-none",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-5",
          look === "playful" ? `${s.solid} py-6 text-white` : `${s.soft} py-4`,
        )}
      >
        <span className={cn(look === "playful" ? "text-4xl" : "text-3xl")}>{subject.emoji}</span>
        <span className={cn("text-xl font-bold", look !== "playful" && s.text)}>{subject.name}</span>
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <p className="text-sm text-muted-foreground">{subject.description}</p>
        <div className="flex items-center gap-2 text-sm">
          <Progress value={subject.progress} className="h-2" />
          <span className="w-10 text-right text-muted-foreground">{subject.progress}%</span>
        </div>
        <Button onClick={onOpen} className={cn(look === "playful" && "rounded-full")}>
          XEM BÀI HỌC
        </Button>
      </CardContent>
    </Card>
  );
}

/** "Học tập": subject cards, then the chapter/lesson list of the chosen subject. */
export function LearnView({ look }: { look: Look }) {
  const [subject, setSubject] = useState<Subject | null>(null);

  if (!subject) {
    return (
      <section className="space-y-4">
        <ViewTitle look={look} title="Học tập" subtitle="Chọn môn học để bắt đầu" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SUBJECTS.map((s) => (
            <SubjectCard key={s.id} subject={s} look={look} onOpen={() => setSubject(s)} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setSubject(null)}>
          <ArrowLeft className="size-4" /> Môn học
        </Button>
        <ViewTitle
          look={look}
          title={subject.name}
          subtitle="Rê chuột (hoặc chạm) vào bài để chọn hoạt động"
        />
      </div>
      <Input placeholder="Tìm bài học..." className="max-w-sm" />
      {CHAPTERS.map((chapter) => (
        <div key={chapter.id} className={cn(look === "playful" ? "space-y-2" : "rounded-xl border")}>
          <div className="flex items-center justify-between px-3 py-2 font-semibold">
            {chapter.title}
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
          <div className={cn(look === "playful" ? "space-y-2" : "px-1 pb-1")}>
            {chapter.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} look={look} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** "Mạng xã hội": subject boxes, newest posts first, comments and report buttons, pagination. */
export function SocialView({ look }: { look: Look }) {
  const boxes = ["Tất cả", "BOX TOÁN 9", "BOX TIẾNG ANH 9", "BOX NGỮ VĂN 9"];
  const [box, setBox] = useState(boxes[0]);
  const posts = box === boxes[0] ? POSTS : POSTS.filter((p) => p.box === box);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewTitle look={look} title="Mạng xã hội" subtitle="Hỏi đáp và chia sẻ kiến thức" />
        <Button className={cn(look === "playful" && "rounded-full")}>
          <Plus className="size-4" /> Đăng bài
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {boxes.map((b) => (
          <Button
            key={b}
            size="sm"
            variant={b === box ? "default" : "outline"}
            className={cn(look === "playful" && "rounded-full")}
            onClick={() => setBox(b)}
          >
            {b}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {posts.map((p) => (
          <Card
            key={p.id}
            className={cn(look === "playful" && "rounded-3xl", look === "minimal" && "shadow-none")}
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <InitialAvatar name={p.author} />
              <div className="flex-1">
                <CardTitle className="text-sm">{p.author}</CardTitle>
                <CardDescription>
                  {p.time} · {p.box}
                </CardDescription>
              </div>
              <Button size="icon" variant="ghost" aria-label="Báo cáo">
                <Flag className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-muted-foreground">{p.body}</p>
              <Button variant="secondary" size="sm" className={cn(look === "playful" && "rounded-full")}>
                <MessageCircle className="size-4" /> BÌNH LUẬN ({p.comments})
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1">
        <Button size="sm" variant="outline">
          Trang trước
        </Button>
        {[1, 2, 3].map((n) => (
          <Button key={n} size="sm" variant={n === 1 ? "default" : "ghost"}>
            {n}
          </Button>
        ))}
        <Button size="sm" variant="outline">
          Trang sau
        </Button>
      </div>
    </section>
  );
}

/** Rank for each row with ties sharing the same rank ("đồng hạng"). */
function withRanks(rows: Ranked[]): (Ranked & { rank: number })[] {
  return rows.map((row, i) => {
    const firstSame = rows.findIndex((r) => r.value === row.value);
    return { ...row, rank: (firstSame === -1 ? i : firstSame) + 1 };
  });
}

function RankTable({ title, rows, look }: { title: string; rows: Ranked[]; look: Look }) {
  return (
    <Card className={cn(look === "playful" && "rounded-3xl", look === "minimal" && "shadow-none")}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>TOP 10 · toàn thời gian</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {withRanks(rows).map((r) => (
          <div key={r.name} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-sm font-bold",
                r.rank === 1 ? "bg-amber-400 text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {r.rank}
            </span>
            <InitialAvatar name={r.name} className="size-8" />
            <span className="flex-1 font-medium">{r.name}</span>
            <span className="text-sm text-muted-foreground">{r.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RankView({ look }: { look: Look }) {
  return (
    <section className="space-y-4">
      <ViewTitle look={look} title="Bảng xếp hạng" subtitle="Ghi nhận đóng góp và thời gian học" />
      <div className="grid gap-4 lg:grid-cols-2">
        <RankTable title="Thành viên tích cực" rows={TOP_CONTRIBUTORS} look={look} />
        <RankTable title="Thời gian học tập" rows={TOP_STUDY_TIME} look={look} />
      </div>
    </section>
  );
}

export function SectionView({ section, look }: { section: Section; look: Look }) {
  if (section === "social") return <SocialView look={look} />;
  if (section === "rank") return <RankView look={look} />;
  return <LearnView look={look} />;
}

function ViewTitle({ title, subtitle, look }: { title: string; subtitle: string; look: Look }) {
  return (
    <div>
      <h1 className={cn("font-bold", look === "playful" ? "text-3xl" : "text-2xl")}>{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** Floating AI assistant button (bottom-right on every page) with a small chat panel mock. */
export function AiFab({ look }: { look: Look }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed right-4 bottom-20 z-40 flex flex-col items-end gap-3 md:bottom-6">
      {open && (
        <Card className={cn("w-80 max-w-[calc(100vw-2rem)]", look === "playful" && "rounded-3xl")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> Trợ lý AI
            </CardTitle>
            <Button size="icon" variant="ghost" aria-label="Đóng" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-xl bg-muted p-3 text-sm">
              Chào em! Em cần giải thích bài nào? Mình sẽ hướng dẫn từng bước nhé.
            </p>
            <div className="flex gap-2">
              <Input placeholder="Nhập câu hỏi..." />
              <Button size="icon" aria-label="Gửi">
                <Send className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Button
        size="lg"
        aria-label="Mở trợ lý AI"
        onClick={() => setOpen((v) => !v)}
        className={cn("size-14 rounded-full shadow-lg", look === "minimal" && "size-12")}
      >
        <Bot className="size-6" />
      </Button>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span className="font-semibold text-foreground">LEARNIVERSE</span>
        <span>Giới thiệu</span>
        <span>Liên hệ</span>
        <span>Điều khoản</span>
        <span>Chính sách bảo mật</span>
      </div>
    </footer>
  );
}
