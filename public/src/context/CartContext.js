import React, { createContext, useContext, useReducer, useEffect } from "react";

const CartContext = createContext(null);

const LS_KEY = "freshroots_cart";

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find(i => i.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.product.id
              ? { ...i, qty: i.qty + action.qty }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.product, qty: action.qty }] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case "UPDATE_QTY":
      if (action.qty < 1) return { ...state, items: state.items.filter(i => i.id !== action.id) };
      return {
        ...state,
        items: state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i),
      };
    case "CLEAR":
      return { ...state, items: [] };
    case "TOGGLE_OPEN":
      return { ...state, isOpen: !state.isOpen };
    case "CLOSE":
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: loadCart(),
    isOpen: false,
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ ...state, dispatch, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
