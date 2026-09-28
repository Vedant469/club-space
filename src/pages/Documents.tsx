import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Upload,
  Download,
  Trash2,
  Pencil,
  Search,
  FileText,
} from 'lucide-react'
import { supabase, CLUB_ID, friendlyError } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import type { ClubDocument } from '../types'

type SortKey = 'date' | 'name' | 'size'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'webp',
])

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
])

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function isAllowedFile(file: File): boolean {
  const extension = getExtension(file.name)

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return false
  }

  if (!file.type) {
    return true
  }

  return ALLOWED_MIME_TYPES.has(file.type)
}

export default function Documents() {
  const { user } = useAuth()

  const [docs, setDocs] = useState<ClubDocument[] | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('date')
  const [uploading, setUploading] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('club_id', CLUB_ID)
      .order('created_at', { ascending: false })

    if (error) {
      setError(friendlyError(error))
      return
    }

    setDocs((data as ClubDocument[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const visible = useMemo(() => {
    if (!docs) return []

    const filtered = docs.filter((d) =>
      d.file_name.toLowerCase().includes(search.toLowerCase())
    )

    return [...filtered].sort((a, b) => {
      if (sort === 'name') {
        return a.file_name.localeCompare(b.file_name)
      }

      if (sort === 'size') {
        return (b.file_size ?? 0) - (a.file_size ?? 0)
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      )
    })
  }, [docs, search, sort])

  async function handleUpload(files: FileList | null) {
    if (!files || !user) return

    setError(null)

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `"${file.name}" is too large. Maximum file size is 10 MB.`
        )
        continue
      }

      if (!isAllowedFile(file)) {
        setError(
          `"${file.name}" is not a supported file type.`
        )
        continue
      }

      setUploading((prev) => [...prev, file.name])

      const path = `${CLUB_ID}/${crypto.randomUUID()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('club-documents')
        .upload(path, file)

      if (uploadError) {
        setError(friendlyError(uploadError))

        setUploading((prev) =>
          prev.filter((name) => name !== file.name)
        )

        continue
      }

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          club_id: CLUB_ID,
          uploaded_by: user.id,
          file_name: file.name,
          storage_path: path,
          mime_type: file.type || null,
          file_size: file.size,
        })

      if (insertError) {
        await supabase.storage
          .from('club-documents')
          .remove([path])

        setError(friendlyError(insertError))

        setUploading((prev) =>
          prev.filter((name) => name !== file.name)
        )

        continue
      }

      setUploading((prev) =>
        prev.filter((name) => name !== file.name)
      )
    }

    await load()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleDownload(doc: ClubDocument) {
    setError(null)

    const { data, error } = await supabase.storage
      .from('club-documents')
      .createSignedUrl(doc.storage_path, 60)

    if (error || !data) {
      setError(
        friendlyError(
          error ?? new Error('Unable to create download link.')
        )
      )
      return
    }

    window.open(data.signedUrl, '_blank')
  }

  async function handleRename(doc: ClubDocument) {
    const newName = window.prompt(
      'Rename document',
      doc.file_name
    )

    if (!newName || newName === doc.file_name) {
      return
    }

    const trimmedName = newName.trim()

    if (!trimmedName) {
      return
    }

    const { error } = await supabase
      .from('documents')
      .update({
        file_name: trimmedName,
      })
      .eq('id', doc.id)

    if (error) {
      setError(friendlyError(error))
      return
    }

    await load()
  }

  async function handleDelete(doc: ClubDocument) {
    const confirmed = window.confirm(
      `Delete "${doc.file_name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setError(null)

    setDocs(
      (prev) =>
        prev?.filter((d) => d.id !== doc.id) ?? null
    )

    const { error: storageError } = await supabase.storage
      .from('club-documents')
      .remove([doc.storage_path])

    if (storageError) {
      setError(friendlyError(storageError))
      await load()
      return
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id)

    if (error) {
      setError(friendlyError(error))
      await load()
    }
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-deep">
          ✧ Documents
        </h1>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <Upload size={16} />
          Upload
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {uploading.length > 0 ? (
        <div className="space-y-2">
          {uploading.map((name) => (
            <div
              key={name}
              className="rounded-xl bg-lavender/30 px-3 py-2"
            >
              <p className="text-xs text-deep truncate">
                Uploading: {name}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />

          <input
            placeholder="Search documents"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-lavender pl-9 pr-3 py-2 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as SortKey)
          }
          className="rounded-xl border border-lavender px-3 py-2 text-sm text-deep outline-none"
        >
          <option value="date">Newest</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
        </select>
      </div>

      {docs === null ? (
        <LoadingSkeleton count={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          glyph="✧"
          title="Your archive is empty"
          subtitle="Upload something to get started."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((d) => (
            <div
              key={d.id}
              className="rounded-card bg-white/70 border border-lavender/60 p-4 flex items-start gap-3 hover:shadow-soft transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-lavender/50 flex items-center justify-center text-primary shrink-0">
                <FileText size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-deep truncate">
                  {d.file_name}
                </p>

                <p className="text-xs text-muted mt-0.5">
                  {formatSize(d.file_size)}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(d)}
                  aria-label="Download"
                  className="p-1.5 rounded-lg text-muted hover:text-deep hover:bg-lavender/40"
                >
                  <Download size={15} />
                </button>

                <button
                  onClick={() => handleRename(d)}
                  aria-label="Rename"
                  className="p-1.5 rounded-lg text-muted hover:text-deep hover:bg-lavender/40"
                >
                  <Pencil size={15} />
                </button>

                <button
                  onClick={() => handleDelete(d)}
                  aria-label="Delete"
                  className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}