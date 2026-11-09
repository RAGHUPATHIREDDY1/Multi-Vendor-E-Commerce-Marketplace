import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

export async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug price images inventory status vendor',
  }).lean();

  const items = (cart?.items || [])
    .filter((item) => item.product)
    .map(({ product, quantity }) => ({
      product,
      quantity,
      lineTotal: Math.round(product.price * 100) * quantity,
    }));

  return {
    items,
    subtotalMinor: items.reduce((total, item) => total + item.lineTotal, 0),
  };
}

export async function addCartItem(userId, productId, quantity) {
  const product = await Product.findOne({ _id: productId, status: 'active' }).select('_id inventory');
  if (!product) throw new AppError('That product is not available.', 404);

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }
  const existing = cart.items.find((item) => item.product.equals(product._id));
  const requestedQuantity = (existing?.quantity || 0) + quantity;
  if (requestedQuantity > product.inventory) {
    throw new AppError('There is not enough stock for that quantity.', 409);
  }
  if (existing) existing.quantity = requestedQuantity;
  else cart.items.push({ product: product._id, quantity });
  await cart.save();
  return getCart(userId);
}

export async function setCartItemQuantity(userId, productId, quantity) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError('Your cart is empty.', 404);
  const item = cart.items.find((line) => line.product.equals(productId));
  if (!item) throw new AppError('That item is not in your cart.', 404);

  const product = await Product.findOne({ _id: productId, status: 'active' }).select('inventory');
  if (!product || quantity > product.inventory) {
    throw new AppError('There is not enough stock for that quantity.', 409);
  }

  item.quantity = quantity;
  await cart.save();
  return getCart(userId);
}

export async function removeCartItem(userId, productId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return getCart(userId);
  cart.items = cart.items.filter((item) => !item.product.equals(productId));
  await cart.save();
  return getCart(userId);
}
