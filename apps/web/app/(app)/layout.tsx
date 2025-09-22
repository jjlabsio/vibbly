import { NavBar } from "@/components/navbar";

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
