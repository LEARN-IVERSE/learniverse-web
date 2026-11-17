import { ApiStatus } from "@/features/system/api-status";

// Temporary K1 page: connectivity check. The real UI comes in K2 (App Shell).
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl p-8">
      <h1 className="mb-1 text-3xl font-bold text-blue-700">LEARNIVERSE</h1>
      <p className="mb-6 text-gray-600">OUR UNIVERSE OF LEARNING — kiểm tra kết nối hệ thống</p>
      <ApiStatus />
    </main>
  );
}
