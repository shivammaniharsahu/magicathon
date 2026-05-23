import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute inset-0 -z-10 dot-pattern opacity-30" />
      <header className="px-6 py-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center p-6">{children}</main>
    </div>
  );
}
