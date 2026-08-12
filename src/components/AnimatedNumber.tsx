import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  formatter?: (n: number) => string
  className?: string
}

export default function AnimatedNumber({
  value,
  formatter = (n) => Math.round(n).toString(),
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(value)
  const display = useTransform(motionValue, (v) => formatter(v))

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: 'easeOut' })
    return controls.stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <motion.span className={className}>{display}</motion.span>
}
