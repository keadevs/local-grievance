'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui';
import { apiFetch } from '@/lib/utils';

export interface UploadedFile {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

interface Props {
  folder: 'profiles' | 'complaints';
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  max?: number;
  label?: string;
}

/**
 * Accessible multi-image uploader. Files are posted immediately to
 * `/api/uploads`, which re-encodes them server-side (EXIF stripped).
 */
export function ImageUploader({ folder, value, onChange, max = 5, label = 'Upload photos' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const remaining = max - value.length;
      if (remaining <= 0) {
        setError(`You can attach at most ${max} image(s).`);
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.append('folder', folder);
        Array.from(fileList)
          .slice(0, remaining)
          .forEach((file) => form.append('files', file));

        const result = await apiFetch<{ files: UploadedFile[] }>('/api/uploads', { method: 'POST', body: form });
        onChange([...value, ...result.files]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [folder, max, onChange, value],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id={`upload-${folder}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={max > 1}
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button type="button" variant="secondary" loading={busy} onClick={() => inputRef.current?.click()}>
          {label}
        </Button>
        <span className="text-xs text-slate-500">
          JPEG, PNG or WebP · up to {max} image{max > 1 ? 's' : ''}
        </span>
      </div>

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {value.map((file) => (
            <li key={file.url} className="relative h-24 w-24 overflow-hidden rounded-lg ring-1 ring-slate-200">
              <Image src={file.url} alt={file.fileName} fill sizes="96px" className="object-cover" unoptimized />
              <button
                type="button"
                aria-label={`Remove ${file.fileName}`}
                onClick={() => onChange(value.filter((f) => f.url !== file.url))}
                className="absolute right-1 top-1 rounded-full bg-slate-900/70 px-1.5 text-xs font-bold text-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
