import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Print Resume",
  robots: "noindex, nofollow",
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black p-0 m-0">
      {children}
    </div>
  );
}
