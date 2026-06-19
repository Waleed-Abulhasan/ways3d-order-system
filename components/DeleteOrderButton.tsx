'use client'

import { useState, useRef, useEffect } from 'react'
import { Trash2, Loader2, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeleteOrderButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)
    await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div ref={ref} className="relative flex-shrink-0 flex items-center">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o) }}
        className="p-2 rounded-lg text-brand-muted hover:text-white hover:bg-brand-elevated border border-transparent hover:border-brand-border transition-all"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden w-36">
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete Order
          </button>
        </div>
      )}
    </div>
  )
}
