import type {
  ClaimRecord,
  EvidencePassage,
  ValidationFinding,
  ValidationCheckResult,
  ValidationOutcome,
} from '../types/index.ts';

export interface ValidationEngineResult {
  findings: ValidationFinding[];
  checks: ValidationCheckResult[];
  calculatedStatus: ClaimRecord['review_status'];
}

export function runValidationEngine(
  claim: ClaimRecord,
  evidencePassages: EvidencePassage[],
  allClaims: ClaimRecord[] = []
): ValidationEngineResult {
  const findings: ValidationFinding[] = [];
  const checks: ValidationCheckResult[] = [];
  const now = new Date().toISOString();

  const linkedPassages = evidencePassages.filter((p) =>
    claim.evidence_ids.includes(p.evidence_id)
  );

  // Helper to record a structured check result
  const recordCheck = (
    rule_id: string,
    rule_number: number,
    rule_name: string,
    outcome: ValidationOutcome,
    severity: 'BLOCKER' | 'FLAG' | 'INFO',
    reason: string,
    evidence_examined: string,
    recommended_action: string
  ) => {
    checks.push({
      rule_id,
      rule_number,
      rule_name,
      outcome,
      severity,
      reason,
      evidence_examined,
      recommended_action,
      evaluated_at: now,
    });

    if (outcome === 'FAIL' || outcome === 'NEEDS_REVIEW') {
      findings.push({
        rule_id,
        rule_number,
        severity: severity === 'INFO' ? 'FLAG' : severity,
        reason,
        claim_text: claim.claim_text,
        supporting_quote: claim.exact_supporting_quote,
        recommended_action,
      });
    }
  };

  // =========================================================================
  // Rule 1: Evidence Linkage (No valid evidence link)
  // =========================================================================
  if (!claim.evidence_ids || claim.evidence_ids.length === 0 || linkedPassages.length === 0) {
    recordCheck(
      'RULE_1_NO_EVIDENCE',
      1,
      'Evidence Linkage Integrity',
      'FAIL',
      'BLOCKER',
      'No valid evidence passages linked to this claim in the document repository.',
      `Evidence IDs in claim: [${(claim.evidence_ids || []).join(', ') || 'NONE'}]`,
      'Link the claim to at least one verified passage from the paper.'
    );
  } else {
    recordCheck(
      'RULE_1_NO_EVIDENCE',
      1,
      'Evidence Linkage Integrity',
      'PASS',
      'BLOCKER',
      `Verified link to ${linkedPassages.length} source evidence passage(s).`,
      linkedPassages.map((p) => `ID ${p.evidence_id} (Page ${p.pdf_page_index})`).join(', '),
      'None required.'
    );
  }

  // =========================================================================
  // Rule 2: Page Reference Validity
  // =========================================================================
  const invalidPages = linkedPassages.filter(
    (p) => !p.pdf_page_index || p.pdf_page_index < 1 || isNaN(p.pdf_page_index)
  );
  if (linkedPassages.length > 0 && invalidPages.length > 0) {
    recordCheck(
      'RULE_2_INVALID_PAGE',
      2,
      'Document Page Anchor',
      'FAIL',
      'BLOCKER',
      `Claim references an invalid or out-of-range PDF page index: ${invalidPages.map((p) => p.pdf_page_index).join(', ')}.`,
      `Passages checked: ${linkedPassages.map((p) => `ID ${p.evidence_id} on page ${p.pdf_page_index}`).join('; ')}`,
      'Verify and map the claim to an actual extracted PDF page number.'
    );
  } else if (linkedPassages.length > 0) {
    recordCheck(
      'RULE_2_INVALID_PAGE',
      2,
      'Document Page Anchor',
      'PASS',
      'BLOCKER',
      `All linked passages reside on valid pages (${linkedPassages.map((p) => `p. ${p.pdf_page_index}`).join(', ')}).`,
      `Pages examined: ${linkedPassages.map((p) => `p. ${p.pdf_page_index}`).join(', ')}`,
      'None required.'
    );
  } else {
    recordCheck(
      'RULE_2_INVALID_PAGE',
      2,
      'Document Page Anchor',
      'NOT_RUN',
      'BLOCKER',
      'Page verification skipped because no evidence passages are linked.',
      'No evidence linked.',
      'Resolve Rule 1 first.'
    );
  }

  // =========================================================================
  // Rule 3: Verbatim Source Quotation & Reconciliation
  // =========================================================================
  if (
    !claim.exact_supporting_quote ||
    claim.exact_supporting_quote.trim().length < 8 ||
    claim.exact_supporting_quote === 'UNKNOWN' ||
    claim.exact_supporting_quote === 'NOT REPORTED'
  ) {
    recordCheck(
      'RULE_3_NO_EXACT_QUOTE',
      3,
      'Verbatim Source Quotation',
      'FAIL',
      'BLOCKER',
      'Required verbatim source quotation is missing or unpopulated ("NOT REPORTED" / empty).',
      `Quote text provided: "${claim.exact_supporting_quote || ''}"`,
      'Provide the verbatim sentence from the paper that supports this claim.'
    );
  } else if (linkedPassages.length > 0) {
      const normalizeSourceText = (text: string) =>
        text.toLowerCase().replace(/[\u00ad\s\r\n]+/g, ' ').trim();
      const cleanQuote = normalizeSourceText(claim.exact_supporting_quote);
      const quoteFoundInAny = linkedPassages.some((p) =>
        normalizeSourceText(p.verbatim_text).includes(cleanQuote)
      );

    if (!quoteFoundInAny) {
      recordCheck(
        'RULE_3_NO_EXACT_QUOTE',
        3,
        'Verbatim Source Quotation',
        'FAIL',
        'BLOCKER',
        'Quotation could not be located inside the linked passage text.',
        `Quote: "${claim.exact_supporting_quote.substring(0, 80)}..."`,
        'Re-select the exact text directly from the extracted page evidence.'
      );
    } else {
      recordCheck(
        'RULE_3_NO_EXACT_QUOTE',
        3,
        'Verbatim Source Quotation',
        'PASS',
        'BLOCKER',
        'Verbatim supporting quotation successfully reconciled with linked source passage.',
        `Quote verified in passage text (${linkedPassages[0].section}, p. ${linkedPassages[0].pdf_page_index})`,
        'None required.'
      );
    }
  } else {
    recordCheck(
      'RULE_3_NO_EXACT_QUOTE',
      3,
      'Verbatim Source Quotation',
      'NOT_RUN',
      'BLOCKER',
      'Quotation check skipped because no evidence passages are linked.',
      'No evidence linked.',
      'Resolve Rule 1 first.'
    );
  }

  // =========================================================================
  // Rule 4: Numerical & Statistical Consistency
  // =========================================================================
  const claimNumbers =
    claim.claim_text.match(/\b\d+(\.\d+)?%?|\b\d+(\.\d+)?\s*(mg|g|kg|ml|hours|days|weeks|fold|times)\b/gi) || [];
  if (claimNumbers.length > 0 && claim.exact_supporting_quote) {
    const quoteAndPassageText = (
      claim.exact_supporting_quote +
      ' ' +
      linkedPassages.map((p) => p.verbatim_text).join(' ')
    ).toLowerCase();

    const missingNumbers = claimNumbers.filter((numStr) => {
      const cleanNum = numStr.toLowerCase().trim();
      const pureDigits = cleanNum.replace(/[^\d.]/g, '');
      if (!pureDigits || (pureDigits.length === 1 && ['1', '2'].includes(pureDigits))) return false;
      return !quoteAndPassageText.includes(cleanNum) && !quoteAndPassageText.includes(pureDigits);
    });

    if (missingNumbers.length > 0) {
      recordCheck(
        'RULE_6_NUMERICAL_MISMATCH',
        4,
        'Numerical & Statistical Consistency',
        'FAIL',
        'FLAG',
        `Metric or number (${missingNumbers.join(', ')}) in claim could not be reconciled with the supporting source passage.`,
        `Extracted numbers from claim: [${claimNumbers.join(', ')}]. Checked against source passage and exact quote.`,
        'Verify statistical figures against the primary table or results section.'
      );
    } else {
      recordCheck(
        'RULE_6_NUMERICAL_MISMATCH',
        4,
        'Numerical & Statistical Consistency',
        'PASS',
        'FLAG',
        `All metrics (${claimNumbers.join(', ')}) in claim reconciled with supporting passage text.`,
        `Matched numbers [${claimNumbers.join(', ')}] in source text.`,
        'None required.'
      );
    }
  } else {
    recordCheck(
      'RULE_6_NUMERICAL_MISMATCH',
      4,
      'Numerical & Statistical Consistency',
      'PASS',
      'FLAG',
      'No specific quantitative metrics or percentages require reconciliation.',
      'No quantitative metrics found in claim statement.',
      'None required.'
    );
  }

  // =========================================================================
  // Rule 5: Denominator, Baseline & Timeframe Completeness
  // =========================================================================
  const relativeChangeRegex =
    /\b(reduced by|increased by|decreased by|dropped by|\d+%\s*(reduction|increase|decrease|drop|spike)|risk doubled|halved)\b/i;
  if (relativeChangeRegex.test(claim.claim_text)) {
    const hasTimeOrDenominator =
      /\b(over \d+\s*(days|weeks|months|years)|at \d+\s*(hours|weeks|months)|per \d+|baseline|compared to|compared with|denominator|vs\.?|placebo|control|n\s*=\s*\d+)\b/i.test(
        claim.claim_text
      );
    if (!hasTimeOrDenominator) {
      recordCheck(
        'RULE_5_MISSING_DENOMINATOR',
        5,
        'Baseline & Timeframe Specification',
        'NEEDS_REVIEW',
        'FLAG',
        'Relative change stated without baseline denominator, comparison group, or timeframe.',
        `Relative expression detected in claim without anchoring: "${claim.claim_text}"`,
        'State baseline risk or study duration so readers understand clinical relevance.'
      );
    } else {
      recordCheck(
        'RULE_5_MISSING_DENOMINATOR',
        5,
        'Baseline & Timeframe Specification',
        'PASS',
        'FLAG',
        'Relative change properly anchored with timeframe, comparator, or baseline.',
        'Anchored with time/comparator context in claim or supporting quote.',
        'None required.'
      );
    }
  } else {
    recordCheck(
      'RULE_5_MISSING_DENOMINATOR',
      5,
      'Baseline & Timeframe Specification',
      'PASS',
      'FLAG',
      'Claim does not state an unanchored relative percentage or fold-change.',
      'No relative risk phrasing detected.',
      'None required.'
    );
  }

  // =========================================================================
  // Rule 6: Study Design & Causal Inference
  // =========================================================================
  const observationalDesigns = [
    'observational',
    'cross-sectional',
    'cohort',
    'epidemiological',
    'survey',
    'case-control',
    'prospective cohort',
  ];
  const designLower = (claim.study_design || '').toLowerCase();
  const isObservational = observationalDesigns.some((d) => designLower.includes(d));
  const causalVerbs = /\b(causes|caused|prevents|prevented|cures|eliminates|leads to|results in|triggers)\b/i;

  if (isObservational && causalVerbs.test(claim.claim_text)) {
    recordCheck(
      'RULE_5_CAUSAL_OVERSTATEMENT',
      6,
      'Study Design & Causal Inference',
      'FAIL',
      'FLAG',
      `Observational study design (${claim.study_design}) rewritten with direct causal language.`,
      `Study Design: "${claim.study_design}". Causal language detected in claim text.`,
      'Rephrase using correlational language (e.g., "was associated with" or "was linked to").'
    );
  } else {
    recordCheck(
      'RULE_5_CAUSAL_OVERSTATEMENT',
      6,
      'Study Design & Causal Inference',
      'PASS',
      'FLAG',
      isObservational
        ? 'Observational study uses appropriately associative, non-causal language.'
        : `Interventional design (${claim.study_design || 'Experimental'}) supports active effect formulation.`,
      `Design: ${claim.study_design || 'Not specified'}`,
      'None required.'
    );
  }

  // =========================================================================
  // Rule 7: Target Population Boundary & Overgeneralization
  // =========================================================================
  const restrictedPopulations = [
    'mice',
    'rats',
    'animal model',
    'in vitro',
    'cell culture',
    'postmenopausal women',
    'male endurance athletes',
    'resistance-trained young males',
    'resistance-trained young men',
    'resistance-trained males',
    'type 2 diabetic adults',
    'pediatric patients',
    'over 65',
    'critically ill',
  ];
  const popLower = (claim.population || '').toLowerCase();
  const foundRestriction = restrictedPopulations.find((rp) => popLower.includes(rp));

  if (foundRestriction) {
    const claimLower = claim.claim_text.toLowerCase();
    const hasBroadeningWord =
      claimLower.includes('all human') ||
      claimLower.includes('all adults') ||
      claimLower.includes('everyone') ||
      claimLower.includes('people') ||
      claimLower.includes('any workout') ||
      claimLower.includes('in all humans');

    if (hasBroadeningWord && !claimLower.includes('resistance-trained') && !claimLower.includes('male')) {
      recordCheck(
        'RULE_4_POPULATION_GENERALIZATION',
        7,
        'Population Boundary & Generalizability',
        'FAIL',
        'FLAG',
        `Study was conducted in restricted cohort [${claim.population}], but claim broadens to general audience or all humans.`,
        `Population: "${claim.population}". Broadening terms detected in: "${claim.claim_text}"`,
        `Explicitly mention the investigated population (${claim.population}) in social copy.`
      );
    } else {
      recordCheck(
        'RULE_4_POPULATION_GENERALIZATION',
        7,
        'Population Boundary & Generalizability',
        'PASS',
        'FLAG',
        'Target population is appropriately constrained to the investigated cohort.',
        `Population: ${claim.population}`,
        'None required.'
      );
    }
  } else {
    recordCheck(
      'RULE_4_POPULATION_GENERALIZATION',
      7,
      'Population Boundary & Generalizability',
      'PASS',
      'FLAG',
      'No population mismatch or overgeneralization detected.',
      `Population: ${claim.population || 'Not reported'}`,
      'None required.'
    );
  }

  // =========================================================================
  // Rule 8: Preservation of Disclosed Study Limitations
  // =========================================================================
  const isLimitationsMissing =
    !claim.limitations ||
    claim.limitations === 'UNKNOWN' ||
    claim.limitations === 'NOT REPORTED' ||
    claim.limitations.trim() === '';

  if (isLimitationsMissing) {
    recordCheck(
      'RULE_8_REMOVED_LIMITATION',
      8,
      'Preservation of Study Limitations',
      'NEEDS_REVIEW',
      'FLAG',
      'Study limitations omitted or marked NOT REPORTED on clinical claim.',
      `Limitations field is empty or unstated for claim: "${claim.claim_text.substring(0, 60)}..."`,
      'Disclose study constraints (sample size, cohort restrictions, observational limits).'
    );
  } else if (claim.limitations.length > 20) {
    const hasCaveatWording =
      /\b(however|preliminary|further research|limited to|observed in|modest|noted that|uncertain|caution)\b/i.test(
        claim.claim_text + ' ' + (claim.certainty_notes || '')
      );
    if (!hasCaveatWording && claim.claim_text.length < 70) {
      recordCheck(
        'RULE_8_REMOVED_LIMITATION',
        8,
        'Preservation of Study Limitations',
        'NEEDS_REVIEW',
        'FLAG',
        'Significant study limitation reported in evidence but omitted from simplified claim.',
        `Reported limitations: "${claim.limitations}". Claim length: ${claim.claim_text.length} chars.`,
        'Include key caveat or note the study constraints in accompanying copy.'
      );
    } else {
      recordCheck(
        'RULE_8_REMOVED_LIMITATION',
        8,
        'Preservation of Study Limitations',
        'PASS',
        'FLAG',
        'Disclosed study limitations are preserved or adequately qualified.',
        `Limitations: "${claim.limitations.substring(0, 60)}..."`,
        'None required.'
      );
    }
  } else {
    recordCheck(
      'RULE_8_REMOVED_LIMITATION',
      8,
      'Preservation of Study Limitations',
      'PASS',
      'FLAG',
      'Study limitations reported and acknowledged.',
      `Limitations: ${claim.limitations}`,
      'None required.'
    );
  }

  // =========================================================================
  // Rule 9: Absolute & Guaranteed Language Check
  // =========================================================================
  const absoluteLanguageRegex =
    /\b(always|guaranteed|cures?|100% effective|proves conclusively|never fails|completely stops|miracle)\b/i;
  if (absoluteLanguageRegex.test(claim.claim_text)) {
    recordCheck(
      'RULE_9_ABSOLUTE_LANGUAGE',
      9,
      'Scientific Epistemic Modesty',
      'FAIL',
      'FLAG',
      'Absolute, cured, or guaranteed language detected without appropriate clinical evidence.',
      `Absolute terms found in claim: "${claim.claim_text}"`,
      'Soften the claim to reflect empirical uncertainty (e.g. "suggests", "was associated with").'
    );
  } else {
    recordCheck(
      'RULE_9_ABSOLUTE_LANGUAGE',
      9,
      'Scientific Epistemic Modesty',
      'PASS',
      'FLAG',
      'Appropriate epistemic modesty maintained; no absolute or guaranteed words found.',
      'Language uses measured, scientific phrasing.',
      'None required.'
    );
  }

  // =========================================================================
  // Rule 10: Contradictory & Conflicting Evidence Passages
  // =========================================================================
  let foundContradiction = false;
  let contradictionDetail = '';

  if (linkedPassages.length > 1) {
    for (let i = 0; i < linkedPassages.length; i++) {
      for (let j = i + 1; j < linkedPassages.length; j++) {
        const t1 = linkedPassages[i].verbatim_text.toLowerCase();
        const t2 = linkedPassages[j].verbatim_text.toLowerCase();

        const p1Sig = t1.includes('p = 0.0') || t1.includes('significantly lower') || t1.includes('significant reduction');
        const p2NoSig = t2.includes('no significant difference') || t2.includes('p = 0.6') || t2.includes('did not differ');

        const p1Inc = t1.includes('increased') && t2.includes('decreased');
        const p1Adv = t1.includes('beneficial') && t2.includes('adverse');

        if ((p1Sig && p2NoSig) || p1Inc || p1Adv) {
          foundContradiction = true;
          contradictionDetail = `Passage ${linkedPassages[i].evidence_id} (p. ${linkedPassages[i].pdf_page_index}) reports significant effect, while passage ${linkedPassages[j].evidence_id} (p. ${linkedPassages[j].pdf_page_index}) reports no significant difference or contrary endpoint.`;
          break;
        }
      }
      if (foundContradiction) break;
    }
  }

  if (foundContradiction) {
    recordCheck(
      'RULE_10_CONFLICTING_EVIDENCE',
      10,
      'Conflicting Evidence Reconciliation',
      'FAIL',
      'FLAG',
      `Linked evidence passages contain conflicting findings: ${contradictionDetail}`,
      contradictionDetail,
      'Review conflicting source sections to clarify discrepancies in the reviewer note.'
    );
  } else {
    recordCheck(
      'RULE_10_CONFLICTING_EVIDENCE',
      10,
      'Conflicting Evidence Reconciliation',
      'PASS',
      'FLAG',
      'No internal contradictions or conflicting findings detected across linked evidence.',
      `Examined ${linkedPassages.length} linked passage(s).`,
      'None required.'
    );
  }

  // =========================================================================
  // Rule 11: Safety, Marketing & Prohibited Health Promises
  // =========================================================================
  const safetyRegex =
    /\b(miracle cure|melt fat|shed \d+\s*(lbs|pounds|kg)|guaranteed weight loss|cures cancer|ozempic without prescription|anabolic steroid|buy now|doctor secret trick)\b/i;
  const sideEffectMention = /\b(side effects?|adverse events?|toxicity|contraindications?|complications?)\b/i.test(
    claim.claim_text + ' ' + (claim.limitations || '')
  );
  const hasSafetyWarning = /\b(physician|doctor|guidance|supervision|consult|medical supervision|precautions?)\b/i.test(
    claim.claim_text + ' ' + (claim.reviewer_note || '') + ' ' + (claim.limitations || '')
  );

  if (safetyRegex.test(claim.claim_text) || safetyRegex.test(claim.exact_supporting_quote)) {
    recordCheck(
      'RULE_11_SAFETY_POLICY',
      11,
      'Health Communication Safety & Policy',
      'FAIL',
      'BLOCKER',
      'Prohibited health marketing detected (miracle promises, extreme weight loss claims, or prescription drug promotion).',
      `Prohibited terminology found in claim or quote text.`,
      'Block this content. Educational science communication must avoid sensational promises.'
    );
  } else if (sideEffectMention && !hasSafetyWarning) {
    recordCheck(
      'RULE_11_SAFETY_POLICY',
      11,
      'Health Communication Safety & Policy',
      'NEEDS_REVIEW',
      'FLAG',
      'Claim references side effects or adverse events without medical supervision warning.',
      `Adverse effects mentioned without physician oversight disclaimer.`,
      'Include explicit advisory to consult a physician before protocol initiation.'
    );
  } else {
    recordCheck(
      'RULE_11_SAFETY_POLICY',
      11,
      'Health Communication Safety & Policy',
      'PASS',
      'BLOCKER',
      'Clean compliance with safety guidelines and educational communication policies.',
      'No prohibited phrases found.',
      'None required.'
    );
  }

  // =========================================================================
  // Rule 12: Source Readability & OCR Confidence
  // =========================================================================
  const unreadablePassages = linkedPassages.filter(
    (p) =>
      p.extraction_status === 'NO_TEXT' ||
      p.extraction_status === 'LOW_CONFIDENCE' ||
      p.extraction_status === 'OCR_UNVERIFIED'
  );
  if (unreadablePassages.length > 0) {
    recordCheck(
      'RULE_12_UNREADABLE_EVIDENCE',
      12,
      'Source Readability & OCR Integrity',
      'FAIL',
      'BLOCKER',
      `Linked evidence passage (${unreadablePassages.map((p) => p.evidence_id).join(', ')}) is marked as unreadable, scanned, or low-confidence.`,
      `Passages flagged: ${unreadablePassages.map((p) => `${p.evidence_id} (status: ${p.extraction_status})`).join(', ')}`,
      'Manually review or paste text for unreadable pages before using in content.'
    );
  } else {
    recordCheck(
      'RULE_12_UNREADABLE_EVIDENCE',
      12,
      'Source Readability & OCR Integrity',
      'PASS',
      'BLOCKER',
      'All linked evidence passages have verified high-confidence machine-readable text.',
      `Passages checked: ${linkedPassages.length} OK passages.`,
      'None required.'
    );
  }

  // =========================================================================
  // Status Determination
  // =========================================================================
  const hasBlocker = checks.some((c) => c.severity === 'BLOCKER' && c.outcome === 'FAIL');
  const hasFlag = checks.some(
    (c) => c.severity === 'FLAG' && (c.outcome === 'FAIL' || c.outcome === 'NEEDS_REVIEW')
  );

  let calculatedStatus: ClaimRecord['review_status'] = claim.review_status;

  if (hasBlocker) {
    calculatedStatus = 'BLOCKED';
  } else if (hasFlag) {
    if (claim.review_status === 'HUMAN_APPROVED') {
      calculatedStatus = 'HUMAN_APPROVED';
    } else {
      calculatedStatus = 'FLAGGED';
    }
  } else {
    if (claim.review_status === 'HUMAN_APPROVED') {
      calculatedStatus = 'HUMAN_APPROVED';
    } else if (claim.review_status === 'REJECTED') {
      calculatedStatus = 'REJECTED';
    } else {
      calculatedStatus = 'READY_FOR_HUMAN_REVIEW';
    }
  }

  return { findings, checks, calculatedStatus };
}
