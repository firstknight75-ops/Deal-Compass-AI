export const SPECIAL_OPPORTUNITY_TYPES = [
  "sell_listing",
  "buy_request",
  "service_offer",
  "machinery_listing",
  "wholesale_lot",
  "import_request",
  "export_request",
  "verified_tender",
] as const;

export const SPECIAL_OPPORTUNITY_STATUSES = [
  "draft",
  "published",
  "negotiating",
  "active",
  "completed",
  "archived",
] as const;

export type SpecialOpportunityType = (typeof SPECIAL_OPPORTUNITY_TYPES)[number];
export type SpecialOpportunityStatus = (typeof SPECIAL_OPPORTUNITY_STATUSES)[number];

export interface TradeCategoryRow {
  readonly id: string;
  readonly slug: string;
  readonly name_ar: string;
  readonly name_en: string | null;
  readonly description_ar: string | null;
  readonly icon: string | null;
  readonly sort_order: number;
}

export interface GeneralOpportunityRow {
  readonly id: string;
  readonly title: string;
  readonly title_ar: string | null;
  readonly description: string | null;
  readonly summary_ar: string | null;
  readonly detected_language: string;
  readonly country: string | null;
  readonly city: string | null;
  readonly category_id: string | null;
  readonly source_name: string;
  readonly source_url: string | null;
  readonly confidence_score: number;
  readonly risk_score: number;
  readonly ai_explainer_ar: string | null;
  readonly published_at: string | null;
  readonly expires_at: string | null;
}

export interface SpecialOpportunityRow {
  readonly id: string;
  readonly owner_user_id: string;
  readonly organization_id: string | null;
  readonly type: SpecialOpportunityType;
  readonly status: SpecialOpportunityStatus;
  readonly title_ar: string;
  readonly title_en: string | null;
  readonly description_ar: string;
  readonly description_en: string | null;
  readonly category_id: string | null;
  readonly country: string | null;
  readonly city: string | null;
  readonly price_amount: number | null;
  readonly currency: string;
  readonly quantity: number | null;
  readonly unit: string | null;
  readonly incoterm: string | null;
  readonly ai_score: number | null;
  readonly ai_explainer_ar: string | null;
  readonly published_at: string | null;
  readonly archived_at: string | null;
  readonly deleted_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type OpportunityKind = "general" | "special";
export type ActivityType =
  | "created"
  | "updated"
  | "stage_changed"
  | "commented"
  | "published"
  | "archived"
  | "document_uploaded"
  | "ai_score_updated";

export interface OpportunityActivityRow {
  readonly id: string;
  readonly opportunity_kind: OpportunityKind;
  readonly general_opportunity_id: string | null;
  readonly special_opportunity_id: string | null;
  readonly actor_user_id: string | null;
  readonly activity_type: ActivityType;
  readonly body_ar: string | null;
  readonly metadata: Record<string, unknown>;
  readonly created_at: string;
}

export interface OpportunityDocumentRow {
  readonly id: string;
  readonly opportunity_kind: OpportunityKind;
  readonly general_opportunity_id: string | null;
  readonly special_opportunity_id: string | null;
  readonly uploaded_by: string | null;
  readonly bucket_id: string;
  readonly storage_path: string;
  readonly file_name: string;
  readonly mime_type: string;
  readonly file_size_bytes: number;
  readonly document_type: string;
  readonly title_ar: string | null;
  readonly created_at: string;
  readonly deleted_at: string | null;
}

export interface CompanyRow {
  readonly id: string;
  readonly name: string;
  readonly name_ar: string | null;
  readonly country: string | null;
  readonly city: string | null;
  readonly website_url: string | null;
  readonly industry: string | null;
  readonly description_ar: string | null;
  readonly trust_score: number;
  readonly risk_score: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface RecommendationRow {
  readonly id: string;
  readonly target_kind: "general_opportunity" | "special_opportunity" | "company";
  readonly general_opportunity_id: string | null;
  readonly special_opportunity_id: string | null;
  readonly company_id: string | null;
  readonly score: number;
  readonly reason_ar: string;
  readonly recommendation_type: string;
  readonly created_at: string;
}

export interface MarketplaceDatabase {
  public: {
    Tables: {
      trade_categories: {
        Row: TradeCategoryRow;
        Insert: Partial<TradeCategoryRow> & Pick<TradeCategoryRow, "slug" | "name_ar">;
        Update: Partial<TradeCategoryRow>;
        Relationships: [];
      };
      general_opportunities: {
        Row: GeneralOpportunityRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      special_opportunities: {
        Row: SpecialOpportunityRow;
        Insert: Omit<Partial<SpecialOpportunityRow>, "id" | "created_at" | "updated_at"> &
          Pick<SpecialOpportunityRow, "owner_user_id" | "type" | "title_ar" | "description_ar">;
        Update: Partial<
          Omit<SpecialOpportunityRow, "id" | "owner_user_id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      saved_general_opportunities: {
        Row: {
          readonly user_id: string;
          readonly opportunity_id: string;
          readonly created_at: string;
        };
        Insert: { readonly user_id: string; readonly opportunity_id: string };
        Update: never;
        Relationships: [];
      };
      favorite_special_opportunities: {
        Row: {
          readonly user_id: string;
          readonly opportunity_id: string;
          readonly created_at: string;
        };
        Insert: { readonly user_id: string; readonly opportunity_id: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      special_opportunity_type: SpecialOpportunityType;
      special_opportunity_status: SpecialOpportunityStatus;
      opportunity_kind: OpportunityKind;
      activity_type: ActivityType;
    };
    CompositeTypes: Record<string, never>;
  };
}
