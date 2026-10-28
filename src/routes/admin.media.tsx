import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  Copy,
  Trash2,
  Check,
  ImageIcon,
  FileVideo,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signUpload } from "@/lib/admin/cases.functions";
import {
  listMediaFiles,
  deleteMediaFile,
  type MediaFileItem,
} from "@/lib/admin/media.functions";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Médiathèque — Volka Admin" },
    ],
  }),
  loader: () => listMediaFiles(),
  component: AdminMediaPage,
});

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function AdminMediaPage() {
  const initialFiles = Route.useLoaderData() as MediaFileItem[];
  const [files, setFiles] = React.useState<MediaFileItem[]>(initialFiles);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploading(true);
    const newFiles: MediaFileItem[] = [];
    try {
      for (const file of Array.from(fileList)) {
        const { signedUrl, path } = await signUpload({
          data: { filename: file.name, contentType: file.type },
        });
        const res = await fetch(signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!res.ok) throw new Error(`Échec upload ${file.name} (${res.status})`);

        // Derive public URL from Vite env (client-side only)
        const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] ?? "";
        newFiles.push({
          name: path,
          id: path,
          size: file.size,
          contentType: file.type,
          publicUrl: `${supabaseUrl}/storage/v1/object/public/media/${path}`,
        });
      }
      setFiles((prev) => [...newFiles, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (file: MediaFileItem) => {
    if (!window.confirm(`Supprimer « ${file.name} » de la médiathèque ?`)) return;
    setDeleting(file.id);
    try {
      await deleteMediaFile({ data: { path: file.name } });
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  const isImage = (ct: string) => ct.startsWith("image/");
  const isVideo = (ct: string) => ct.startsWith("video/");

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-forest-black">Médiathèque</h1>
          <p className="text-sm text-forest-black/70 mt-0.5">
            Fichiers stockés dans le bucket Supabase{" "}
            <code className="text-xs bg-pine/10 px-1 rounded">media</code>.
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-pine hover:bg-pine/90 text-paper text-xs shrink-0"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin mr-1.5" />
          ) : (
            <Upload className="size-3.5 mr-1.5" />
          )}
          {uploading ? "Upload en cours..." : "Importer des fichiers"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Drag-drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center justify-center gap-3 h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragOver
            ? "border-pine bg-pine/10 text-forest-black"
            : "border-pine/25 bg-soft-paper/60 hover:border-pine/50 hover:bg-soft-paper text-forest-black/50"
        }`}
      >
        <Upload className="size-5" />
        <span className="text-sm">
          Glissez des images ou vidéos ici, ou cliquez pour parcourir
        </span>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">
          <AlertTriangle className="size-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Stats strip */}
      <div className="text-xs text-forest-black/50 font-mono">
        {files.length} fichier{files.length !== 1 ? "s" : ""} —{" "}
        {formatBytes(files.reduce((sum, f) => sum + (f.size || 0), 0))} total
      </div>

      {/* Grid */}
      {files.length === 0 ? (
        <div className="py-20 text-center text-forest-black/40 text-sm">
          Aucun fichier dans la médiathèque. Importez votre premier média ci-dessus.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-lg overflow-hidden border border-pine/10 bg-warm-ivory shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-soft-paper/80 flex items-center justify-center overflow-hidden">
                {isImage(file.contentType) ? (
                  <img
                    src={file.publicUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : isVideo(file.contentType) ? (
                  <FileVideo className="size-10 text-pine/40" />
                ) : (
                  <ImageIcon className="size-10 text-pine/40" />
                )}
              </div>

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-forest-black/0 group-hover:bg-forest-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(file.id, file.publicUrl);
                  }}
                  className="p-2 bg-warm-ivory rounded-md shadow text-forest-black hover:bg-ochre hover:text-white transition-colors"
                  title="Copier l'URL"
                >
                  {copiedId === file.id ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-warm-ivory rounded-md shadow text-forest-black hover:bg-pine hover:text-paper transition-colors"
                  title="Ouvrir"
                >
                  <ExternalLink className="size-3.5" />
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file);
                  }}
                  disabled={deleting === file.id}
                  className="p-2 bg-warm-ivory rounded-md shadow text-forest-black hover:bg-terracotta hover:text-white transition-colors"
                  title="Supprimer"
                >
                  {deleting === file.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>

              {/* File info */}
              <div className="p-2 border-t border-pine/10">
                <p
                  className="text-[11px] font-mono text-forest-black/70 truncate"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-[10px] text-forest-black/40">{formatBytes(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
