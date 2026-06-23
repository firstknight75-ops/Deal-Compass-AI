import type { DealStage } from "@/lib/deals.functions";

export interface DealPipelineRow {
  readonly id: string;
  readonly user_id: string;
  readonly name: string;
  readonly company: string | null;
  readonly stage: DealStage;
  readonly value_cents: number;
  readonly currency: string;
  readonly probability: number;
  readonly expected_close_date: string | null;
  readonly owner: string | null;
  readonly notes: string | null;
  readonly ai_health_score: number | null;
  readonly ai_health_explainer_ar: string | null;
  readonly ai_health_scored_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface DealDocumentRow {
  readonly id: string;
  readonly deal_id: string;
  readonly user_id: string;
  readonly bucket_id: string;
  readonly storage_path: string;
  readonly file_name: string;
  readonly mime_type: string;
  readonly file_size_bytes: number;
  readonly title_ar: string | null;
  readonly created_at: string;
  readonly deleted_at: string | null;
}

export interface DealPipelineDatabase {
  public: {
    Tables: {
      deals: {
        Row: DealPipelineRow;
        Insert: Partial<DealPipelineRow> & Pick<DealPipelineRow, "user_id" | "name">;
        Update: Partial<Omit<DealPipelineRow, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      deal_documents: {
        Row: DealDocumentRow;
        Insert: Omit<Partial<DealDocumentRow>, "id" | "created_at" | "deleted_at"> &
          Pick<
            DealDocumentRow,
            "deal_id" | "user_id" | "storage_path" | "file_name" | "mime_type" | "file_size_bytes"
          >;
        Update: Partial<Pick<DealDocumentRow, "deleted_at" | "title_ar">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      deal_stage: DealStage;
    };
    CompositeTypes: Record<string, never>;
  };
}
