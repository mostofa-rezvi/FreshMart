import { useContext } from 'react';
import { CartContext } from '../context/CartContext'; // Import the context itself

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};