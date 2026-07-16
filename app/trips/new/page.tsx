import Link from "next/link";
import TripForm from "@/app/components/trip-form";

export default function NewTripPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">旅ノート</Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="border-b border-stone-300 pb-4">
          <Link href="/" className="text-sm font-medium text-teal-800 hover:underline">← 旅行一覧に戻る</Link>
          <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">新しい旅行を作る</h1>
          <p className="mt-1 text-sm text-stone-500">まずは旅行の基本情報を記録します。</p>
        </div>
        <TripForm cancelHref="/" />
      </div>
    </main>
  );
}
