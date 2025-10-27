// Reusable Card component with cyberpunk styling

export function Card({ children, className = '', ...props }: any) {
  return (
    <div className={`cyber-card p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

