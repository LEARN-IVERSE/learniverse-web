import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BookOpen } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";

describe("shared states", () => {
  // Vitest globals are off, so Testing Library cannot register its automatic cleanup.
  afterEach(cleanup);

  it("empty state shows its title, description and actions", () => {
    render(
      <EmptyState icon={BookOpen} title="Chưa có bài học nào" description="Nội dung sẽ có sớm.">
        <button type="button">Tải lại</button>
      </EmptyState>,
    );
    expect(screen.getByRole("region", { name: "Chưa có bài học nào" })).toBeTruthy();
    expect(screen.getByText("Nội dung sẽ có sớm.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tải lại" })).toBeTruthy();
  });

  it("error state is announced and retries on click", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("Ối, có lỗi xảy ra");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("error state without a handler offers no retry button", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("loading skeleton is exposed as a status", () => {
    render(<PageSkeleton />);
    expect(screen.getByRole("status", { name: "Đang tải" })).toBeTruthy();
  });
});
