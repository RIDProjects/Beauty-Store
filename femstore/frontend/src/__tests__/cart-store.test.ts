import { useCartStore } from '@/store/cart.store';
import { Product } from '@/types';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset cart before each test
    useCartStore.getState().clearCart();
  });

  const mockProduct: Product = {
    id: 'test-1',
    name: 'Test Product',
    slug: 'test-product',
    price: 29.99,
    description: 'Test description',
    stock: 10,
    is_on_sale: false,
    is_active: true,
    primary_image: 'test-image.jpg',
    created_at: '2026-01-01T00:00:00Z',
  };

  it('should add item to cart', () => {
    const { addItem, getTotalItems } = useCartStore.getState();
    
    addItem(mockProduct);
    
    expect(getTotalItems()).toBe(1);
  });

  it('should increase quantity when adding existing item', () => {
    const { addItem, getTotalItems } = useCartStore.getState();
    
    addItem(mockProduct);
    addItem(mockProduct);
    
    expect(getTotalItems()).toBe(2);
  });

  it('should remove item from cart', () => {
    const { addItem, removeItem, getTotalItems } = useCartStore.getState();
    
    addItem(mockProduct);
    expect(getTotalItems()).toBe(1);
    
    removeItem(mockProduct.id);
    expect(getTotalItems()).toBe(0);
  });

  it('should calculate total price correctly', () => {
    const { addItem, getTotalPrice } = useCartStore.getState();
    
    addItem(mockProduct);
    addItem(mockProduct);
    
    expect(getTotalPrice()).toBe(59.98);
  });

  it('should clear cart', () => {
    const { addItem, clearCart, getTotalItems, getTotalPrice } = useCartStore.getState();
    
    addItem(mockProduct);
    clearCart();
    
    expect(getTotalItems()).toBe(0);
    expect(getTotalPrice()).toBe(0);
  });
});