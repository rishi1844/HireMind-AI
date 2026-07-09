import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";

interface Props {
  params: { id: string };
}

export default function EditResumePage({ params }: Props) {
  const numericId = Number.parseInt(params.id, 10);

  if (Number.isNaN(numericId)) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Invalid resume ID.
      </div>
    );
  }

  return <ResumeBuilderShell mode="edit" resumeId={numericId} />;
}
