import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import type { Profile, Address, Order } from "../lib/database.types";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  addresses: Address[];
  orders: Order[];
  loading: boolean;
  isConfigured: boolean;

  // Auth
  register: (name: string, phone: string) => Promise<{ error: string | null }>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | null>(null);

  // Initialize session
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

    return () => subscription.unsubscribe();
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (!user || !supabaseConfigured) {
      setProfile(null);
      setAddresses([]);
      setOrders([]);
      return;
    }

    loadProfile();
    loadAddresses();
    loadOrders();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data as Profile);
  };

  const loadAddresses = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setAddresses(data as Address[]);
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setOrders(data as Order[]);
  }, [user]);

  // ============================================================
  // تسجيل تجريبي بدون SMS / OTP
  // ============================================================
  const register = async (
    name: string,
    phone: string
  ): Promise<{ error: string | null }> => {
    if (!supabaseConfigured) {
      return { error: "النظام غير مُهيّأ حالياً" };
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      return { error: "اكتب اسمك عيوني" };
    }

    if (!cleanPhone) {
      return { error: "اكتب رقم هاتفك" };
    }

    try {
      // إذا كان الزبون عنده جلسة مسبقًا، لا ننشئ مستخدمًا جديدًا
      let currentUser = user;

      // إنشاء مستخدم مجهول لأول مرة
      if (!currentUser) {
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          return { error: error.message };
        }

        currentUser = data.user;

        if (!currentUser) {
          return { error: "تعذر إنشاء حساب الزبون" };
        }
      }

      // تحديث بيانات profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({
          name: cleanName,
          phone: cleanPhone,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", currentUser.id)
        .select()
        .single();

      if (profileError) {
        return { error: profileError.message };
      }

      setUser(currentUser);
      setProfile(updatedProfile as Profile);

      return { error: null };
    } catch {
      return { error: "صار خطأ أثناء التسجيل، حاول مرة ثانية" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
    setProfile(null);
    setAddresses([]);
    setOrders([]);
  };

  const updateName = async (name: string) => {
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ name } as never)
      .eq("id", user.id);

    setProfile((p) => (p ? { ...p, name } : p));
  };

  const saveAddress = async (
    addr: Omit<Address, "id" | "user_id" | "created_at">
  ): Promise<Address | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("addresses")
      .insert({ ...addr, user_id: user.id } as never)
      .select()
      .single();

    if (error || !data) return null;

    const newAddr = data as Address;

    setAddresses((prev) => [newAddr, ...prev]);

    return newAddr;
  };

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

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
