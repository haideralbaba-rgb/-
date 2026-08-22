import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase, supabaseConfigured } from "../lib/supabase";
import type { Profile, Address, Order } from "../lib/database.types";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;

  // Customer data
  profile: Profile | null;

  addresses: Address[];
  orders: Order[];

  loading: boolean;
  isConfigured: boolean;

  // Auth
  register: (
    name: string,
    phone: string
  ) => Promise<{ error: string | null }>;

  signOut: () => Promise<void>;

  // Profile
  updateName: (name: string) => Promise<void>;

  // Addresses
  saveAddress: (
    addr: Omit<Address, "id" | "user_id" | "created_at">
  ) => Promise<Address | null>;

  loadAddresses: () => Promise<void>;

  // Orders
  loadOrders: () => Promise<void>;

  // Login modal
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;

  loginRedirectTo: string | null;
  setLoginRedirectTo: (v: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [showLogin, setShowLogin] = useState(false);

  const [loginRedirectTo, setLoginRedirectTo] =
    useState<string | null>(null);

  // ============================================================
  // INITIALIZE SESSION
  // ============================================================

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // LOAD CUSTOMER DATA WHEN USER CHANGES
  // ============================================================

  useEffect(() => {
    if (!user || !supabaseConfigured) {
      setProfile(null);
      setAddresses([]);
      setOrders([]);
      return;
    }

    loadCustomer();
    loadAddresses();
    loadOrders();
  }, [user]);

  // ============================================================
  // LOAD CUSTOMER FROM customers TABLE
  // ============================================================

  const loadCustomer = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  // ============================================================
  // REGISTER
  // NAME + PHONE
  // NO SMS
  // NO OTP
  // ============================================================

  const register = async (
    name: string,
    phone: string
  ): Promise<{ error: string | null }> => {
    if (!supabaseConfigured) {
      return {
        error: "النظام غير مُهيّأ حالياً",
      };
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      return {
        error: "اكتب اسمك عيوني",
      };
    }

    if (cleanPhone.length < 10) {
      return {
        error: "لازم تدخل رقم هاتف صحيح",
      };
    }

    try {
      // --------------------------------------------------------
      // 1. Get current user/session
      // --------------------------------------------------------

      let currentUser = user;

      // --------------------------------------------------------
      // 2. Create anonymous user if there is no session
      // --------------------------------------------------------

      if (!currentUser) {
        const {
          data,
          error,
        } = await supabase.auth.signInAnonymously();

        if (error) {
          return {
            error: error.message,
          };
        }

        currentUser = data.user;

        if (!currentUser) {
          return {
            error: "تعذر إنشاء حساب الزبون",
          };
        }
      }

      // --------------------------------------------------------
      // 3. Save customer
      // --------------------------------------------------------

      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from("customers")
        .upsert(
          {
            id: currentUser.id,
            name: cleanName,
            phone: cleanPhone,
          },
          {
            onConflict: "id",
          }
        )
        .select()
        .single();

      if (customerError) {
        return {
          error: customerError.message,
        };
      }

      // --------------------------------------------------------
      // 4. Update local state
      // --------------------------------------------------------

      setUser(currentUser);

      setProfile(customer as Profile);

      return {
        error: null,
      };
    } catch (error) {
      console.error("Customer registration error:", error);

      return {
        error: "صار خطأ أثناء التسجيل، حاول مرة ثانية",
      };
    }
  };

  // ============================================================
  // SIGN OUT
  // ============================================================

  const signOut = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
    setProfile(null);
    setAddresses([]);
    setOrders([]);
  };

  // ============================================================
  // UPDATE CUSTOMER NAME
  // ============================================================

  const updateName = async (name: string) => {
    if (!user) return;

    const cleanName = name.trim();

    if (!cleanName) return;

    const { error } = await supabase
      .from("customers")
      .update({
        name: cleanName,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Update customer name error:", error);
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            name: cleanName,
          }
        : current
    );
  };

  // ============================================================
  // ADDRESSES
  // ============================================================

  const loadAddresses = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setAddresses(data as Address[]);
    }
  }, [user]);

  const saveAddress = async (
    addr: Omit<Address, "id" | "user_id" | "created_at">
  ): Promise<Address | null> => {
    if (!user) return null;

    const {
      data,
      error,
    } = await supabase
      .from("addresses")
      .insert({
        ...addr,
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Save address error:", error);
      return null;
    }

    const newAddress = data as Address;

    setAddresses((previous) => [
      newAddress,
      ...previous,
    ]);

    return newAddress;
  };

  // ============================================================
  // ORDERS
  // ============================================================

  const loadOrders = useCallback(async () => {
    if (!user) return;

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setOrders(data as Order[]);
    }
  }, [user]);

  // ============================================================
  // PROVIDER
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        session,

        profile,

        addresses,
        orders,

        loading,
        isConfigured: supabaseConfigured,

        register,
        signOut,

        updateName,

        saveAddress,
        loadAddresses,

        loadOrders,

        showLogin,
        setShowLogin,

        loginRedirectTo,
        setLoginRedirectTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// USE AUTH
// ============================================================

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}
