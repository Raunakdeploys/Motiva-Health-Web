import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { auditLogs, claims, deliverables, evidencePassages, papers, scheduledPosts } from './schema.ts';
import type {
  CarouselContent,
  ClaimRecord,
  EvidencePassage,
  PaperRecord,
  ReelContent,
  ScheduledPost,
  StaticPostContent,
} from '../types/index.ts';
import type { AuditLogEntry } from '../utils/storage.ts';

function parseStringArray(value: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function toIsoString(value: Date | null | undefined): string {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

async function assertOwnedPaper(userId: string, paperId: string): Promise<void> {
  const [paper] = await db.select({ id: papers.id }).from(papers).where(and(
    eq(papers.userId, userId),
    eq(papers.id, paperId),
  )).limit(1);
  if (!paper) throw new Error('Paper does not belong to this account.');
}

export async function getUserPapers(userId: string): Promise<PaperRecord[]> {
  const rows = await db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.createdAt));
  return rows.map((row) => ({
    paper_id: row.id,
    title: row.title,
    journal: row.journal || '',
    authors: row.authors || '',
    year: row.year === null ? '' : String(row.year),
    doi: row.doi || '',
    is_metadata_verified: row.metadataVerified,
    filename: row.sourceUrl || '',
    filesize_bytes: row.fileSizeBytes,
    uploaded_at: toIsoString(row.createdAt),
    total_pages: row.totalPages,
    is_demo: row.isSyntheticDemo,
    extraction_warnings: row.extractionWarnings || [],
    has_unreadable_pages: row.hasUnreadablePages,
  }));
}

export async function saveUserPaper(userId: string, paper: PaperRecord): Promise<void> {
  const parsedYear = Number.parseInt(paper.year, 10);
  const updatedAt = new Date();
  await db.insert(papers).values({
    id: paper.paper_id,
    userId,
    title: paper.title,
    journal: paper.journal || null,
    authors: paper.authors || null,
    year: Number.isFinite(parsedYear) ? parsedYear : null,
    doi: paper.doi || null,
    sourceUrl: paper.filename || null,
    fileSizeBytes: Number.isSafeInteger(paper.filesize_bytes) && paper.filesize_bytes >= 0 ? paper.filesize_bytes : 0,
    totalPages: Number.isSafeInteger(paper.total_pages) && paper.total_pages >= 0 ? paper.total_pages : 0,
    extractionWarnings: Array.isArray(paper.extraction_warnings) ? paper.extraction_warnings : [],
    hasUnreadablePages: !!paper.has_unreadable_pages,
    isSyntheticDemo: !!paper.is_demo,
    metadataVerified: !!paper.is_metadata_verified,
    createdAt: paper.uploaded_at ? new Date(paper.uploaded_at) : updatedAt,
    updatedAt,
  }).onConflictDoUpdate({
    target: [papers.userId, papers.id],
    set: {
      title: paper.title,
      journal: paper.journal || null,
      authors: paper.authors || null,
      year: Number.isFinite(parsedYear) ? parsedYear : null,
      doi: paper.doi || null,
      sourceUrl: paper.filename || null,
      fileSizeBytes: Number.isSafeInteger(paper.filesize_bytes) && paper.filesize_bytes >= 0 ? paper.filesize_bytes : 0,
      totalPages: Number.isSafeInteger(paper.total_pages) && paper.total_pages >= 0 ? paper.total_pages : 0,
      extractionWarnings: Array.isArray(paper.extraction_warnings) ? paper.extraction_warnings : [],
      hasUnreadablePages: !!paper.has_unreadable_pages,
      isSyntheticDemo: !!paper.is_demo,
      metadataVerified: !!paper.is_metadata_verified,
      updatedAt,
    },
  });
}

export async function deleteUserPaper(userId: string, paperId: string): Promise<void> {
  await db.transaction(async (transaction) => {
    await transaction.delete(evidencePassages).where(and(
      eq(evidencePassages.userId, userId),
      eq(evidencePassages.paperId, paperId),
    ));
    await transaction.delete(claims).where(and(eq(claims.userId, userId), eq(claims.paperId, paperId)));
    await transaction.delete(deliverables).where(and(eq(deliverables.userId, userId), eq(deliverables.paperId, paperId)));
    await transaction.delete(scheduledPosts).where(and(
      eq(scheduledPosts.userId, userId),
      sql`${scheduledPosts.payload}->>'paper_id' = ${paperId}`,
    ));
    await transaction.delete(papers).where(and(eq(papers.id, paperId), eq(papers.userId, userId)));
  });
}

export async function getUserPassages(userId: string, paperId?: string): Promise<EvidencePassage[]> {
  const condition = paperId
    ? and(eq(evidencePassages.userId, userId), eq(evidencePassages.paperId, paperId))
    : eq(evidencePassages.userId, userId);
  const rows = await db.select().from(evidencePassages).where(condition).orderBy(asc(evidencePassages.pdfPageIndex));
  return rows.map((row) => ({
    evidence_id: row.id,
    paper_id: row.paperId,
    pdf_page_index: row.pdfPageIndex,
    printed_page_label_if_known: `p. ${row.pdfPageIndex}`,
    section: (row.section || 'Other') as EvidencePassage['section'],
    verbatim_text: row.verbatimText,
    extraction_status: 'OK',
    char_count: row.verbatimText.length,
  }));
}

export async function saveUserPassages(userId: string, paperId: string, passagesList: EvidencePassage[]): Promise<void> {
  if (passagesList.length === 0) return;
  await assertOwnedPaper(userId, paperId);
  const now = new Date();
  await db.insert(evidencePassages).values(passagesList.map((passage) => ({
    id: passage.evidence_id,
    paperId,
    userId,
    pdfPageIndex: passage.pdf_page_index,
    section: passage.section || 'Other',
    verbatimText: passage.verbatim_text,
    charStart: 0,
    charEnd: passage.char_count || passage.verbatim_text.length,
    hasFigureOrTable: false,
    warning: null,
    createdAt: now,
  }))).onConflictDoUpdate({
    target: [evidencePassages.userId, evidencePassages.id],
    set: {
      paperId,
      pdfPageIndex: sql`excluded.pdf_page_index`,
      section: sql`excluded.section`,
      verbatimText: sql`excluded.verbatim_text`,
      charStart: sql`excluded.char_start`,
      charEnd: sql`excluded.char_end`,
      hasFigureOrTable: sql`excluded.has_figure_or_table`,
      warning: sql`excluded.warning`,
    },
  });
}

export async function getUserClaims(userId: string, paperId?: string): Promise<ClaimRecord[]> {
  const condition = paperId
    ? and(eq(claims.userId, userId), eq(claims.paperId, paperId))
    : eq(claims.userId, userId);
  const rows = await db.select().from(claims).where(condition).orderBy(desc(claims.updatedAt));
  return rows.map((row) => ({
    claim_id: row.id,
    paper_id: row.paperId,
    claim_text: row.claimText,
    evidence_ids: parseStringArray(row.evidenceIds),
    exact_supporting_quote: row.exactSupportingQuote || '',
    population: row.population || 'NOT REPORTED',
    study_design: row.studyDesign || 'NOT REPORTED',
    intervention_or_exposure: row.interventionOrExposure || 'NOT REPORTED',
    comparison: row.comparison || 'NOT REPORTED',
    outcome: row.outcome || 'NOT REPORTED',
    numbers_and_units: row.numbersAndUnits || 'NOT REPORTED',
    limitations: row.limitations || 'NOT REPORTED',
    certainty_notes: row.certaintyNotes || '',
    risk_flags: parseStringArray(row.riskFlags),
    review_status: (row.reviewStatus || 'DRAFT') as ClaimRecord['review_status'],
    reviewer_note: row.reviewerNote || '',
    updated_at: toIsoString(row.updatedAt),
  }));
}

export async function saveUserClaim(userId: string, claim: ClaimRecord): Promise<void> {
  await assertOwnedPaper(userId, claim.paper_id);
  const updatedAt = new Date();
  const values = {
    id: claim.claim_id,
    paperId: claim.paper_id,
    userId,
    claimText: claim.claim_text,
    evidenceIds: JSON.stringify(claim.evidence_ids || []),
    exactSupportingQuote: claim.exact_supporting_quote || null,
    population: claim.population || null,
    studyDesign: claim.study_design || null,
    interventionOrExposure: claim.intervention_or_exposure || null,
    comparison: claim.comparison || null,
    outcome: claim.outcome || null,
    numbersAndUnits: claim.numbers_and_units || null,
    limitations: claim.limitations || null,
    certaintyNotes: claim.certainty_notes || null,
    riskFlags: JSON.stringify(claim.risk_flags || []),
    reviewStatus: claim.review_status || 'DRAFT',
    reviewerNote: claim.reviewer_note || null,
    updatedAt,
  };
  await db.insert(claims).values(values).onConflictDoUpdate({
    target: [claims.userId, claims.id],
    set: values,
  });
}

export async function deleteUserClaim(userId: string, claimId: string): Promise<void> {
  await db.delete(claims).where(and(eq(claims.id, claimId), eq(claims.userId, userId)));
}

export async function getUserDeliverables(userId: string, paperId?: string): Promise<{
  carousels: CarouselContent[];
  staticPosts: StaticPostContent[];
  reels: ReelContent[];
}> {
  const condition = paperId
    ? and(eq(deliverables.userId, userId), eq(deliverables.paperId, paperId))
    : eq(deliverables.userId, userId);
  const rows = await db.select().from(deliverables).where(condition).orderBy(desc(deliverables.updatedAt));
  const result = { carousels: [] as CarouselContent[], staticPosts: [] as StaticPostContent[], reels: [] as ReelContent[] };

  for (const row of rows) {
    try {
      const payload = JSON.parse(row.payload);
      if (row.deliverableType === 'CAROUSEL') result.carousels.push(payload);
      else if (row.deliverableType === 'STATIC') result.staticPosts.push(payload);
      else if (row.deliverableType === 'REEL') result.reels.push(payload);
    } catch (error) {
      console.error(`Skipping malformed ${row.deliverableType} deliverable ${row.id}.`, error);
    }
  }

  return result;
}

export async function saveUserDeliverable(
  userId: string,
  paperId: string,
  deliverableType: 'CAROUSEL' | 'STATIC' | 'REEL',
  id: string,
  payload: CarouselContent | StaticPostContent | ReelContent,
): Promise<void> {
  await assertOwnedPaper(userId, paperId);
  const updatedAt = new Date();
  await db.insert(deliverables).values({
    id,
    paperId,
    userId,
    deliverableType,
    payload: JSON.stringify(payload),
    status: payload.status || 'READY',
    updatedAt,
  }).onConflictDoUpdate({
    target: [deliverables.userId, deliverables.id],
    set: {
      paperId,
      deliverableType,
      payload: JSON.stringify(payload),
      status: payload.status || 'READY',
      updatedAt,
    },
  });
}

export async function getUserScheduledPosts(userId: string): Promise<ScheduledPost[]> {
  const rows = await db.select().from(scheduledPosts).where(eq(scheduledPosts.userId, userId)).orderBy(desc(scheduledPosts.updatedAt));
  return rows.map((row) => row.payload as ScheduledPost);
}

export async function upsertUserScheduledPosts(userId: string, posts: ScheduledPost[]): Promise<void> {
  const paperIds = [...new Set(posts.map((post) => post.paper_id))];
  if (paperIds.length > 0) {
    const ownedPapers = await db.select({ id: papers.id }).from(papers).where(and(
      eq(papers.userId, userId),
      inArray(papers.id, paperIds),
    ));
    if (ownedPapers.length !== paperIds.length) throw new Error('Editorial plan includes a paper outside this account.');
  }

  if (posts.length === 0) return;
  const now = new Date();
  await db.insert(scheduledPosts).values(posts.map((post) => ({
    id: post.id,
    userId,
    payload: post,
    createdAt: now,
    updatedAt: now,
  }))).onConflictDoUpdate({
    target: [scheduledPosts.userId, scheduledPosts.id],
    set: { payload: sql`excluded.payload`, updatedAt: now },
  });
}

export async function replaceUserScheduledPosts(userId: string, posts: ScheduledPost[]): Promise<void> {
  const paperIds = [...new Set(posts.map((post) => post.paper_id))];
  if (paperIds.length > 0) {
    const ownedPapers = await db.select({ id: papers.id }).from(papers).where(and(
      eq(papers.userId, userId),
      inArray(papers.id, paperIds),
    ));
    if (ownedPapers.length !== paperIds.length) throw new Error('Editorial plan includes a paper outside this account.');
  }

  await db.transaction(async (transaction) => {
    await transaction.delete(scheduledPosts).where(eq(scheduledPosts.userId, userId));
    if (posts.length === 0) return;
    const now = new Date();
    await transaction.insert(scheduledPosts).values(posts.map((post) => ({
      id: post.id,
      userId,
      payload: post,
      createdAt: now,
      updatedAt: now,
    })));
  });
}

export async function getUserAuditLogs(userId: string): Promise<AuditLogEntry[]> {
  const rows = await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(500);
  return rows.map((row) => row.payload as AuditLogEntry);
}

export async function appendUserAuditLog(
  userId: string,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>,
): Promise<void> {
  const payload: AuditLogEntry = {
    ...entry,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };
  await db.insert(auditLogs).values({ id: payload.id, userId, payload, createdAt: new Date(payload.timestamp) });
}
