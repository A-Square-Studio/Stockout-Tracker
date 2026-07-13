import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './PasswordInput.module.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  required?: boolean;
}

export default function PasswordInput({ value, onChange, placeholder, className, autoComplete, required }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.wrap}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${styles.input} ${className ?? ''}`}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}
