export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          material: string;
          price: number;
          min_order: number;
          status: "aktif" | "tidak_aktif";
          sizes: string[] | null;
          size_prices: Record<string, number> | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          address: string | null;
          tier: "Regular" | "Gold" | "Platinum";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      employees: {
        Row: {
          id: string;
          name: string;
          role: string;
          department: string;
          status: "aktif" | "cuti" | "tidak_aktif";
          phone: string;
          joined_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["employees"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          customer_name: string;
          product: string;
          qty: number;
          total: number;
          status: "baru" | "produksi" | "selesai" | "batal";
          deadline: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      production_tasks: {
        Row: {
          id: string;
          order_id: string;
          order_customer: string;
          order_desc: string;
          stage: "antrian" | "cutting" | "jahit" | "finishing";
          progress: number;
          deadline: string;
          assigned_initials: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["production_tasks"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["production_tasks"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          description: string;
          category: string;
          type: "masuk" | "keluar";
          amount: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
    };
  };
}
