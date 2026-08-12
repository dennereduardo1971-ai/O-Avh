import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface FolderCardProps {
  to: string
  icon: string
  title: string
  description: string
  accent: string
}

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
}

export default function FolderCard({ to, icon, title, description, accent }: FolderCardProps) {
  return (
    <motion.div variants={item}>
      <Link to={to} className="group block">
        <motion.div
          whileHover={{ y: -4, rotate: -0.6, boxShadow: '0 12px 24px -8px rgba(244,63,94,0.25)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col gap-3 rounded-2xl border border-white bg-white/80 p-5 shadow-sm"
        >
          <motion.span
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${accent}`}
            whileHover={{ scale: 1.15, rotate: 10 }}
            aria-hidden
          >
            {icon}
          </motion.span>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-rose-600">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
