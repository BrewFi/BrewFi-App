// Reusable Button component

export function Button({ children, variant = 'primary', ...props }: any) {
  const styles = {
    primary: 'px-6 py-3 bg-cyber-blue text-black font-bold rounded-lg hover:animate-glow',
    secondary: 'px-6 py-3 border-2 border-cyber-pink text-cyber-pink rounded-lg hover:bg-cyber-pink hover:text-black',
  }
  
  return (
    <button className={styles[variant as keyof typeof styles]} {...props}>
      {children}
    </button>
  )
}

