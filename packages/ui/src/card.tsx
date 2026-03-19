interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  )
}
