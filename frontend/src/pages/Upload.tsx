import { useNavigate } from "react-router-dom";
import UploadPanel from "@/components/upload/UploadPanel";
import { tsheetService } from "@/services/tsheetService";

export default function Upload() {
  const navigate = useNavigate();

  const handleUpload = async (file: File, endpoint: "current" | "previous"): Promise<void> => {
    if (endpoint === "current") {
      await tsheetService.uploadCurrent(file);
      navigate("/dashboard");
      return;
    }

    await tsheetService.uploadPrevious(file);
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-4">
      <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-center text-3xl font-bold">
          Upload Your <span className="logo-gradient">TSheet</span>
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Upload the current semester Excel sheet and continue to dashboard.
        </p>
        <div className="mt-5">
          <UploadPanel title="Current Semester" endpoint="current" onUpload={handleUpload} />
        </div>
      </article>
    </section>
  );
}
