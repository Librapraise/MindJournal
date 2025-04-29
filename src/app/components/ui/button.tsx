interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'outline';
  }
  
  export function Button({ children, variant = 'primary' }: ButtonProps) {
    const base = 'px-2 py-1 rounded-md font-semibold text-[10px] md:px-4 md:py-2 md:text-sm';
    const variants = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer',
      outline: 'border border-blue-500 text-blue-500 hover:bg-blue-100 cursor-pointer',
    };
  
    return <button className={`${base} ${variants[variant]}`}>{children}</button>;
  }
  