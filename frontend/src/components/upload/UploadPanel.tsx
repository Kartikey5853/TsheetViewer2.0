import { UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";

interface UploadPanelProps {
  title: string;
  endpoint: "current" | "previous";
  onUpload: (file: File, endpoint: "current" | "previous") => Promise<void>;
}

export default function UploadPanel({ title, endpoint, onUpload }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const acceptHint = useMemo(() => ".xlsx, .xls", []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!file) {
      setError("Invalid TSheet structure. Please upload a valid TSheet Excel file.");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      await onUpload(file, endpoint);
      setFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid TSheet structure. Please upload a valid TSheet Excel file.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent p-2">
          <UploadCloud size={18} className="text-accent-foreground" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">Upload Excel file ({acceptHint})</p>
        </div>
      </div>
      <input
        type="file"
        accept={acceptHint}
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setError("");
        }}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isUploading}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </button>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </form>
  );
}
