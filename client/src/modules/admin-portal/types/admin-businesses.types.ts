export type BusinessPublicationStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended" | string;
export interface AdminBusinessSummary { totalBusinesses: number; pendingReview: number; approved: number; rejected: number; suspended: number }
export interface AdminBusinessRow {
  id: string; memberId: string; name: string; slug: string; status: string; publicationStatus: BusinessPublicationStatus; address: string | null; createdAt: string;
  owner: { id: string; name: string; email: string }; categories: Array<{ id: string; name: string }>;
}
export interface AdminBusinessPage { summary: AdminBusinessSummary; rows: AdminBusinessRow[]; total: number; page: number; pageSize: number }
export interface AdminBusinessDetail extends AdminBusinessRow {
  description: string | null; websiteUrl: string | null; email: string | null; phone: string | null;
  media: Array<{ id: string; mediaType: string; caption: string | null; sortOrder: number }>;
  reviews: Array<{ id: string; status: string; reason: string | null; reviewedAt: string; reviewerName: string }>;
}
export interface AdminBusinessCategory { id: string; name: string }
export interface AdminBusinessOwner { id: string; name: string; email: string }
