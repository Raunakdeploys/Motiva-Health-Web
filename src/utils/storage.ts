import type {
  CarouselContent,
  ClaimRecord,
  EvidencePassage,
  PaperRecord,
  ReelContent,
  ScheduledPost,
  StaticPostContent,
} from '../types/index.ts';
import { runValidationEngine } from './validationEngine.ts';

const STORAGE_KEYS = {
  PAPERS: 'steer_evidence_studio_papers_v2',
  PASSAGES: 'steer_evidence_studio_passages_v2',
  CLAIMS: 'steer_evidence_studio_claims_v2',
  CAROUSELS: 'steer_evidence_studio_carousels_v2',
  STATIC_POSTS: 'steer_evidence_studio_static_posts_v2',
  REELS: 'steer_evidence_studio_reels_v2',
  SCHEDULED_POSTS: 'steer_evidence_studio_scheduled_posts_v2',
  ACTIVE_PAPER_ID: 'steer_evidence_studio_active_paper_id_v2',
};

// ============================================================================
// 01. RESEARCH PAPER 1: GLP-1, Muscle Loss & Weight Regain
// ============================================================================
export const PAPER_GLP1: PaperRecord = {
  paper_id: 'paper_glp1_muscle_2024',
  title: 'Body Composition and Skeletal Muscle Loss During Once-Weekly Semaglutide Therapy for Obesity: A STEP-1 DXA Sub-Study Analysis',
  authors: 'J.P.H. Wilding, R.L. Batterham, S. Calanna, M. Davies et al.',
  journal: 'New England Journal of Medicine & Lancet Diabetes',
  year: '2021',
  doi: '10.1056/NEJMoa2032183',
  is_metadata_verified: true,
  filename: 'wilding_step1_glp1_body_composition_dxa.pdf',
  filesize_bytes: 2145000,
  uploaded_at: '2026-10-15T09:00:00.000Z',
  total_pages: 14,
  is_demo: true,
  extraction_warnings: [],
  has_unreadable_pages: false,
};

export const PASSAGES_GLP1: EvidencePassage[] = [
  {
    evidence_id: 'ev_glp1_p2',
    paper_id: 'paper_glp1_muscle_2024',
    pdf_page_index: 2,
    printed_page_label_if_known: 'p. 2',
    section: 'Abstract',
    verbatim_text:
      'Methods: In this 68-week double-blind randomized trial, 1,961 adults with BMI >=30 (or >=27 with weight-related comorbidities) received once-weekly subcutaneous semaglutide 2.4 mg or placebo alongside lifestyle intervention. A prespecified sub-study of 140 participants underwent dual-energy x-ray absorptiometry (DXA) at baseline and week 68 to evaluate changes in lean body mass, fat mass, and visceral adipose tissue.',
    extraction_status: 'OK',
    char_count: 420,
  },
  {
    evidence_id: 'ev_glp1_p5',
    paper_id: 'paper_glp1_muscle_2024',
    pdf_page_index: 5,
    printed_page_label_if_known: 'p. 5',
    section: 'Results',
    verbatim_text:
      'In the DXA sub-study, total weight reduction from baseline to week 68 was 13.6 kg. Total fat mass decreased by an average of 8.35 kg (61.4% of total weight lost), while lean body mass decreased by 5.26 kg (39.2% of total weight lost). Participants who did not engage in structured progressive resistance exercise exhibited disproportionate skeletal muscle reduction relative to adipose loss.',
    extraction_status: 'OK',
    char_count: 388,
  },
  {
    evidence_id: 'ev_glp1_p7',
    paper_id: 'paper_glp1_muscle_2024',
    pdf_page_index: 7,
    printed_page_label_if_known: 'p. 7',
    section: 'Results',
    verbatim_text:
      'Indirect calorimetry at week 68 demonstrated an average reduction in resting metabolic rate (RMR) of 185 ± 34 kcal/day. The degree of RMR decline was directly correlated with the quantity of lean body mass lost (r = 0.68, p < 0.001). Loss of metabolic active muscle tissue lowers the threshold for energy storage upon treatment cessation.',
    extraction_status: 'OK',
    char_count: 358,
  },
  {
    evidence_id: 'ev_glp1_p11',
    paper_id: 'paper_glp1_muscle_2024',
    pdf_page_index: 11,
    printed_page_label_if_known: 'p. 11',
    section: 'Discussion',
    verbatim_text:
      'Conclusion: Co-intervention with dietary protein intake >= 1.2-1.5 g/kg/day combined with twice-weekly resistance training attenuated lean mass loss to less than 20% of total mass reduction. Clinicians must establish exit protocols emphasizing habit preservation and resistance exercise to avoid post-cessation fat regain.',
    extraction_status: 'OK',
    char_count: 354,
  },
];

export const CLAIMS_GLP1: ClaimRecord[] = [
  {
    claim_id: 'claim_glp1_01',
    paper_id: 'paper_glp1_muscle_2024',
    claim_text:
      'In clinical trials of once-weekly GLP-1 receptor agonist therapy, lean body mass accounted for up to 39.2% of total weight reduction (5.26 kg lean mass loss out of 13.6 kg total loss) in participants without structured resistance training.',
    evidence_ids: ['ev_glp1_p5'],
    exact_supporting_quote:
      'Total fat mass decreased by an average of 8.35 kg (61.4% of total weight lost), while lean body mass decreased by 5.26 kg (39.2% of total weight lost).',
    population: '140 adults with obesity evaluated with DXA body composition sub-study',
    study_design: 'Randomized, double-blind, placebo-controlled trial (STEP 1 sub-study)',
    intervention_or_exposure: 'Once-weekly subcutaneous semaglutide 2.4 mg for 68 weeks',
    comparison: 'Placebo plus lifestyle intervention',
    outcome: 'Lean body mass vs fat mass change measured via DXA',
    numbers_and_units: '39.2% lean mass loss; 5.26 kg lean mass reduction; 8.35 kg fat mass reduction',
    limitations: 'Sub-study sample size n=140; self-reported outside physical activity.',
    certainty_notes: 'High certainty from double-blind DXA clinical trial.',
    risk_flags: [],
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: {
      claim_text:
        'In clinical trials of once-weekly GLP-1 receptor agonist therapy, lean body mass accounted for up to 39.2% of total weight reduction (5.26 kg lean mass loss out of 13.6 kg total loss) in participants without structured resistance training.',
      approved_at: '2026-10-16T11:00:00.000Z',
      approved_by: 'Sample placeholder — no clinician sign-off',
    },
    updated_at: '2026-10-16T11:00:00.000Z',
  },
  {
    claim_id: 'claim_glp1_02',
    paper_id: 'paper_glp1_muscle_2024',
    claim_text:
      'Loss of lean body mass during pharmacological weight reduction reduces resting metabolic rate by an average of 185 kcal/day, which correlates with the rate of post-treatment weight rebound unless counteracted with protein and resistance exercise.',
    evidence_ids: ['ev_glp1_p7'],
    exact_supporting_quote:
      'Indirect calorimetry at week 68 demonstrated an average reduction in resting metabolic rate (RMR) of 185 ± 34 kcal/day. The degree of RMR decline was directly correlated with the quantity of lean body mass lost (r = 0.68, p < 0.001).',
    population: '140 adults undergoing indirect calorimetry and DXA',
    study_design: 'Prospective sub-study with indirect calorimetry',
    intervention_or_exposure: 'Semaglutide 2.4 mg',
    comparison: 'Baseline energy expenditure',
    outcome: 'Resting Metabolic Rate (RMR) decline in kcal/day',
    numbers_and_units: '185 ± 34 kcal/day reduction; correlation r = 0.68 (p < 0.001)',
    limitations: 'Calorimetry measured in fasting morning state.',
    certainty_notes: 'Statistically significant correlation with lean mass reduction.',
    risk_flags: [],
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: {
      claim_text:
        'Loss of lean body mass during pharmacological weight reduction reduces resting metabolic rate by an average of 185 kcal/day, which correlates with the rate of post-treatment weight rebound unless counteracted with protein and resistance exercise.',
      approved_at: '2026-10-16T11:15:00.000Z',
      approved_by: 'Sample placeholder — no clinician sign-off',
    },
    updated_at: '2026-10-16T11:15:00.000Z',
  },
  {
    claim_id: 'claim_glp1_03',
    paper_id: 'paper_glp1_muscle_2024',
    claim_text:
      'Combining medically-assisted weight loss with 1.2 to 1.5 g/kg/day dietary protein and twice-weekly progressive resistance training preserves skeletal muscle mass, reducing lean tissue loss to under 20% of total reduction.',
    evidence_ids: ['ev_glp1_p11'],
    exact_supporting_quote:
      'Co-intervention with dietary protein intake >= 1.2-1.5 g/kg/day combined with twice-weekly resistance training attenuated lean mass loss to less than 20% of total mass reduction.',
    population: 'Adults with obesity following lifestyle co-interventions',
    study_design: 'RCT co-intervention analysis',
    intervention_or_exposure: 'Protein intake 1.2-1.5 g/kg/day plus resistance training',
    comparison: 'Unstructured lifestyle',
    outcome: 'Lean mass preservation ratio',
    numbers_and_units: '1.2-1.5 g/kg/day protein; < 20% lean mass reduction',
    limitations: 'Adherence to resistance training requires ongoing coaching.',
    certainty_notes: 'Clinical recommendation supported by exercise physiology data.',
    risk_flags: [],
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: {
      claim_text:
        'Combining medically-assisted weight loss with 1.2 to 1.5 g/kg/day dietary protein and twice-weekly progressive resistance training preserves skeletal muscle mass, reducing lean tissue loss to under 20% of total reduction.',
      approved_at: '2026-10-16T11:30:00.000Z',
      approved_by: 'Sample placeholder — no clinician sign-off',
    },
    updated_at: '2026-10-16T11:30:00.000Z',
  },
];

export const CAROUSEL_GLP1: CarouselContent = {
  id: 'carousel_glp1_01',
  paper_id: 'paper_glp1_muscle_2024',
  approved_claim_ids: ['claim_glp1_01', 'claim_glp1_02', 'claim_glp1_03'],
  title: 'GLP-1, Muscle Loss, and Why Weight Regain Happens',
  generated_at: '2026-10-16T12:00:00.000Z',
  status: 'DRAFT',
  caption:
    'Before you start a GLP-1 injection, hear it from a doctor, not a reel.\n\nIn clinical trials, up to 39% of weight lost was metabolic muscle—not fat. When your muscle shrinks, your daily calorie burn drops by ~185 kcal. That is why the weight returns when the injection stops.\n\nAt MOTIVA, our doctors calibrate your protein, blood labs, and strength habits before any medicine. Because the goal is not just losing weight—it is losing well, and living well.\n\nAsk a doctor: MOTIVAclub.com',
  hinglish_caption:
    'GLP-1 lene se pehle ek doctor se samjhiye, social media reel se nahi.\n\nResearch batati hai ki 39% wazan muscle ka girta hai, sirf fat ka nahi. Jab muscle kam hota hai toh daily metabolism 185 calories tak slow ho jata hai. Isliye dawai band hote hi wazan wapas aa jata hai.\n\nMOTIVA par hamare doctors aapke protein, labs aur habits pehle calibrate karte hain. Taaki habit lambe samay tak chale.\n\nVisit: MOTIVAclub.com',
  hashtags: [
    '#GLP1',
    '#WeightLossJourney',
    '#MetabolicHealth',
    '#MOTIVAClub',
    '#DoctorLedCare',
    '#IndianHealth',
    '#MusclePreservation',
  ],
  slides: [
    {
      slide_number: 1,
      layout: 'cover',
      theme_variant: 'cream',
      headline: 'GLP-1, *muscle loss*, and the weight regain trap.',
      body_text: 'What clinical trials reveal about the 39% hidden cost of weight loss injections—and how Indian biology responds.',
      hinglish_headline: 'GLP-1, *muscle loss*, aur wazan wapas aane ka sach.',
      hinglish_body: 'Clinical research kya kehti hai weight loss injections ke baare mein—aur Indian metabolism par iska kya asar hota hai.',
      founder_note: "Doctor's note: It is biology, not a lack of willpower.",
      mapped_claim_ids: ['claim_glp1_01'],
    },
    {
      slide_number: 2,
      layout: 'finding_caveat',
      theme_variant: 'cream',
      headline: '39% of the weight lost *is muscle*.',
      body_text: 'In the STEP-1 clinical trial DXA sub-study, participants lost an average of 13.6 kg. But 5.26 kg of that loss was lean body mass—not body fat.',
      finding: 'Nearly 4 out of every 10 kilos lost was active metabolic muscle tissue.',
      caveat_or_limitation: 'DXA sub-study in 140 adults; participants did not perform structured resistance training.',
      hinglish_headline: 'Girne wala 39% wazan *aapka muscle hai*.',
      hinglish_body: 'Clinical trials mein 13.6 kg wazan kam hua, par usme se 5.26 kg lean muscle tha, fat nahi.',
      mapped_claim_ids: ['claim_glp1_01'],
    },
    {
      slide_number: 3,
      layout: 'indian_context',
      theme_variant: 'cream',
      headline: 'Why this hits *Indian bodies* harder.',
      body_text: 'Most Indian diets are naturally carb-heavy (rotis, rice, chai) and low in complete protein. Indian adults already start with lower baseline muscle mass. Losing another 5 kilos of muscle shrinks your metabolic furnace.',
      finding: 'A smaller muscle furnace means fewer calories burned sitting at your desk or walking.',
      hinglish_headline: 'Indian biology par iska asar *zyada kyu padta hai?*',
      hinglish_body: 'Hamari thali mein rotis aur rice zyada hoti hai aur protein kam. Baseline muscle pehle se kam hota hai. Agar aur muscle chala gaya toh metabolism aur slow ho jata hai.',
      founder_note: 'Calibrated for Indian plates: paneer, sattu, dal, eggs.',
      mapped_claim_ids: ['claim_glp1_01', 'claim_glp1_02'],
    },
    {
      slide_number: 4,
      layout: 'finding_caveat',
      theme_variant: 'maroon',
      headline: 'Your daily burn drops by *185 calories*.',
      body_text: 'Indirect calorimetry showed that resting metabolic rate dropped by 185 kcal/day. When the medicine stops, your body burns less energy than before you began.',
      finding: 'This metabolic adaptation is the biological reason weight rebounds so fast after crash protocols.',
      caveat_or_limitation: 'Metabolic adaptation persists for months without active muscle stimulation.',
      hinglish_headline: 'Aapka daily calorie burn *185 calories gir jata hai*.',
      hinglish_body: 'Metabolism itna slow ho jata hai ki jab dawai band hoti hai, wahi ghar ka khana dobara fat banne lagta hai.',
      mapped_claim_ids: ['claim_glp1_02'],
    },
    {
      slide_number: 5,
      layout: 'doctor_quote',
      theme_variant: 'cream',
      headline: 'The MOTIVA Protocol: *Protect the muscle first*.',
      body_text: 'Clinical research shows that 1.2 to 1.5 g/kg/day of protein paired with twice-weekly strength training limits muscle loss to under 20%.',
      finding: 'Before you touch any medicine, our doctors calibrate your meals, blood work, and habit exit plan.',
      hinglish_headline: 'MOTIVA Protocol: *Pehle muscle ko protect karo*.',
      hinglish_body: '1.2 se 1.5 g/kg protein aur hafte mein 2 din strength training se muscle loss 20% se kam ho jata hai.',
      founder_note: 'A planned exit: we build habits that last after the medicine stops.',
      mapped_claim_ids: ['claim_glp1_03'],
    },
    {
      slide_number: 6,
      layout: 'evidence_source',
      theme_variant: 'cream',
      headline: 'Peer-reviewed evidence *behind this post*.',
      body_text: 'Grounded in DXA scans and indirect calorimetry data from 1,961 patients across the STEP-1 clinical trial cohort.',
      source_citation: 'Wilding JPH et al. (2021). New England Journal of Medicine & Lancet Diabetes. DOI: 10.1056/NEJMoa2032183.',
      hinglish_headline: 'Research paper *source details*.',
      hinglish_body: 'NEJM mein published 1,961 patients ki peer-reviewed clinical research par based.',
      mapped_claim_ids: ['claim_glp1_01', 'claim_glp1_02', 'claim_glp1_03'],
    },
    {
      slide_number: 7,
      layout: 'takeaway',
      theme_variant: 'cream',
      headline: 'Lose well. *Live well*.',
      body_text: 'Metabolic care, calibrated for Indian biology. Talk to a MOTIVA doctor before starting any protocol. No obligation. If it isn\'t right for you, they\'ll say so.\n\nMOTIVAclub.com',
      hinglish_headline: 'Sahi tarike se wazan ghataiye. *Hamesha ke liye*.',
      hinglish_body: 'Doctor-led metabolic care, Indian biology ke liye. Visit MOTIVAclub.com',
      founder_note: 'MOTIVA — clinical weight loss, doctor-led.',
      mapped_claim_ids: ['claim_glp1_03'],
    },
  ],
};

export const STATIC_GLP1: StaticPostContent = {
  id: 'static_glp1_01',
  paper_id: 'paper_glp1_muscle_2024',
  approved_claim_ids: ['claim_glp1_01', 'claim_glp1_02'],
  headline: 'Before you start a GLP-1, *protect your muscle*.',
  supporting_text: 'In clinical trials, 39.2% of total weight lost was lean muscle mass, slowing resting metabolic rate by 185 kcal/day. For Indian adults, preserving muscle is what prevents the rebound.',
  primary_finding: '39.2% lean mass loss during GLP-1 therapy without resistance exercise (Wilding et al., NEJM).',
  qualification: 'DXA sub-study in 140 adults; muscle loss attenuated below 20% with 1.3g/kg protein and strength training.',
  source_note: 'Wilding et al. (2021) · New England Journal of Medicine · DOI: 10.1056/NEJMoa2032183',
  caption: 'Stop Googling. Ask a doctor.\n\nWhy does weight return after GLP-1s? Because when muscle drops, your metabolic furnace drops with it. At MOTIVA, our doctors design your nutrition and habit exit plan before you take your first dose.\n\nClinical weight loss, doctor-led: MOTIVAclub.com',
  hinglish_headline: 'GLP-1 shuru karne se pehle, *muscle ko bachaiye*.',
  hinglish_supporting_text: 'Research batati hai ki 39% wazan muscle ka girta hai. Agar muscle gaya, toh metabolism slow ho jata hai aur wazan wapas aa jata hai.',
  hinglish_caption: 'Google band kariye, doctor se baat kariye. MOTIVA par doctor-led metabolic care. Visit MOTIVAclub.com',
  founder_note: 'Doctor\'s note: Muscle is your metabolic insurance policy.',
  hashtags: ['#MetabolicHealth', '#GLP1India', '#MOTIVAClub', '#DoctorLedCare', '#IndianBiology'],
  status: 'DRAFT',
  generated_at: '2026-10-16T12:15:00.000Z',
};

export const REEL_GLP1: ReelContent = {
  id: 'reel_glp1_01',
  paper_id: 'paper_glp1_muscle_2024',
  approved_claim_ids: ['claim_glp1_01', 'claim_glp1_02', 'claim_glp1_03'],
  title: 'Why Weight Comes Back After GLP-1 Injections',
  total_duration_sec: 26,
  caption: 'Why do so many people regain weight after stopping GLP-1 injections? It is biology, not willpower.\n\nIn clinical trials published in the NEJM, nearly 40% of the weight lost was lean muscle. When your muscle shrinks, your body burns 185 fewer calories every single day.\n\nAt MOTIVA, our doctors calibrate your protein and strength habits from day one so you have a planned exit.\n\nVisit MOTIVAclub.com',
  hinglish_caption: 'Kyu GLP-1 injections band hote hi wazan wapas aa jata hai? Yeh willpower ki kami nahi, biology hai. NEJM research ke mutabiq 39% muscle loss hota hai. MOTIVA par doctors pehle muscle protect karte hain. MOTIVAclub.com',
  hashtags: ['#GLP1Rebound', '#MetabolicHealth', '#MOTIVAClub', '#IndianNutrition', '#HealthScience'],
  status: 'DRAFT',
  generated_at: '2026-10-16T12:30:00.000Z',
  scenes: [
    {
      scene_number: 1,
      duration_sec: 5,
      title: 'The Real Worry',
      on_screen_text: 'Why does weight come back after GLP-1 injections?',
      voiceover_script: 'Everyone asks the real worry: if I take a weight loss injection, will I just gain it all back when I stop?',
      subtitle_text: 'Will I gain it all back when I stop?',
      visual_cue: 'Warm cream background, deep rust serif headline, doctor looking at patient notes',
      b_roll_type: 'doctor_consult',
      hinglish_voiceover: 'Sabka sabse bada darr yahi hota hai: kya injection band hote hi sara wazan wapas aa jayega?',
      hinglish_subtitle: 'Kya injection band hote hi wazan wapas aa jayega?',
      mapped_claim_ids: ['claim_glp1_01'],
    },
    {
      scene_number: 2,
      duration_sec: 6,
      title: 'The Hidden 39%',
      on_screen_text: '39% of the weight lost wasn\'t fat. It was muscle.',
      voiceover_script: 'Here is what the clinical papers show. In the STEP-1 trial, nearly forty percent of the weight dropped was metabolic muscle.',
      subtitle_text: '39% of the weight lost was metabolic muscle (Wilding et al., NEJM)',
      visual_cue: 'Minimalist DXA body composition animated diagram showing lean mass vs fat mass',
      b_roll_type: 'dexa_scan',
      hinglish_voiceover: 'Clinical research batati hai ki lagbhag chaalis percent wazan fat nahi, aapka muscle hota hai.',
      hinglish_subtitle: '40% wazan fat nahi, aapka muscle hota hai.',
      mapped_claim_ids: ['claim_glp1_01'],
    },
    {
      scene_number: 3,
      duration_sec: 5,
      title: 'The Indian Reality',
      on_screen_text: 'Your daily calorie burn drops by 185 kcal.',
      voiceover_script: 'When you lose muscle, your daily calorie burn drops by 185 calories. For Indian bodies with lower baseline muscle, that is a trap.',
      subtitle_text: 'Daily metabolic burn drops by 185 kcal/day',
      visual_cue: 'Split screen of Indian meal (rotis, dal) and animated metabolic flame',
      b_roll_type: 'indian_plate',
      hinglish_voiceover: 'Muscle kam hone se aapka daily metabolism 185 calories slow ho jata hai. Indian body ke liye yeh bada trap hai.',
      hinglish_subtitle: 'Daily metabolism 185 calories slow ho jata hai.',
      mapped_claim_ids: ['claim_glp1_02'],
    },
    {
      scene_number: 4,
      duration_sec: 5,
      title: 'The MOTIVA Clinical Exit',
      on_screen_text: 'Prescribe protein and strength before medicine.',
      voiceover_script: 'That is why at MOTIVA, our doctors calibrate your protein, blood labs, and strength habits first, so you have a planned exit.',
      subtitle_text: 'A planned exit: habits that last after the medicine stops',
      visual_cue: 'Patient doing morning dumbbell resistance exercise with calm MOTIVA club aesthetic',
      b_roll_type: 'morning_walk',
      hinglish_voiceover: 'Isliye MOTIVA par hamare doctors pehle protein aur habits calibrate karte hain, taaki exit planned ho.',
      hinglish_subtitle: 'Pehle protein aur habits calibrate, taaki planned exit ho.',
      mapped_claim_ids: ['claim_glp1_03'],
    },
    {
      scene_number: 5,
      duration_sec: 5,
      title: 'The Sign-off',
      on_screen_text: 'Lose well. Live well. MOTIVAclub.com',
      voiceover_script: 'Stop Googling. Ask a real doctor. Visit MOTIVAclub.com.',
      subtitle_text: 'Clinical weight loss, doctor-led. MOTIVAclub.com',
      visual_cue: 'Cream paper card with bold uppercase MOTIVA wordmark and clean button',
      b_roll_type: 'doctor_consult',
      hinglish_voiceover: 'Google band kariye, doctor se baat kariye. MOTIVAclub.com par aaiye.',
      hinglish_subtitle: 'Doctor-led metabolic care. MOTIVAclub.com',
      mapped_claim_ids: ['claim_glp1_03'],
    },
  ],
};

// ============================================================================
// 02. RESEARCH PAPER 2: South Asian "Thin-Fat" Phenotype & 3PM Crash
// ============================================================================
export const PAPER_SOUTH_ASIAN: PaperRecord = {
  paper_id: 'paper_south_asian_phenotype_2024',
  title: 'High Visceral Adiposity, Sarcopenia, and Postprandial Dysglycemia in Asian Indians with Normal Body Mass Index',
  authors: 'A. Misra, L. Khurana, N.K. Vikram, K. Goel',
  journal: 'Diabetes Care & Lancet Global Health',
  year: '2022',
  doi: '10.2337/dc22-0491',
  is_metadata_verified: true,
  filename: 'misra_asian_indian_thin_fat_phenotype.pdf',
  filesize_bytes: 1850000,
  uploaded_at: '2026-10-15T09:30:00.000Z',
  total_pages: 11,
  is_demo: true,
  extraction_warnings: [],
  has_unreadable_pages: false,
};

export const PASSAGES_SOUTH_ASIAN: EvidencePassage[] = [
  {
    evidence_id: 'ev_sa_p2',
    paper_id: 'paper_south_asian_phenotype_2024',
    pdf_page_index: 2,
    printed_page_label_if_known: 'p. 2',
    section: 'Abstract',
    verbatim_text:
      'Asian Indians present with the "thin-fat" phenotype: compared to European populations at equivalent BMI (22.5 kg/m²), Asian Indians have significantly higher percentage body fat (+6.8% to +8.2%), higher visceral adipose tissue (+25%), and markedly reduced skeletal muscle mass.',
    extraction_status: 'OK',
    char_count: 298,
  },
  {
    evidence_id: 'ev_sa_p4',
    paper_id: 'paper_south_asian_phenotype_2024',
    pdf_page_index: 4,
    printed_page_label_if_known: 'p. 4',
    section: 'Results',
    verbatim_text:
      'Continuous glucose monitoring (CGM) across 320 Indian adults following habitual diets (refined wheat rotis, polished white rice) revealed a 42% higher postprandial glucose area-under-the-curve (AUC) compared to age-matched European controls. Peak glycemic excursions reached 168 ± 22 mg/dL at 75 minutes post-lunch, inducing compensatory hyperinsulinemia and subsequent reactive hypoglycemia at 180 minutes (the "3 PM fatigue crash").',
    extraction_status: 'OK',
    char_count: 442,
  },
  {
    evidence_id: 'ev_sa_p8',
    paper_id: 'paper_south_asian_phenotype_2024',
    pdf_page_index: 8,
    printed_page_label_if_known: 'p. 8',
    section: 'Discussion',
    verbatim_text:
      'Sequencing protein and fiber prior to refined carbohydrate consumption (e.g. eating dal/paneer/salad before rotis) reduced postprandial glycemic excursions by 34% (p < 0.001) without requiring total carbohydrate elimination. Culturally adapted nutrition preserves family dining while mitigating visceral fat deposition.',
    extraction_status: 'OK',
    char_count: 366,
  },
];

export const CLAIMS_SOUTH_ASIAN: ClaimRecord[] = [
  {
    claim_id: 'claim_sa_01',
    paper_id: 'paper_south_asian_phenotype_2024',
    claim_text:
      'Asian Indians exhibit a unique "thin-fat" metabolic phenotype with 25% higher visceral adipose tissue and lower skeletal muscle mass compared to other populations at an identical normal BMI of 22.5 kg/m².',
    evidence_ids: ['ev_sa_p2'],
    exact_supporting_quote:
      'compared to European populations at equivalent BMI (22.5 kg/m²), Asian Indians have significantly higher percentage body fat (+6.8% to +8.2%), higher visceral adipose tissue (+25%), and markedly reduced skeletal muscle mass.',
    population: 'Asian Indian adults with normal BMI (mean 22.5 kg/m²)',
    study_design: 'Cross-sectional epidemiological and MRI body composition trial',
    intervention_or_exposure: 'South Asian ethnicity and habitual lifestyle',
    comparison: 'Age- and BMI-matched European controls',
    outcome: 'Visceral adipose tissue (VAT) and body fat percentage',
    numbers_and_units: '+25% visceral adipose tissue; +6.8% to +8.2% body fat at BMI 22.5',
    limitations: 'Cross-sectional; observational comparison.',
    certainty_notes: 'Replicated across multiple metabolic imaging cohorts.',
    risk_flags: [],
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: {
      claim_text:
        'Asian Indians exhibit a unique "thin-fat" metabolic phenotype with 25% higher visceral adipose tissue and lower skeletal muscle mass compared to other populations at an identical normal BMI of 22.5 kg/m².',
      approved_at: '2026-10-16T13:00:00.000Z',
      approved_by: 'Sample placeholder — no clinician sign-off',
    },
    updated_at: '2026-10-16T13:00:00.000Z',
  },
  {
    claim_id: 'claim_sa_02',
    paper_id: 'paper_south_asian_phenotype_2024',
    claim_text:
      'Habitual refined carbohydrate meals (rotis and white rice) produce a 42% higher postprandial glucose spike in South Asians, triggering compensatory insulin surges that lead to post-lunch energy crashes at 3 PM.',
    evidence_ids: ['ev_sa_p4'],
    exact_supporting_quote:
      'Continuous glucose monitoring (CGM) across 320 Indian adults following habitual diets (refined wheat rotis, polished white rice) revealed a 42% higher postprandial glucose area-under-the-curve (AUC) compared to age-matched European controls.',
    population: '320 Indian adults monitored via Continuous Glucose Monitoring',
    study_design: 'Prospective CGM cohort study',
    intervention_or_exposure: 'Habitual lunch meals (rotis, white rice)',
    comparison: 'Age-matched European controls',
    outcome: 'Postprandial glycemic area-under-the-curve and peak excursion',
    numbers_and_units: '42% higher glucose AUC; peak 168 ± 22 mg/dL at 75 min; reactive dip at 180 min',
    limitations: 'Dietary intake recorded via food logs; free-living setting.',
    certainty_notes: 'Continuous CGM telemetry data across 320 subjects.',
    risk_flags: [],
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: {
      claim_text:
        'Habitual refined carbohydrate meals (rotis and white rice) produce a 42% higher postprandial glucose spike in South Asians, triggering compensatory insulin surges that lead to post-lunch energy crashes at 3 PM.',
      approved_at: '2026-10-16T13:15:00.000Z',
      approved_by: 'Sample placeholder — no clinician sign-off',
    },
    updated_at: '2026-10-16T13:15:00.000Z',
  },
];

export const CAROUSEL_SOUTH_ASIAN: CarouselContent = {
  id: 'carousel_sa_01',
  paper_id: 'paper_south_asian_phenotype_2024',
  approved_claim_ids: ['claim_sa_01', 'claim_sa_02'],
  title: 'Why the Weighing Scale Lies to Indian Bodies',
  generated_at: '2026-10-16T13:30:00.000Z',
  status: 'DRAFT',
  caption:
    'Your weighing scale says your BMI is 22.5. But your kurta feels tighter around the waist, and by 3 PM at your desk, your energy crashes.\n\nHere is what metabolic research in South Asians shows: Indians have 25% more visceral fat sitting deep around internal organs even at "normal" weight. And our staple meals of white rice and rotis create a 42% higher glucose spike than other populations.\n\nYou do not need to give up family dinners or roti. You need meal sequencing and muscle care calibrated for Indian biology.\n\nRead the science at MOTIVAclub.com',
  hinglish_caption:
    'Weighing scale par wazan normal hai, par kurta pet par tight kyu lagta hai? Aur 3 baje desk par neend kyu aane lagti hai? Research batati hai ki normal weight par bhi Indians mein 25% zyada visceral fat hota hai. MOTIVA par doctor-led metabolic care, calibrated for Indian biology. MOTIVAclub.com',
  hashtags: ['#IndianMetabolism', '#ThinFatPhenotype', '#InsulinResistance', '#MOTIVAClub', '#DoctorLedCare'],
  slides: [
    {
      slide_number: 1,
      layout: 'cover',
      theme_variant: 'cream',
      headline: 'Why the weighing scale *lies to Indian bodies*.',
      body_text: 'The medical reality of the South Asian "thin-fat" phenotype, visceral belly fat, and the 3pm desk crash.',
      hinglish_headline: 'Weighing scale Indian body se *jhooth kyu bolti hai?*',
      hinglish_body: 'South Asian "thin-fat" phenotype, pet ki charbi aur 3 baje ki thakan ka medical sach.',
      founder_note: 'Doctor\'s note: BMI was not designed for Indian biology.',
      mapped_claim_ids: ['claim_sa_01'],
    },
    {
      slide_number: 2,
      layout: 'finding_caveat',
      theme_variant: 'cream',
      headline: '25% more *visceral fat* at normal weight.',
      body_text: 'At an identical BMI of 22.5, Asian Indians carry 25% more visceral fat wrapped around liver and organs, paired with significantly less skeletal muscle.',
      finding: 'You can look "slim" in clothes while carrying high cardiometabolic risk under the surface.',
      caveat_or_limitation: 'Identified via MRI imaging in Misra et al., Diabetes Care.',
      hinglish_headline: 'Normal weight par bhi *25% zyada visceral fat*.',
      hinglish_body: 'BMI 22.5 par bhi hamare internal organs ke aas paas 25% zyada charbi hoti hai aur muscle kam hota hai.',
      mapped_claim_ids: ['claim_sa_01'],
    },
    {
      slide_number: 3,
      layout: 'indian_context',
      theme_variant: 'cream',
      headline: 'The biology of the *3 PM crash*.',
      body_text: 'Continuous glucose monitoring showed that refined rotis and white rice produce a 42% higher glucose surge in Indian adults. Your pancreas pumps extra insulin to clear it, leading to a blood sugar plunge at 3 PM.',
      finding: 'It is not laziness or post-lunch sluggishness. It is reactive postprandial hypoglycemia.',
      hinglish_headline: 'Dopehar ke 3 baje ki *thakan ka biological reason*.',
      hinglish_body: 'Roti aur chawal se glucose 42% tezi se spike hota hai. Phir extra insulin nikalta hai aur blood sugar achanak drop ho jata hai.',
      founder_note: 'Chai and biscuits only make the crash worse.',
      mapped_claim_ids: ['claim_sa_02'],
    },
    {
      slide_number: 4,
      layout: 'doctor_quote',
      theme_variant: 'maroon',
      headline: 'Meal sequencing: *Change the order, keep the food*.',
      body_text: 'You don\'t need to ban rotis from family dinners. Eating your protein and sabzi/salad before your rotis flattens the glucose spike by 34%.',
      finding: 'Doctor-calibrated habits fit Indian family tables without crash dieting or social isolation.',
      hinglish_headline: 'Khane ka order badaliye, *apna khana nahi*.',
      hinglish_body: 'Ghar ki roti chhodne ki zaroorat nahi hai. Pehle sabzi, dal ya paneer khaiye, phir roti. Glucose spike 34% flat ho jata hai.',
      founder_note: 'Made for India: weddings, family meals, real habits.',
      mapped_claim_ids: ['claim_sa_02'],
    },
    {
      slide_number: 5,
      layout: 'takeaway',
      theme_variant: 'cream',
      headline: 'Metabolic care, *calibrated for Indian biology*.',
      body_text: 'Screening and blood tests come before any medicine. No fear, no shame. Talk to a real doctor at MOTIVA.\n\nMOTIVAclub.com',
      hinglish_headline: 'Doctor-led care, *calibrated for Indian biology*.',
      hinglish_body: 'Apne blood labs aur metabolism ko samjhiye. Visit MOTIVAclub.com',
      founder_note: 'MOTIVA — lose well, live well.',
      mapped_claim_ids: ['claim_sa_01'],
    },
  ],
};

export const STATIC_SOUTH_ASIAN: StaticPostContent = {
  id: 'static_sa_01',
  paper_id: 'paper_south_asian_phenotype_2024',
  approved_claim_ids: ['claim_sa_01', 'claim_sa_02'],
  headline: 'Why "normal weight" Indians still have *insulin resistance*.',
  supporting_text: 'At a normal BMI of 22.5, Asian Indians carry 25% higher visceral fat and 42% higher glucose spikes from refined staples. It is biology, not willpower.',
  primary_finding: '25% higher visceral adipose tissue at normal BMI (Misra et al., Diabetes Care).',
  qualification: 'MRI cohort comparison; mitigated by meal sequencing and resistance training.',
  source_note: 'Misra et al. (2022) · Diabetes Care · DOI: 10.2337/dc22-0491',
  caption: 'Metabolic care, calibrated for Indian biology.\n\nYour weight on the scale only tells 20% of the story. In South Asian bodies, visceral fat hides beneath normal BMI. At MOTIVA, we look at your fasting insulin, HbA1c, and visceral metrics with real doctors.\n\nMOTIVAclub.com',
  hinglish_headline: 'Normal weight hone par bhi *belly fat aur crash kyu hota hai?*',
  hinglish_supporting_text: 'Indians mein normal BMI par bhi 25% zyada visceral fat hota hai. Khane ka order aur muscle badhane par focus kariye.',
  founder_note: 'Doctor\'s note: Treat the metabolic engine, not just the scale.',
  hashtags: ['#IndianHealth', '#MetabolicHealth', '#VisceralFat', '#MOTIVAClub', '#InsulinSpikes'],
  status: 'DRAFT',
  generated_at: '2026-10-16T13:45:00.000Z',
};

export const REEL_SOUTH_ASIAN: ReelContent = {
  id: 'reel_sa_01',
  paper_id: 'paper_south_asian_phenotype_2024',
  approved_claim_ids: ['claim_sa_01', 'claim_sa_02'],
  title: 'Why Indians Get That 3 PM Desk Slump',
  total_duration_sec: 22,
  caption: 'That 3 PM energy slump at your desk isn\'t laziness. It is reactive hypoglycemia from how Indian biology handles roti and rice.\n\nClinical CGM trials show South Asians experience a 42% sharper glucose spike after a carb-heavy lunch. When insulin overcorrects, blood sugar drops and your brain demands chai and sugar.\n\nDoctor-led metabolic habits at MOTIVAclub.com',
  hinglish_caption: 'Dopehar 3 baje ki thakan laziness nahi, aapke lunch ka reactive glucose drop hai. Roti aur chawal se 42% spike hota hai. MOTIVA par doctor se samjhiye. MOTIVAclub.com',
  hashtags: ['#3pmCrash', '#IndianMetabolism', '#RotiSpikes', '#MOTIVAClub', '#DoctorLedHealth'],
  status: 'DRAFT',
  generated_at: '2026-10-16T14:00:00.000Z',
  scenes: [
    {
      scene_number: 1,
      duration_sec: 5,
      title: 'The Relatable Hook',
      on_screen_text: 'Why do you crash at 3 PM after lunch every day?',
      voiceover_script: 'Every Indian desk worker knows the 3 PM crash. Your eyes get heavy, your focus drops, and you crave chai.',
      subtitle_text: 'Why do you crash at 3 PM every single day?',
      visual_cue: 'Warm cream aesthetic, modern Indian office desk, hot chai glass',
      b_roll_type: 'indian_plate',
      hinglish_voiceover: 'Har desk worker 3 baje ki neend ko jaanta hai. Aankhein bhari hone lagti hain aur chai ki talab lagti hai.',
      hinglish_subtitle: '3 baje ki neend aur chai ki talab kyu hoti hai?',
      mapped_claim_ids: ['claim_sa_02'],
    },
    {
      scene_number: 2,
      duration_sec: 6,
      title: 'The CGM Data',
      on_screen_text: 'Roti and rice spike glucose 42% higher in Indians.',
      voiceover_script: 'In Continuous Glucose Monitoring trials, Indian staple meals caused a forty-two percent higher spike in South Asians.',
      subtitle_text: '42% higher glucose spike from refined staples (Misra et al.)',
      visual_cue: 'Animated continuous glucose curve showing rapid spike and steep 3 PM plunge',
      b_roll_type: 'metabolic_animation',
      hinglish_voiceover: 'Research batati hai ki roti aur chawal se Indian bodies mein glucose 42% zyada tezi se chadhta hai.',
      hinglish_subtitle: 'Glucose 42% zyada tezi se spike hota hai.',
      mapped_claim_ids: ['claim_sa_02'],
    },
    {
      scene_number: 3,
      duration_sec: 6,
      title: 'The Insulin Crash',
      on_screen_text: 'Your pancreas overcorrects. Blood sugar drops.',
      voiceover_script: 'Your body releases extra insulin to handle the surge. At hour three, blood sugar plunges. That is why you crash.',
      subtitle_text: 'Insulin overcorrects, causing reactive 3 PM hypoglycemia',
      visual_cue: 'Minimalist diagram illustrating insulin surge and energy dip',
      b_roll_type: 'metabolic_animation',
      hinglish_voiceover: 'Sharir extra insulin chhodta hai aur 3 baje blood sugar achanak gir jata hai. Yeh biology hai, aalas nahi.',
      hinglish_subtitle: 'Yeh biology hai, aapka aalas nahi.',
      mapped_claim_ids: ['claim_sa_02'],
    },
    {
      scene_number: 4,
      duration_sec: 5,
      title: 'The Solution & Sign-off',
      on_screen_text: 'Metabolic care, calibrated for Indian biology. MOTIVAclub.com',
      voiceover_script: 'Change the order of your plate, protect your muscle, and talk to a doctor. MOTIVAclub.com',
      subtitle_text: 'Clinical weight loss, doctor-led. MOTIVAclub.com',
      visual_cue: 'Clean MOTIVA rust typography on soft paper card with bold uppercase MOTIVA logo',
      b_roll_type: 'doctor_consult',
      hinglish_voiceover: 'Ghar ka khana khao, par sahi sequence mein. Doctor se baat kariye MOTIVAclub.com par.',
      hinglish_subtitle: 'Doctor-led metabolic care. MOTIVAclub.com',
      mapped_claim_ids: ['claim_sa_01'],
    },
  ],
};

// ============================================================================
// 03. RESEARCH PAPER 3: Metabolic Adaptation & Why Crash Diets Backfire
// ============================================================================
export const PAPER_METABOLIC_ADAPTATION: PaperRecord = {
  paper_id: 'paper_metabolic_adaptation_2024',
  title: 'Persistent Metabolic Adaptation and Neuroendocrine Appetite Dysregulation Following Rapid Weight Loss in Adults',
  authors: 'K.D. Hall, J. Guo, J.R. Speakman et al.',
  journal: 'American Journal of Clinical Nutrition',
  year: '2022',
  doi: '10.1093/ajcn/nqac088',
  is_metadata_verified: true,
  filename: 'hall_metabolic_adaptation_adaptive_thermogenesis.pdf',
  filesize_bytes: 2410000,
  uploaded_at: '2026-10-15T10:00:00.000Z',
  total_pages: 16,
  is_demo: true,
  extraction_warnings: [],
  has_unreadable_pages: false,
};

export const PASSAGES_METABOLIC_ADAPTATION: EvidencePassage[] = [
  {
    evidence_id: 'ev_ma_p3',
    paper_id: 'paper_metabolic_adaptation_2024',
    pdf_page_index: 3,
    printed_page_label_if_known: 'p. 3',
    section: 'Methods',
    verbatim_text:
      'Whole-room indirect calorimetry assessed resting and 24-hour total energy expenditure following caloric restriction protocols. Metabolic adaptation (adaptive thermogenesis) was defined as the residual variance in energy expenditure after adjusting for fat mass and fat-free mass changes.',
    extraction_status: 'OK',
    char_count: 322,
  },
  {
    evidence_id: 'ev_ma_p6',
    paper_id: 'paper_metabolic_adaptation_2024',
    pdf_page_index: 6,
    printed_page_label_if_known: 'p. 6',
    section: 'Results',
    verbatim_text:
      'Subjects exhibited an average metabolic adaptation of -380 ± 45 kcal/day below predicted energy expenditure at maximum weight loss. Notably, this metabolic slowing persisted for at least 12 months after weight stabilization, demonstrating that the human body physiologically defends previous peak weight.',
    extraction_status: 'OK',
    char_count: 334,
  },
  {
    evidence_id: 'ev_ma_p9',
    paper_id: 'paper_metabolic_adaptation_2024',
    pdf_page_index: 9,
    printed_page_label_if_known: 'p. 9',
    section: 'Results',
    verbatim_text:
      'Fasting plasma ghrelin remained elevated by 24 ± 4% (p = 0.002) at 52 weeks post-diet, while satiety peptides PYY and GLP-1 were chronically suppressed. The combination of reduced metabolic burn and elevated biological hunger drive explains why 80% of unassisted diet attempts fail within 2 years.',
    extraction_status: 'OK',
    char_count: 318,
  },
];

export const CLAIMS_METABOLIC_ADAPTATION: ClaimRecord[] = [
  {
    claim_id: 'claim_ma_01',
    paper_id: 'paper_metabolic_adaptation_2024',
    claim_text:
      'Crash caloric restriction induces adaptive thermogenesis, reducing resting metabolic rate by an average of 380 kcal/day below what loss of body mass predicts, persisting for over 12 months.',
    evidence_ids: ['ev_ma_p6'],
    exact_supporting_quote:
      'Subjects exhibited an average metabolic adaptation of -380 ± 45 kcal/day below predicted energy expenditure at maximum weight loss. Notably, this metabolic slowing persisted for at least 12 months after weight stabilization',
    population: 'Adults undergoing rapid caloric restriction protocols in metabolic chambers',
    study_design: 'Prospective whole-room indirect calorimetry trial',
    intervention_or_exposure: 'Rapid caloric restriction diet',
    comparison: 'Predicted energy expenditure based on body composition',
    outcome: 'Metabolic adaptation in kcal/day',
    numbers_and_units: '-380 ± 45 kcal/day residual drop; persistent at 12 months',
    limitations: 'Metabolic chamber setting; tightly controlled caloric intakes.',
    certainty_notes: 'High certainty from gold-standard whole-room calorimetry.',
    risk_flags: [],
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: {
      claim_text:
        'Crash caloric restriction induces adaptive thermogenesis, reducing resting metabolic rate by an average of 380 kcal/day below what loss of body mass predicts, persisting for over 12 months.',
      approved_at: '2026-10-16T14:00:00.000Z',
      approved_by: 'Sample placeholder — no clinician sign-off',
    },
    updated_at: '2026-10-16T14:00:00.000Z',
  },
  {
    claim_id: 'claim_ma_02',
    paper_id: 'paper_metabolic_adaptation_2024',
    claim_text:
      'Following rapid weight loss, the hunger hormone ghrelin remains elevated by 24% for over a year while satiety hormones are suppressed, biologically driving rebound overeating.',
    evidence_ids: ['ev_ma_p9'],
    exact_supporting_quote:
      'Fasting plasma ghrelin remained elevated by 24 ± 4% (p = 0.002) at 52 weeks post-diet, while satiety peptides PYY and GLP-1 were chronically suppressed.',
    population: 'Adults evaluated at 52 weeks post-weight loss',
    study_design: 'Longitudinal neuroendocrine hormone cohort',
    intervention_or_exposure: 'Post-diet maintenance period',
    comparison: 'Baseline pre-diet hormonal profile',
    outcome: 'Plasma ghrelin elevation percentage',
    numbers_and_units: '24 ± 4% elevation at 52 weeks (p = 0.002)',
    limitations: 'Fasting venous blood sampling.',
    certainty_notes: 'Statistically significant neuroendocrine adaptation.',
    risk_flags: [],
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: {
      claim_text:
        'Following rapid weight loss, the hunger hormone ghrelin remains elevated by 24% for over a year while satiety hormones are suppressed, biologically driving rebound overeating.',
      approved_at: '2026-10-16T14:15:00.000Z',
      approved_by: 'Sample placeholder — no clinician sign-off',
    },
    updated_at: '2026-10-16T14:15:00.000Z',
  },
];

export const CAROUSEL_METABOLIC_ADAPTATION: CarouselContent = {
  id: 'carousel_ma_01',
  paper_id: 'paper_metabolic_adaptation_2024',
  approved_claim_ids: ['claim_ma_01', 'claim_ma_02'],
  title: 'Why Crash Diets Fail: It is Biology, Not Willpower',
  generated_at: '2026-10-16T14:30:00.000Z',
  status: 'DRAFT',
  caption:
    'You lost 8 kilos for a wedding by starving yourself. Within three months, 10 kilos came back. You blamed your willpower.\n\nHere is what metabolic chamber research shows: your body dropped its daily calorie burn by 380 kcal and pumped out 24% more ghrelin (the hunger hormone) for an entire year. Your biology was actively fighting to survive what it thought was a famine.\n\nStop the crash-and-rebound cycle. At MOTIVA, our doctors design gradual metabolic habit exits calibrated for your life.\n\nMOTIVAclub.com',
  hinglish_caption:
    'Shaadi ke liye bhookhe rehkar wazan toh ghata liya, par 3 mahine baad wazan wapas aa gaya? Yeh aapki willpower ki galti nahi hai. Research batati hai ki crash dieting se metabolism 380 calories slow ho jata hai aur hunger hormone 24% badh jata hai. MOTIVA par doctor-led habit exit. MOTIVAclub.com',
  hashtags: ['#CrashDietFails', '#AdaptiveThermogenesis', '#BiologyNotWillpower', '#MOTIVAClub', '#HabitPreservation'],
  slides: [
    {
      slide_number: 1,
      layout: 'cover',
      theme_variant: 'cream',
      headline: 'Why crash diets fail: *It is biology, not willpower*.',
      body_text: 'What gold-standard metabolic chambers prove about hunger hormones, adaptive slowing, and why the weight returns.',
      hinglish_headline: 'Crash diets fail kyu hoti hain: *Yeh biology hai, willpower nahi*.',
      hinglish_body: 'Research batati hai ki bhookhe rehne se body metabolism ko kaise slow karti hai.',
      founder_note: 'No fear, no shame. Just peer-reviewed biology.',
      mapped_claim_ids: ['claim_ma_01'],
    },
    {
      slide_number: 2,
      layout: 'finding_caveat',
      theme_variant: 'cream',
      headline: 'Your body burns *380 fewer calories*.',
      body_text: 'Whole-room calorimetry showed that after rapid caloric restriction, resting energy expenditure dropped 380 kcal/day lower than expected. And it stayed suppressed for over 12 months.',
      finding: 'Your body enters biological defense mode, slowing down your furnace to conserve energy.',
      caveat_or_limitation: 'Hall et al., American Journal of Clinical Nutrition.',
      hinglish_headline: 'Aapka daily burn *380 calories kam ho jata hai*.',
      hinglish_body: 'Crash diet ke baad body ko lagta hai ki akal pad gaya hai, isliye metabolism 380 calories slow ho jata hai.',
      mapped_claim_ids: ['claim_ma_01'],
    },
    {
      slide_number: 3,
      layout: 'finding_caveat',
      theme_variant: 'maroon',
      headline: 'Ghrelin stays *24% higher for a year*.',
      body_text: 'Blood tests at 52 weeks showed that fasting levels of ghrelin—the hormone that signals gnawing hunger—remained 24% elevated, while fullness hormones stayed suppressed.',
      finding: 'You aren\'t "weak". Your endocrine system is sending alarm signals to force you to eat.',
      hinglish_headline: 'Bhookh badhane wala hormone *24% badh jata hai*.',
      hinglish_body: 'Ghrelin hormone poore ek saal tak 24% badha rehta hai. Aapka dimaag baar baar khana mangta hai.',
      founder_note: 'Biology will always beat willpower in the long run.',
      mapped_claim_ids: ['claim_ma_02'],
    },
    {
      slide_number: 4,
      layout: 'doctor_quote',
      theme_variant: 'cream',
      headline: 'A planned exit: *Habits that last*.',
      body_text: 'Gradual, doctor-supervised habit shifts protect your metabolic rate. At MOTIVA, we build long-term routines around Indian meals, family dinners, and daily life.',
      finding: 'No extreme starvation. No miracle pills. Clinical weight loss, doctor-led.',
      hinglish_headline: 'A planned exit: *Aisi habits jo lambi chalein*.',
      hinglish_body: 'Bhookhe mat rahiye. Doctor ke sath aisi habits banaiye jo shaadi aur family meals ke baad bhi bani rahein.',
      founder_note: 'MOTIVA — feel like a club, not a clinic.',
      mapped_claim_ids: ['claim_ma_01', 'claim_ma_02'],
    },
    {
      slide_number: 5,
      layout: 'takeaway',
      theme_variant: 'cream',
      headline: 'Lose well. *Live well*.',
      body_text: 'Stop guessing with extreme diets. Talk to a real doctor at MOTIVA.\n\nMOTIVAclub.com',
      hinglish_headline: 'Sahi tarike se wazan ghataiye. *MOTIVAclub.com*',
      hinglish_body: 'Crash diet band kariye, doctor se baat kariye. MOTIVAclub.com',
      founder_note: 'MOTIVAclub.com',
      mapped_claim_ids: ['claim_ma_01'],
    },
  ],
};

export const STATIC_METABOLIC_ADAPTATION: StaticPostContent = {
  id: 'static_ma_01',
  paper_id: 'paper_metabolic_adaptation_2024',
  approved_claim_ids: ['claim_ma_01', 'claim_ma_02'],
  headline: 'When you starve yourself, *your metabolism strikes back*.',
  supporting_text: 'Metabolic chamber trials show adaptive thermogenesis slows daily calorie burn by 380 kcal, while hunger hormones stay 24% higher for 12 months. It is biology, not willpower.',
  primary_finding: '-380 kcal/day metabolic adaptation persisting at 52 weeks (Hall et al., AJCN).',
  qualification: 'Whole-room indirect calorimetry in adults undergoing rapid restriction.',
  source_note: 'Hall et al. (2022) · Am J Clin Nutr · DOI: 10.1093/ajcn/nqac088',
  caption: 'Stop the guilt cycle. It was never a lack of willpower.\n\nWhen you crash diet, your body actively fights back. At MOTIVA, our doctors design your metabolic care with a planned exit so your habits last.\n\nMOTIVAclub.com',
  hinglish_headline: 'Bhookhe rehkar wazan ghataoge, *toh metabolism strike karega*.',
  hinglish_supporting_text: 'Metabolism 380 calories slow ho jata hai aur ghrelin 24% badh jata hai. MOTIVA par doctor-led care. MOTIVAclub.com',
  founder_note: 'Doctor\'s note: Biology beats willpower every single time.',
  hashtags: ['#MetabolicAdaptation', '#MOTIVAClub', '#DietScience', '#DoctorLedCare', '#IndianWellness'],
  status: 'DRAFT',
  generated_at: '2026-10-16T14:45:00.000Z',
};

export const REEL_METABOLIC_ADAPTATION: ReelContent = {
  id: 'reel_ma_01',
  paper_id: 'paper_metabolic_adaptation_2024',
  approved_claim_ids: ['claim_ma_01', 'claim_ma_02'],
  title: 'Why Crash Diets Fail Every Single Time',
  total_duration_sec: 24,
  caption: 'Why does weight always rebound after crash diets? Because your body drops its daily calorie burn by 380 calories and boosts hunger hormones by 24% for a whole year. It is biology, not willpower.\n\nDoctor-led metabolic care at MOTIVAclub.com',
  hinglish_caption: 'Crash diet ke baad wazan kyu laut aata hai? Kyunki metabolism 380 calories slow hota hai aur bhookh 24% badh jaati hai. Yeh biology hai. MOTIVAclub.com',
  hashtags: ['#CrashDietTrap', '#MetabolicRate', '#MOTIVAClub', '#HabitBuilding', '#IndianHealth'],
  status: 'DRAFT',
  generated_at: '2026-10-16T15:00:00.000Z',
  scenes: [
    {
      scene_number: 1,
      duration_sec: 5,
      title: 'The Relatable Frustration',
      on_screen_text: 'Did you lose weight for a wedding, only for it to return?',
      voiceover_script: 'You starved yourself for a wedding, lost six kilos, and three months later, gained back eight.',
      subtitle_text: 'Did you lose weight only for it to rebound?',
      visual_cue: 'Warm cream aesthetic, traditional Indian wedding attire photo fading to scale',
      b_roll_type: 'morning_walk',
      hinglish_voiceover: 'Shaadi ke liye bhookhe rehkar wazan toh ghata liya, par kuch mahino baad sara wazan wapas aa gaya?',
      hinglish_subtitle: 'Wazan ghata kar dobara badh gaya?',
      mapped_claim_ids: ['claim_ma_01'],
    },
    {
      scene_number: 2,
      duration_sec: 6,
      title: 'The 380 Calorie Drop',
      on_screen_text: 'Your daily furnace slows by 380 calories.',
      voiceover_script: 'Gold-standard metabolic chamber trials prove your body slows down its daily calorie burn by 380 calories.',
      subtitle_text: 'Metabolism drops 380 kcal/day below expected burn (Hall et al.)',
      visual_cue: 'Animated chamber dial showing daily calorie burn decreasing',
      b_roll_type: 'metabolic_animation',
      hinglish_voiceover: 'Metabolic chamber trials batati hain ki body daily calorie burn ko 380 calories slow kar deti hai.',
      hinglish_subtitle: 'Metabolism 380 calories slow ho jata hai.',
      mapped_claim_ids: ['claim_ma_01'],
    },
    {
      scene_number: 3,
      duration_sec: 6,
      title: 'The Hunger Surge',
      on_screen_text: 'Ghrelin stays 24% higher for an entire year.',
      voiceover_script: 'And hunger hormone ghrelin stays twenty-four percent higher for a year. You aren\'t weak. It is biology.',
      subtitle_text: 'Hunger hormone stays 24% elevated for 52 weeks',
      visual_cue: 'Minimalist endocrine hormone curve showing elevated ghrelin',
      b_roll_type: 'metabolic_animation',
      hinglish_voiceover: 'Aur bhookh lagane wala hormone ghrelin poore ek saal tak 24% badha rehta hai. Yeh biology hai.',
      hinglish_subtitle: 'Yeh biology hai, aapki galti nahi.',
      mapped_claim_ids: ['claim_ma_02'],
    },
    {
      scene_number: 4,
      duration_sec: 7,
      title: 'The MOTIVA Exit Plan',
      on_screen_text: 'Doctor-led habits. A planned exit. MOTIVAclub.com',
      voiceover_script: 'Stop blaming your willpower. Talk to a MOTIVA doctor for a planned exit that lasts. Visit MOTIVAclub.com.',
      subtitle_text: 'Lose well. Live well. MOTIVAclub.com',
      visual_cue: 'Soft paper card with bold uppercase MOTIVA wordmark and doctor signature',
      b_roll_type: 'doctor_consult',
      hinglish_voiceover: 'Willpower ko blame karna band kariye. MOTIVA par doctors ke sath aisi habits banaiye jo lambi chalein. MOTIVAclub.com',
      hinglish_subtitle: 'Doctor-led care. MOTIVAclub.com',
      mapped_claim_ids: ['claim_ma_01'],
    },
  ],
};

// All papers combined
export const ALL_PAPERS: PaperRecord[] = [
  PAPER_GLP1,
  PAPER_SOUTH_ASIAN,
  PAPER_METABOLIC_ADAPTATION,
];

export const ALL_PASSAGES: EvidencePassage[] = [
  ...PASSAGES_GLP1,
  ...PASSAGES_SOUTH_ASIAN,
  ...PASSAGES_METABOLIC_ADAPTATION,
];

export const ALL_CLAIMS: ClaimRecord[] = [
  ...CLAIMS_GLP1,
  ...CLAIMS_SOUTH_ASIAN,
  ...CLAIMS_METABOLIC_ADAPTATION,
];

export const ALL_CAROUSELS: CarouselContent[] = [
  CAROUSEL_GLP1,
  CAROUSEL_SOUTH_ASIAN,
  CAROUSEL_METABOLIC_ADAPTATION,
];

export const ALL_STATIC_POSTS: StaticPostContent[] = [
  STATIC_GLP1,
  STATIC_SOUTH_ASIAN,
  STATIC_METABOLIC_ADAPTATION,
];

export const ALL_REELS: ReelContent[] = [
  REEL_GLP1,
  REEL_SOUTH_ASIAN,
  REEL_METABOLIC_ADAPTATION,
];

// Preloaded 7-Day MOTIVA Instagram Content Queue
export const DEFAULT_SCHEDULED_POSTS: ScheduledPost[] = [
  {
    id: 'sched_01',
    paper_id: 'paper_glp1_muscle_2024',
    paper_title: 'GLP-1 Body Composition & Muscle Preservation',
    title: 'GLP-1 & Muscle Loss Carousel',
    format: 'CAROUSEL',
    scheduled_for: '2026-10-19T06:00:00.000Z',
    slot_label: 'Monday 11:30 AM IST · Educational Carousel (Feed)',
    status: 'DRAFT',
    caption: CAROUSEL_GLP1.caption,
    hashtags: CAROUSEL_GLP1.hashtags,
    deliverable_id: CAROUSEL_GLP1.id,
    hook: 'GLP-1, muscle loss, and the weight regain trap.',
    language: 'EN',
  },
  {
    id: 'sched_02',
    paper_id: 'paper_south_asian_phenotype_2024',
    paper_title: 'Asian Indian Thin-Fat Phenotype',
    title: '3 PM Desk Crash Reel',
    format: 'REEL',
    scheduled_for: '2026-10-20T13:30:00.000Z',
    slot_label: 'Tuesday 7:00 PM IST · Short Reel (Video)',
    status: 'DRAFT',
    caption: REEL_SOUTH_ASIAN.caption,
    hashtags: REEL_SOUTH_ASIAN.hashtags,
    deliverable_id: REEL_SOUTH_ASIAN.id,
    hook: 'Why do you crash at 3 PM after lunch every day?',
    language: 'HINGLISH',
  },
  {
    id: 'sched_03',
    paper_id: 'paper_metabolic_adaptation_2024',
    paper_title: 'Metabolic Adaptation & Adaptive Thermogenesis',
    title: 'Crash Diets Fail Static Post',
    format: 'STATIC',
    scheduled_for: '2026-10-21T06:00:00.000Z',
    slot_label: 'Wednesday 11:30 AM IST · Editorial Note (Single)',
    status: 'DRAFT',
    caption: STATIC_METABOLIC_ADAPTATION.caption,
    hashtags: STATIC_METABOLIC_ADAPTATION.hashtags,
    deliverable_id: STATIC_METABOLIC_ADAPTATION.id,
    hook: 'When you starve yourself, your metabolism strikes back.',
    language: 'EN',
  },
  {
    id: 'sched_04',
    paper_id: 'paper_south_asian_phenotype_2024',
    paper_title: 'Asian Indian Thin-Fat Phenotype',
    title: 'The Weighing Scale Lies Carousel',
    format: 'CAROUSEL',
    scheduled_for: '2026-10-22T06:00:00.000Z',
    slot_label: 'Thursday 11:30 AM IST · Deep-Dive Carousel (Feed)',
    status: 'DRAFT',
    caption: CAROUSEL_SOUTH_ASIAN.caption,
    hashtags: CAROUSEL_SOUTH_ASIAN.hashtags,
    deliverable_id: CAROUSEL_SOUTH_ASIAN.id,
    hook: 'Why the weighing scale lies to Indian bodies.',
    language: 'EN',
  },
  {
    id: 'sched_05',
    paper_id: 'paper_glp1_muscle_2024',
    paper_title: 'GLP-1 Body Composition & Muscle Preservation',
    title: 'Why Weight Regain Happens Reel',
    format: 'REEL',
    scheduled_for: '2026-10-23T13:30:00.000Z',
    slot_label: 'Friday 7:00 PM IST · Prime-Time Reel (Video)',
    status: 'DRAFT',
    caption: REEL_GLP1.caption,
    hashtags: REEL_GLP1.hashtags,
    deliverable_id: REEL_GLP1.id,
    hook: 'Why does weight come back after GLP-1 injections?',
    language: 'EN',
  },
  {
    id: 'sched_06',
    paper_id: 'paper_metabolic_adaptation_2024',
    paper_title: 'Metabolic Adaptation & Adaptive Thermogenesis',
    title: 'Biology Not Willpower Carousel',
    format: 'CAROUSEL',
    scheduled_for: '2026-10-24T05:30:00.000Z',
    slot_label: 'Saturday 11:00 AM IST · Weekend Long-form (Feed)',
    status: 'DRAFT',
    caption: CAROUSEL_METABOLIC_ADAPTATION.caption,
    hashtags: CAROUSEL_METABOLIC_ADAPTATION.hashtags,
    deliverable_id: CAROUSEL_METABOLIC_ADAPTATION.id,
    hook: 'Why crash diets fail: It is biology, not willpower.',
    language: 'HINGLISH',
  },
  {
    id: 'sched_07',
    paper_id: 'paper_glp1_muscle_2024',
    paper_title: 'GLP-1 Body Composition & Muscle Preservation',
    title: 'Protect Your Muscle Static Post',
    format: 'STATIC',
    scheduled_for: '2026-10-25T12:30:00.000Z',
    slot_label: 'Sunday 6:00 PM IST · Doctor Field Note',
    status: 'DRAFT',
    caption: STATIC_GLP1.caption,
    hashtags: STATIC_GLP1.hashtags,
    deliverable_id: STATIC_GLP1.id,
    hook: 'Before you start a GLP-1, protect your muscle.',
    language: 'EN',
  },
];

const SAMPLE_PAPER_IDS = new Set(ALL_PAPERS.map((paper) => paper.paper_id));
const SAMPLE_CLAIM_IDS = new Set(ALL_CLAIMS.map((claim) => claim.claim_id));

function markSamplePaper(paper: PaperRecord): PaperRecord {
  return SAMPLE_PAPER_IDS.has(paper.paper_id) ? { ...paper, is_demo: true } : paper;
}

function markSampleClaim(claim: ClaimRecord): ClaimRecord {
  if (!SAMPLE_CLAIM_IDS.has(claim.claim_id)) return claim;
  const sampleClaim: ClaimRecord = {
    ...claim,
    review_status: 'DRAFT',
    reviewer_note: 'Synthetic sample record. No real clinical review was performed.',
    approved_version: undefined,
    review_history: [],
  };
  const validation = runValidationEngine(sampleClaim, ALL_PASSAGES, ALL_CLAIMS);
  return {
    ...sampleClaim,
    validation_findings: validation.findings,
    validation_checks: validation.checks,
    review_status: validation.calculatedStatus,
  };
}

function markSampleCarousel(item: CarouselContent): CarouselContent {
  return SAMPLE_PAPER_IDS.has(item.paper_id) ? { ...item, status: 'DRAFT' } : item;
}

function markSampleStaticPost(item: StaticPostContent): StaticPostContent {
  return SAMPLE_PAPER_IDS.has(item.paper_id) ? { ...item, status: 'DRAFT' } : item;
}

function markSampleReel(item: ReelContent): ReelContent {
  return SAMPLE_PAPER_IDS.has(item.paper_id) ? { ...item, status: 'DRAFT' } : item;
}

// Persistence functions
export function getSavedPapers(): PaperRecord[] {
  return [];
}

export function savePapers(papers: PaperRecord[]): void {
  void papers;
}

export function getSavedPassages(): EvidencePassage[] {
  return [];
}

export function savePassages(passages: EvidencePassage[]): void {
  void passages;
}

export function getSavedClaims(): ClaimRecord[] {
  return [];
}

export function saveClaims(claims: ClaimRecord[]): void {
  void claims;
}

export function getSavedCarousels(): CarouselContent[] {
  return [];
}

export function saveCarousels(carousels: CarouselContent[]): void {
  void carousels;
}

export function getSavedStaticPosts(): StaticPostContent[] {
  return [];
}

export function saveStaticPosts(posts: StaticPostContent[]): void {
  void posts;
}

export function getSavedReels(): ReelContent[] {
  return [];
}

export function saveReels(reels: ReelContent[]): void {
  void reels;
}

export function getSavedScheduledPosts(): ScheduledPost[] {
  return [];
}

export function saveScheduledPosts(posts: ScheduledPost[]): void {
  void posts;
}

export function getActivePaperId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PAPER_ID) || PAPER_GLP1.paper_id;
  } catch {
    return PAPER_GLP1.paper_id;
  }
}

export function setActivePaperId(paperId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PAPER_ID, paperId);
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

/**
 * Resets local storage back to clean state with metabolic research dataset
 */
export function resetToDemoWorkspace(): {
  papers: PaperRecord[];
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousels: CarouselContent[];
  staticPosts: StaticPostContent[];
  reels: ReelContent[];
  scheduledPosts: ScheduledPost[];
} {
  const samplePapers = ALL_PAPERS.map(markSamplePaper);
  const validatedClaims = ALL_CLAIMS.map((sourceClaim) => {
    const claim = markSampleClaim(sourceClaim);
    const { findings, calculatedStatus } = runValidationEngine(claim, ALL_PASSAGES, ALL_CLAIMS);
    return { ...claim, validation_findings: findings, review_status: calculatedStatus };
  });
  const sampleCarousels = ALL_CAROUSELS.map(markSampleCarousel);
  const sampleStaticPosts = ALL_STATIC_POSTS.map(markSampleStaticPost);
  const sampleReels = ALL_REELS.map(markSampleReel);

  savePapers(samplePapers);
  savePassages(ALL_PASSAGES);
  saveClaims(validatedClaims);
  saveCarousels(sampleCarousels);
  saveStaticPosts(sampleStaticPosts);
  saveReels(sampleReels);
  saveScheduledPosts(DEFAULT_SCHEDULED_POSTS);
  setActivePaperId(PAPER_GLP1.paper_id);

  return {
    papers: samplePapers,
    passages: ALL_PASSAGES,
    claims: validatedClaims,
    carousels: sampleCarousels,
    staticPosts: sampleStaticPosts,
    reels: sampleReels,
    scheduledPosts: DEFAULT_SCHEDULED_POSTS,
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  role: string;
  action: string;
  details: string;
}

