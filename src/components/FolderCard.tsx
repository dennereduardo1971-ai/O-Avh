import { Link } from 'react-router-dom'

interface FolderCardProps {
  to: string
  icon: string
  title: string
  description: string
  accent: string
}

export default function FolderCard({ to, icon, title, description, accent }: FolderCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-white bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${accent}`}
        aria-hidden
      >
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-slate-800 group-hover:text-rose-600">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  )
}
