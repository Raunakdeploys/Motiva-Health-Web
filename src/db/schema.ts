import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().default(''),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const papers = pgTable('papers', {
  id: text('id').notNull(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  journal: text('journal'),
  authors: text('authors'),
  year: integer('year'),
  doi: text('doi'),
  sourceUrl: text('source_url'),
  fileSizeBytes: integer('file_size_bytes').notNull().default(0),
  totalPages: integer('total_pages').notNull().default(0),
  extractionWarnings: jsonb('extraction_warnings').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  hasUnreadablePages: boolean('has_unreadable_pages').notNull().default(false),
  isSyntheticDemo: boolean('is_synthetic_demo').notNull().default(false),
  metadataVerified: boolean('metadata_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.userId, table.id] }),
}));

export const evidencePassages = pgTable('evidence_passages', {
  id: text('id').notNull(),
  paperId: text('paper_id').notNull(),
  userId: text('user_id').notNull(),
  pdfPageIndex: integer('pdf_page_index').notNull(),
  section: text('section'),
  verbatimText: text('verbatim_text').notNull(),
  charStart: integer('char_start'),
  charEnd: integer('char_end'),
  hasFigureOrTable: boolean('has_figure_or_table').notNull().default(false),
  warning: text('warning'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.userId, table.id] }),
  userPaperIndex: index('evidence_passages_user_paper_idx').on(table.userId, table.paperId),
}));

export const claims = pgTable('claims', {
  id: text('id').notNull(),
  paperId: text('paper_id').notNull(),
  userId: text('user_id').notNull(),
  claimText: text('claim_text').notNull(),
  evidenceIds: text('evidence_ids').notNull().default('[]'),
  exactSupportingQuote: text('exact_supporting_quote'),
  population: text('population'),
  studyDesign: text('study_design'),
  interventionOrExposure: text('intervention_or_exposure'),
  comparison: text('comparison'),
  outcome: text('outcome'),
  numbersAndUnits: text('numbers_and_units'),
  limitations: text('limitations'),
  certaintyNotes: text('certainty_notes'),
  riskFlags: text('risk_flags').notNull().default('[]'),
  reviewStatus: text('review_status').notNull().default('DRAFT'),
  reviewerNote: text('reviewer_note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.userId, table.id] }),
  userPaperIndex: index('claims_user_paper_idx').on(table.userId, table.paperId),
}));

export const deliverables = pgTable('deliverables', {
  id: text('id').notNull(),
  paperId: text('paper_id').notNull(),
  userId: text('user_id').notNull(),
  deliverableType: text('deliverable_type').notNull(),
  payload: text('payload').notNull(),
  status: text('status').notNull().default('READY'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.userId, table.id] }),
  userPaperIndex: index('deliverables_user_paper_idx').on(table.userId, table.paperId),
}));

export const scheduledPosts = pgTable('scheduled_posts', {
  id: text('id').notNull(),
  userId: text('user_id').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.userId, table.id] }),
}));

export const auditLogs = pgTable('audit_logs', {
  id: text('id').notNull(),
  userId: text('user_id').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.userId, table.id] }),
  userCreatedIndex: index('audit_logs_user_created_idx').on(table.userId, table.createdAt.desc()),
}));
