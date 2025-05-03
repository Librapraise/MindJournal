interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline';
  className?: string;
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', className = '', onClick }: ButtonProps) {
  const base = 'px-3 py-2 rounded-md font-semibold text-[12px] md:px-4 md:py-2 md:text-sm transition-colors duration-200';
  
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer',
    outline: 'border border-blue-500 text-blue-500 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-white cursor-pointer',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`}>
      {onClick && <span onClick={onClick} className="cursor-pointer">{children}</span>}
      {!onClick &&
        <span className="cursor-pointer">{children}</span>
      }
    </button>
  );
}