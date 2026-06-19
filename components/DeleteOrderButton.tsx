'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeleteOrderButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
        confirming
          ? 'bg-red-500/20 border-red-500/50 text-red-400'
          : 'bg-brand-elevated border-brand-border text-brand-muted hover:text-red-400 hover:border-red-500/40'
      }`}
    >
      {deleting
        ? <Loader2 size={12} className="animate-spin" />
        : <Trash2 size={12} />}
      {confirming ? 'Confirm?' : 'Delete'}
    </button>
  )
}
