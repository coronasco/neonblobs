
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto">
      <header className="sticky top-0 bg-white w-full py-6">
        <Link href="/">Browser Game</Link>
      </header>
      <main className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">Browser Game</h1>
        <p className="text-lg">Welcome to the Browser Game</p>
        <Link href="/play" className="text-blue-500">Play Game</Link>
      </main>
    </div>
  );
}
