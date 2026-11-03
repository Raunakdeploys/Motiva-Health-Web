import { runValidationEngine } from '../src/utils/validationEngine.ts';
import { EvidencePassage, ClaimRecord } from '../src/types/index.ts';

const baselinePassage: EvidencePassage = {
  evidence_id: 'ev_test_p5',
  paper_id: 'test_paper',
  pdf_page_index: 5,
  printed_page_label_if_known: 'p. 5',
  section: 'Results',
  verbatim_text:
    'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo (412 ± 68 U/L vs. 572 ± 84 U/L, p = 0.021).',
  extraction_status: 'OK',
  char_count: 178,
};

const conflictingPassage: EvidencePassage = {
  evidence_id: 'ev_test_p6',
  paper_id: 'test_paper',
  pdf_page_index: 6,
  printed_page_label_if_known: 'p. 6',
  section: 'Results',
  verbatim_text:
    'In a secondary trial of identical formulation, creatine kinase showed no significant difference between tart cherry and placebo groups (530 ± 75 U/L vs. 545 ± 80 U/L, p = 0.65).',
  extraction_status: 'OK',
  char_count: 182,
};

const testCases = [
  {
    id: 1,
    name: 'Claim with no evidence link',
    expectedStatus: 'BLOCKED',
    testClaim: {
      claim_id: 'tc_1',
      paper_id: 'test_paper',
      claim_text: 'Tart cherry juice improves recovery time.',
      evidence_ids: [],
      exact_supporting_quote: '',
      population: 'NOT REPORTED',
      study_design: 'NOT REPORTED',
      numbers_and_units: '',
      limitations: '',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 2,
    name: 'Invalid or nonexistent page reference',
    expectedStatus: 'BLOCKED',
    testClaim: {
      claim_id: 'tc_2',
      paper_id: 'test_paper',
      claim_text: 'Tart cherry juice reduces muscle damage.',
      evidence_ids: ['ev_invalid_page'],
      exact_supporting_quote: 'serum creatine kinase was 28% lower at 48 hours',
      population: '32 trained males',
      study_design: 'RCT',
      numbers_and_units: '28%',
      limitations: '',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [
      {
        evidence_id: 'ev_invalid_page',
        paper_id: 'test_paper',
        pdf_page_index: 0,
        section: 'Results' as const,
        verbatim_text: 'serum creatine kinase was 28% lower at 48 hours',
        extraction_status: 'OK' as const,
        char_count: 48,
      },
    ],
  },
  {
    id: 3,
    name: 'Missing or fabricated verbatim source quote',
    expectedStatus: 'BLOCKED',
    testClaim: {
      claim_id: 'tc_3',
      paper_id: 'test_paper',
      claim_text: 'Creatine kinase drops by 28%.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote: 'NOT REPORTED',
      population: '32 trained males',
      study_design: 'RCT',
      numbers_and_units: '28%',
      limitations: '',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 4,
    name: 'Overgeneralization beyond studied population',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_4',
      paper_id: 'test_paper',
      claim_text: 'All human beings and adults should drink cherry juice for muscle health.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
      population: '32 resistance-trained young males',
      study_design: 'RCT',
      numbers_and_units: '28%',
      limitations: 'Restricted cohort',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 5,
    name: 'Causal claim from observational data',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_5',
      paper_id: 'test_paper',
      claim_text: 'Drinking cherry juice causes significant reduction in post-workout inflammation.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
      population: '32 resistance-trained males',
      study_design: 'Prospective observational cohort',
      numbers_and_units: '28%',
      limitations: 'Unmeasured confounders',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 6,
    name: 'Numerical percentage mismatch',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_6',
      paper_id: 'test_paper',
      claim_text: 'Tart cherry concentrate reduced muscle soreness by 75% at 48 hours.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
      population: '32 resistance-trained males',
      study_design: 'RCT',
      numbers_and_units: '75%',
      limitations: '',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 7,
    name: 'Contradictory or conflicting evidence passages',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_7',
      paper_id: 'test_paper',
      claim_text: 'Tart cherry supplementation lowers serum creatine kinase across all trials.',
      evidence_ids: ['ev_test_p5', 'ev_test_p6'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo (412 ± 68 U/L vs. 572 ± 84 U/L, p = 0.021).',
      population: '32 resistance-trained males',
      study_design: 'RCT',
      numbers_and_units: '28%',
      limitations: '',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage, conflictingPassage],
  },
  {
    id: 8,
    name: 'Relative change stated without baseline or timeframe',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_8',
      paper_id: 'test_paper',
      claim_text: 'Muscle damage dropped by 28%.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
      population: '32 trained males',
      study_design: 'RCT',
      numbers_and_units: '28%',
      limitations: 'Limited cohort',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 9,
    name: 'Absolute health guarantee without caveats',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_9',
      paper_id: 'test_paper',
      claim_text: 'Tart cherry juice completely cures and eliminates all delayed onset muscle soreness.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
      population: '32 resistance-trained males',
      study_design: 'RCT',
      numbers_and_units: '28%',
      limitations: 'Limited cohort',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 10,
    name: 'Study limitations completely omitted',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_10',
      paper_id: 'test_paper',
      claim_text: 'In 32 resistance-trained young males, creatine kinase was 28% lower at 48 hours compared to placebo.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
      population: '32 resistance-trained males',
      study_design: 'RCT',
      comparison: 'Placebo beverage',
      outcome: 'Serum creatine kinase',
      numbers_and_units: '28% at 48 hours compared to placebo',
      limitations: 'NOT REPORTED',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 11,
    name: 'Medical safety warning missing',
    expectedStatus: 'FLAGGED',
    testClaim: {
      claim_id: 'tc_11',
      paper_id: 'test_paper',
      claim_text: 'Tart cherry juice reduces severe muscle damage with reported side effects in high doses.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
      population: '32 resistance-trained males',
      study_design: 'RCT',
      comparison: 'Placebo beverage',
      outcome: 'Creatine kinase',
      numbers_and_units: '28% at 48 hours',
      limitations: 'High doses caused GI symptoms',
      review_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
  {
    id: 12,
    name: 'Fully qualified, supported empirical finding',
    expectedStatus: 'READY_FOR_HUMAN_REVIEW',
    testClaim: {
      claim_id: 'tc_12',
      paper_id: 'test_paper',
      claim_text:
        'In resistance-trained young men, tart cherry concentrate supplementation was associated with 28% lower serum creatine kinase at 48 hours post-exercise compared with placebo.',
      evidence_ids: ['ev_test_p5'],
      exact_supporting_quote:
        'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo (412 ± 68 U/L vs. 572 ± 84 U/L, p = 0.021).',
      population: '32 resistance-trained young males',
      study_design: 'Randomized, double-blind, placebo-controlled trial',
      intervention_or_exposure: '30 mL Montmorency tart cherry concentrate twice daily',
      comparison: 'Placebo beverage',
      outcome: 'Serum creatine kinase',
      numbers_and_units: '28% lower; 412 ± 68 U/L vs. 572 ± 84 U/L (p = 0.021)',
      limitations: 'Cohort restricted to trained males; outside dietary polyphenol intake self-reported.',
      certainty_notes: 'Moderate certainty from double-blind trial (n=32).',
      risk_flags: [],
      review_status: 'DRAFT',
      reviewer_note: '',
      updated_at: new Date().toISOString(),
    } as any,
    testPassages: [baselinePassage],
  },
];

let passed = 0;
for (const tc of testCases) {
  const { findings, calculatedStatus } = runValidationEngine(
    tc.testClaim,
    tc.testPassages,
    [tc.testClaim]
  );
  const ok = calculatedStatus === tc.expectedStatus;
  if (ok) {
    passed++;
    console.log(`✅ [PASS] Case ${tc.id}: ${tc.name} -> ${calculatedStatus}`);
  } else {
    console.error(`❌ [FAIL] Case ${tc.id}: ${tc.name} -> Expected ${tc.expectedStatus}, got ${calculatedStatus}`);
    console.error('Findings:', findings);
  }
}

console.log(`\nResult: ${passed}/${testCases.length} test cases passed.`);
if (passed !== testCases.length) process.exit(1);
