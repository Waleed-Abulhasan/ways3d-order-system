import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoImage from '@/components/LogoImage'
import DeleteOrderButton from '@/components/DeleteOrderButton'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { Package, LogOut, Plus, Phone, Mail, Truck, Store, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin')

  const { status, q } = searchParams

  const orders = await db.order.findMany({
    where: {
      ...(status && status !== 'all' ? { status } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { refNumber: { contains: q } },
              { orgName: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  const counts = await db.order.groupBy({
    by: ['status'],
    _count: true,
  })
  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count]))
  const total = await db.order.count()

  const FILTERS = ['all', 'new', 'reviewing', 'in_production', 'ready', 'delivered', 'cancelled']

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-56 bg-brand-surface border-r border-brand-border flex flex-col z-10">
        <div className="px-5 py-6 border-b border-brand-border">
          <LogoImage className="object-contain h-9 w-auto" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="sidebar-link active">
            <Package size={16} />
            Orders
            <span className="ms-auto bg-brand-accent/20 text-brand-accent text-xs font-bold px-2 py-0.5 rounded-full">{total}</span>
          </div>
        </nav>
        <div className="px-3 py-4 border-t border-brand-border">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="sidebar-link w-full">
              <LogOut size={15} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Orders</h1>
            <p className="text-brand-text-secondary text-sm mt-0.5">{total} total orders</p>
          </div>
          <a
            href="/"
            target="_blank"
            className="btn-secondary text-sm gap-2"
          >
            <Plus size={14} />
            Order Form
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form method="GET" className="flex-1 min-w-[200px] max-w-sm">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, ref..."
              className="field-input text-sm py-2.5"
            />
          </form>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <Link
                key={f}
                href={`/admin/dashboard?status=${f}${q ? `&q=${q}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  (status === f) || (!status && f === 'all')
                    ? 'bg-brand-accent border-brand-accent text-white'
                    : 'border-brand-border text-brand-text-secondary hover:text-white hover:border-zinc-500 bg-brand-elevated'
                }`}
              >
                {STATUS_LABELS[f] || 'All'}
                {f !== 'all' && countMap[f] ? ` (${countMap[f]})` : f === 'all' ? ` (${total})` : ''}
              </Link>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="text-center py-20 text-brand-muted">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => {
              const fileUrls: string[] = JSON.parse(order.fileUrls || '[]')
              return (
                <div key={order.id} className="relative flex items-stretch gap-2">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex-1 block bg-brand-surface border border-brand-border rounded-2xl px-5 py-4 hover:border-zinc-600 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="text-white font-semibold group-hover:text-brand-accent transition-colors">
                          {order.firstName} {order.lastName}
                          {order.orgName && <span className="text-brand-text-secondary font-normal"> · {order.orgName}</span>}
                        </span>
                        <span className={`status-badge ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        {order.wantMeeting && (
                          <span className="status-badge bg-purple-500/15 text-purple-400 border-purple-500/30">
                            📅 Meeting
                          </span>
                        )}
                      </div>
                      <p className="text-brand-text-secondary text-sm truncate max-w-xl">{order.orderDesc}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted flex-wrap">
                        <span className="font-mono text-brand-accent">{order.refNumber}</span>
                        <span className="flex items-center gap-1"><Mail size={11} />{order.email}</span>
                        <span className="flex items-center gap-1"><Phone size={11} />{order.phone}</span>
                        <span className="flex items-center gap-1">
                          {order.deliveryType === 'delivery' ? <Truck size={11} /> : <Store size={11} />}
                          {order.city}
                        </span>
                        {fileUrls.length > 0 && <span className="text-brand-accent">📎 {fileUrls.length} file{fileUrls.length > 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <div className="text-right text-xs text-brand-muted flex-shrink-0">
                      <p>{formatDate(order.createdAt)}</p>
                      <p className="mt-1">{order.preferredDate}</p>
                    </div>
                  </div>
                </Link>
                <DeleteOrderButton id={order.id} />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
