interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'outline';
  }
  
  export function Button({ children, variant = 'primary' }: ButtonProps) {
    const base = 'px-4 py-2 rounded-md font-semibold text-sm';
    const variants = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      outline: 'border border-blue-500 text-blue-500 hover:bg-blue-100',
    };
  
    return <button className={`${base} ${variants[variant]}`}>{children}</button>;
  }
  