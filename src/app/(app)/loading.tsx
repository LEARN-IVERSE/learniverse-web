import { PageSkeleton } from "@/components/states/page-skeleton";

// Shown inside the App Shell while a page segment streams in.
export default function Loading() {
  return <PageSkeleton />;
}
