/**
 * Database types matching the Supabase schema.
 * These mirror the tables defined in schema.sql.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string;
          name?: string | null;
        };
        Update: {
          name?: string | null;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          latitude: number;
          longitude: number;
          formatted_address: string;
          city: string | null;
          district: string | null;
          street: string | null;
          building: string | null;
          delivery_notes: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          latitude: number;
          longitude: number;
          formatted_address: string;
          city?: string | null;
          district?: string | null;
          street?: string | null;
          building?: string | null;
          delivery_notes?: string | null;
          is_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          status: OrderStatus;
          subtotal: number;
          delivery_fee: number;
          total: number;
          fulfillment: "delivery" | "pickup";
          latitude: number | null;
          longitude: number | null;
          formatted_address: string | null;
          phone: string;
          customer_name: string | null;
          notes: string | null;
          payment_method: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          user_id: string;
          status?: OrderStatus;
          subtotal: number;
          delivery_fee?: number;
          total: number;
          fulfillment: "delivery" | "pickup";
          latitude?: number | null;
          longitude?: number | null;
          formatted_address?: string | null;
          phone: string;
          customer_name?: string | null;
          notes?: string | null;
          payment_method?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
    };
  };
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
