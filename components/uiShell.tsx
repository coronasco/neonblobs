import type { ReactNode } from 'react';


export default function UiShell({ children }: { children: ReactNode }) {
return (
<main className="min-h-[100dvh] bg-gradient-to-br from-[#0a0f1f] via-[#0a0f1f] to-[#111642]">
<div className="mx-auto max-w-[1400px] px-6 py-8">{children}</div>
</main>
);
}