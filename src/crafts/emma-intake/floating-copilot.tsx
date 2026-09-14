import { useRef } from 'react'
import { ArrowUp, File as FileIcon, Paperclip, UploadSimple, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface CapturedFile {
  name: string
  sizeLabel: string
}

/**
 * The single entry point for the whole intake flow. Idle: a compact pill -
 * attach, intent text, send. It detects a file drag over the stage and
 * reacts by expanding itself (not a separate overlay) into a dropzone;
 * once a file lands, it expands again to show the file chip inline above
 * the composer row. `compact` narrows it for the staging footer, where it's
 * just a follow-up composer (no file logic).
 */
export function PromptBarFloater({
  file,
  intent,
  onIntentChange,
  onBrowse,
  onClearFile,
  onSubmit,
  isDragActive,
  dropHint,
  placeholder,
  compact,
  className,
}: {
  file: CapturedFile | null
  intent: string
  onIntentChange: (value: string) => void
  onBrowse: (fileList: FileList | null) => void
  onClearFile: () => void
  onSubmit: () => void
  isDragActive?: boolean
  dropHint?: string
  placeholder: string
  compact?: boolean
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const expanded = isDragActive || !!file

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col rounded-[26px] bg-background-base shadow-button-gray transition-[max-width,box-shadow] duration-300',
        compact ? 'max-w-[440px]' : expanded ? 'max-w-[640px]' : 'max-w-[560px]',
        isDragActive && 'shadow-ai ring-2 ring-brand-primary/40',
        className,
      )}
    >
      {isDragActive && (
        <div className="m-1.5 flex flex-col items-center gap-1.5 rounded-[20px] border-2 border-dashed border-brand-primary/50 bg-brand-muted/30 px-4 py-5 text-center">
          <UploadSimple className="size-5 text-brand-text" />
          <p className="text-label-xs text-brand-text">Drop it here</p>
          {dropHint && <p className="text-caption text-text-muted">{dropHint}</p>}
        </div>
      )}

      {!isDragActive && file && (
        <div className="m-1.5 mb-0 flex items-center gap-2 rounded-2xl bg-background-highlight px-2.5 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-text">
            <FileIcon className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-xs text-text-primary">{file.name}</p>
            <p className="text-caption text-text-muted">{file.sizeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClearFile}
            aria-label="Remove file"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {!isDragActive && (
        <div className="flex items-center gap-1.5 p-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
            aria-label="Attach a file"
          >
            <Paperclip className="size-4" />
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              onBrowse(e.target.files)
              e.target.value = ''
            }}
          />

          <input
            type="text"
            value={intent}
            onChange={(e) => onIntentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && file) onSubmit()
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent px-1.5 text-paragraph-sm text-text-primary outline-none placeholder:text-text-muted"
          />

          <button
            type="button"
            onClick={onSubmit}
            disabled={!file}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
              file
                ? 'bg-brand-primary text-text-on-color hover:opacity-90'
                : 'bg-background-highlight text-text-disabled',
            )}
            aria-label="Send to Emma"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
