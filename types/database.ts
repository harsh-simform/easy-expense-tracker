// Hand-written DB types. Replace with `supabase gen types typescript --linked` output once linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          color: string | null;
          keywords: string[];
          is_default: boolean;
          archived: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          keywords?: string[];
          is_default?: boolean;
          archived?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          keywords?: string[];
          is_default?: boolean;
          archived?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          amount: number;
          description: string | null;
          category_id: string | null;
          occurred_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          amount: number;
          description?: string | null;
          category_id?: string | null;
          occurred_on?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          amount?: number;
          description?: string | null;
          category_id?: string | null;
          occurred_on?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          category_id: string;
          monthly_limit: number;
          effective_from: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          monthly_limit: number;
          effective_from?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          monthly_limit?: number;
          effective_from?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      people: {
        Row: {
          id: string;
          owner_email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_email?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_email?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      transaction_splits: {
        Row: {
          id: string;
          transaction_id: string;
          person_id: string;
          amount: number;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          person_id: string;
          amount: number;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          person_id?: string;
          amount?: number;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_splits_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type Person = Database["public"]["Tables"]["people"]["Row"];
export type TransactionSplit =
  Database["public"]["Tables"]["transaction_splits"]["Row"];

export type SplitWithPerson = TransactionSplit & {
  person: Pick<Person, "id" | "name"> | null;
};

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
  splits?: SplitWithPerson[];
};
