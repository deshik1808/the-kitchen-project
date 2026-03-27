"use client";

import { useStore } from '../lib/StoreContext';
import Toast from './Toast';

export default function ToastManager() {
  const { toast } = useStore();
  
  if (!toast?.visible) return null;

  return (
    <Toast 
      message={toast.message} 
      type={toast.type} 
    />
  );
}
