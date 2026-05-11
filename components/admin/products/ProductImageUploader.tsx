'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, ImageIcon, Star } from 'lucide-react';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

const MAX_IMAGES = 8;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export default function ProductImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: unsupported type. Use JPEG, PNG, WebP, or AVIF.`;
    }
    if (file.size > MAX_SIZE) {
      return `${file.name}: exceeds 5 MB limit.`;
    }
    return null;
  };

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setErrors([]);
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        setErrors([`Maximum ${MAX_IMAGES} images per product.`]);
        return;
      }

      const toUpload = files.slice(0, remaining);
      const validationErrors: string[] = [];
      const validFiles: File[] = [];

      for (const file of toUpload) {
        const err = validateFile(file);
        if (err) validationErrors.push(err);
        else validFiles.push(file);
      }

      if (validationErrors.length > 0) setErrors(validationErrors);
      if (validFiles.length === 0) return;

      setUploading(true);
      const uploaded: string[] = [];
      const uploadErrors: string[] = [...validationErrors];

      for (const file of validFiles) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch('/api/admin/upload/product-image', {
            method: 'POST',
            body: fd,
          });
          if (res.ok) {
            const data = (await res.json()) as { path: string };
            uploaded.push(data.path);
          } else {
            const data = (await res.json()) as { error?: string };
            uploadErrors.push(data.error ?? `Failed to upload ${file.name}.`);
          }
        } catch {
          uploadErrors.push(`Failed to upload ${file.name}.`);
        }
      }

      if (uploadErrors.length > 0) setErrors(uploadErrors);
      if (uploaded.length > 0) onChange([...images, ...uploaded]);
      setUploading(false);
    },
    [images, onChange]
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    void uploadFiles(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    void uploadFiles(files);
    e.target.value = '';
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const setAsMain = (index: number) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Dropzone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false); }}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed transition-all duration-200 ${
          uploading
            ? 'border-zinc-700 opacity-60 cursor-not-allowed'
            : dragOver
            ? 'border-cyan-400/60 bg-cyan-400/5 cursor-pointer'
            : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/40 cursor-pointer'
        }`}
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label="Upload product images"
        onKeyDown={(e) => { if (!uploading && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={handleChange}
          aria-hidden="true"
        />
        <div className="w-10 h-10 flex items-center justify-center border border-zinc-700 bg-zinc-900">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <Upload size={18} className="text-zinc-500" aria-hidden="true" />
          )}
        </div>
        <div className="text-center pointer-events-none">
          <p className="text-xs text-zinc-400 font-semibold">
            {uploading ? 'Uploading…' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">
            JPEG · PNG · WebP · AVIF — max 5 MB each · up to {MAX_IMAGES} images
          </p>
        </div>
      </div>

      {/* Validation / upload errors */}
      {errors.length > 0 && (
        <div className="flex flex-col gap-1 p-3 border border-red-500/30 bg-red-500/5">
          {errors.map((err, i) => (
            <p key={i} className="text-[10px] text-red-400">{err}</p>
          ))}
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div
              key={src + i}
              className="relative group/img aspect-square border border-zinc-800 overflow-hidden bg-zinc-900"
            >
              <img
                src={src}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Main badge (first image) */}
              {i === 0 && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-cyan-400 text-black text-[8px] font-black px-1.5 py-0.5 tracking-wider uppercase">
                  <Star size={7} aria-hidden="true" /> Main
                </div>
              )}

              {/* Set as main button (non-first images, shown on hover) */}
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => setAsMain(i)}
                  className="absolute top-1.5 left-1.5 hidden group-hover/img:flex items-center gap-0.5 bg-zinc-900/90 text-zinc-300 text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide hover:text-cyan-400 transition-colors"
                  aria-label={`Set image ${i + 1} as main`}
                >
                  <Star size={7} aria-hidden="true" /> Main
                </button>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 hidden group-hover/img:flex w-6 h-6 items-center justify-center bg-zinc-900/90 hover:bg-red-500/80 text-zinc-300 hover:text-white transition-all"
                aria-label={`Remove image ${i + 1}`}
              >
                <X size={11} aria-hidden="true" />
              </button>

              {/* Position badge */}
              <div className="absolute bottom-1.5 right-1.5 bg-zinc-900/70 text-zinc-500 text-[8px] font-bold px-1.5 py-0.5 leading-none">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3 border border-zinc-800/50 bg-zinc-900/20">
          <ImageIcon size={13} className="text-zinc-600 shrink-0" aria-hidden="true" />
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            No images uploaded. The product will use the fallback color/gradient visual.
          </p>
        </div>
      )}
    </div>
  );
}
