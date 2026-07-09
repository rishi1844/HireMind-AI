import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";

export const metadata = {
  title: "New Resume — Vita AI Resume Builder",
  description: "Create a beautifully formatted, ATS-optimized resume with AI assistance.",
};

export default function NewResumePage() {
  return <ResumeBuilderShell mode="create" />;
}
