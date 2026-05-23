export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string | null
          paid_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          full_name: string | null
          id: string
          is_online: boolean
          is_verified: boolean
          last_location_update: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          full_name?: string | null
          id: string
          is_online?: boolean
          is_verified?: boolean
          last_location_update?: string | null
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          full_name?: string | null
          id?: string
          is_online?: boolean
          is_verified?: boolean
          last_location_update?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          passenger_id: string
          rating: number
          trip_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          passenger_id: string
          rating: number
          trip_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          passenger_id?: string
          rating?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          status: string
          trip_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          status: string
          trip_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          status?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_status_history_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      tariff_config: {
        Row: {
          id: string
          name: string
          base_fare: number
          cost_per_km: number
          cost_per_minute: number
          night_surcharge: number
          vehicle_type_surcharge: number
          valid_from: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          base_fare?: number
          cost_per_km?: number
          cost_per_minute?: number
          night_surcharge?: number
          vehicle_type_surcharge?: number
          valid_from?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          base_fare?: number
          cost_per_km?: number
          cost_per_minute?: number
          night_surcharge?: number
          vehicle_type_surcharge?: number
          valid_from?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          accepted_at: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          channel: string | null
          code: string | null
          completed_at: string | null
          currency: string
          driver_current_latitude: number | null
          driver_current_longitude: number | null
          driver_id: string | null
          driver_location_updated_at: string | null
          dropoff_address: string | null
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_price: number | null
          final_price: number | null
          id: string
          operator_id: string | null
          passenger_id: string
          passenger_name: string | null
          passenger_phone: string | null
          pickup_address: string | null
          pickup_latitude: number
          pickup_longitude: number
          requested_at: string
          service_type: string | null
          started_at: string | null
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          channel?: string | null
          code?: string | null
          completed_at?: string | null
          currency?: string
          driver_current_latitude?: number | null
          driver_current_longitude?: number | null
          driver_id?: string | null
          driver_location_updated_at?: string | null
          dropoff_address?: string | null
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          operator_id?: string | null
          passenger_id: string
          passenger_name?: string | null
          passenger_phone?: string | null
          pickup_address?: string | null
          pickup_latitude: number
          pickup_longitude: number
          requested_at?: string
          service_type?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          channel?: string | null
          code?: string | null
          completed_at?: string | null
          currency?: string
          driver_current_latitude?: number | null
          driver_current_longitude?: number | null
          driver_id?: string | null
          driver_location_updated_at?: string | null
          dropoff_address?: string | null
          dropoff_latitude?: number
          dropoff_longitude?: number
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          operator_id?: string | null
          passenger_id?: string
          passenger_name?: string | null
          passenger_phone?: string | null
          pickup_address?: string | null
          pickup_latitude?: number
          pickup_longitude?: number
          requested_at?: string
          service_type?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          code: string | null
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          license_plate: string
          model: string
          owner_id: string
          seats: number
          updated_at: string
          vehicle_type: string | null
          year: number
        }
        Insert: {
          brand: string
          code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          license_plate: string
          model: string
          owner_id: string
          seats?: number
          updated_at?: string
          vehicle_type?: string | null
          year: number
        }
        Update: {
          brand?: string
          code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          license_plate?: string
          model?: string
          owner_id?: string
          seats?: number
          updated_at?: string
          vehicle_type?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_drivers: {
        Args: { lat: number; lng: number; radius_km?: number }
        Returns: {
          avatar_url: string
          current_latitude: number
          current_longitude: number
          distance_km: number
          full_name: string
          id: string
          vehicle_brand: string
          vehicle_color: string
          vehicle_id: string
          vehicle_model: string
          vehicle_seats: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
