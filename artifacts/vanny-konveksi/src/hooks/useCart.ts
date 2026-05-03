import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem } from "@/pages/portal/types";

const LS_KEY = "vanny-cart";

function readLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}

export function useCart(userId: string | null | undefined) {
  const [cartItems, setCartItemsState] = useState<CartItem[]>(readLocalCart);
  const [synced, setSynced] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useSupabase = useRef(false);

  // Load cart from Supabase on login
  useEffect(() => {
    if (!userId) {
      setSynced(false);
      useSupabase.current = false;
      return;
    }

    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("cart")
        .eq("id", userId)
        .single();

      if (!error && data && "cart" in data && Array.isArray(data.cart)) {
        useSupabase.current = true;
        const remoteCart = data.cart as CartItem[];
        // Merge: if local has items and remote is empty, push local to remote
        const localCart = readLocalCart();
        if (remoteCart.length === 0 && localCart.length > 0) {
          setCartItemsState(localCart);
          // save local → supabase
          await supabase
            .from("profiles")
            .update({ cart: localCart } as never)
            .eq("id", userId);
          writeLocalCart([]);
        } else {
          setCartItemsState(remoteCart);
          writeLocalCart([]);
        }
      } else {
        // Column doesn't exist yet — fall back to localStorage
        useSupabase.current = false;
      }
      setSynced(true);
    };

    load();
  }, [userId]);

  const saveToSupabase = useCallback(
    (items: CartItem[]) => {
      if (!userId || !useSupabase.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await supabase
          .from("profiles")
          .update({ cart: items } as never)
          .eq("id", userId);
      }, 600);
    },
    [userId]
  );

  const setCartItems = useCallback(
    (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
      setCartItemsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (useSupabase.current) {
          saveToSupabase(next);
        } else {
          writeLocalCart(next);
        }
        return next;
      });
    },
    [saveToSupabase]
  );

  // Clear localStorage after successful Supabase login
  useEffect(() => {
    if (synced && useSupabase.current) {
      writeLocalCart([]);
    }
  }, [synced]);

  return { cartItems, setCartItems, synced };
}
