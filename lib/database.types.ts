export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      concerts: {
        Row: {
          artist: string;
          city: string;
          concert_date: string;
          concert_name: string;
          created_at: string;
          distance_from_home: number | null;
          food_drink_cost: number;
          fun_rating: number;
          hours_at_event: number;
          id: string;
          lodging_cost: number;
          merchandise_cost: number;
          notes: string | null;
          other_cost: number;
          parking_cost: number;
          state: string;
          ticket_cost: number;
          ticket_fees: number;
          travel_cost: number;
          user_id: string;
          venue: string;
          venue_latitude: number | null;
          venue_longitude: number | null;
        };
        Insert: {
          artist: string;
          city: string;
          concert_date: string;
          concert_name: string;
          created_at?: string;
          distance_from_home?: number | null;
          food_drink_cost?: number;
          fun_rating: number;
          hours_at_event: number;
          id?: string;
          lodging_cost?: number;
          merchandise_cost?: number;
          notes?: string | null;
          other_cost?: number;
          parking_cost?: number;
          state: string;
          ticket_cost?: number;
          ticket_fees?: number;
          travel_cost?: number;
          user_id: string;
          venue: string;
          venue_latitude?: number | null;
          venue_longitude?: number | null;
        };
        Update: {
          artist?: string;
          city?: string;
          concert_date?: string;
          concert_name?: string;
          created_at?: string;
          distance_from_home?: number | null;
          food_drink_cost?: number;
          fun_rating?: number;
          hours_at_event?: number;
          id?: string;
          lodging_cost?: number;
          merchandise_cost?: number;
          notes?: string | null;
          other_cost?: number;
          parking_cost?: number;
          state?: string;
          ticket_cost?: number;
          ticket_fees?: number;
          travel_cost?: number;
          user_id?: string;
          venue?: string;
          venue_latitude?: number | null;
          venue_longitude?: number | null;
        };
        Relationships: [];
      };
      spotify_connections: {
        Row: {
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope: string | null;
          spotify_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope?: string | null;
          spotify_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          scope?: string | null;
          spotify_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      liked_concerts: {
        Row: {
          id: string;
          user_id: string;
          external_event_id: string;
          source: string;
          name: string;
          artist: string | null;
          venue: string;
          city: string;
          state: string;
          event_date: string;
          event_time: string | null;
          distance_miles: number | null;
          ticket_url: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          external_event_id: string;
          source?: string;
          name: string;
          artist?: string | null;
          venue: string;
          city?: string;
          state?: string;
          event_date: string;
          event_time?: string | null;
          distance_miles?: number | null;
          ticket_url?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          external_event_id?: string;
          source?: string;
          name?: string;
          artist?: string | null;
          venue?: string;
          city?: string;
          state?: string;
          event_date?: string;
          event_time?: string | null;
          distance_miles?: number | null;
          ticket_url?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Concert = Database["public"]["Tables"]["concerts"]["Row"];
export type ConcertInsert = Database["public"]["Tables"]["concerts"]["Insert"];
export type LikedConcert = Database["public"]["Tables"]["liked_concerts"]["Row"];
