import { redirect } from "next/navigation";

export default function LegacyCreateResumeRedirect() {
  redirect("/resume/builder/new");
}
