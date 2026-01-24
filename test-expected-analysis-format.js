#!/usr/bin/env node

/**
 * Mock test to demonstrate the expected analysis output format
 * Shows what the LLM should return with the increased token limit
 */

console.log('\n=== Expected Analysis Output Format Test ===\n');

// This is what we expect the LLM to return with max_tokens: 2500
const expectedAnalysisOutput = {
  quality_percentage: 82,
  traffic_light: "🟡 Yellow - Good quality with some limitations",
  
  // REASONING: Should now be 2-3 detailed paragraphs (not truncated)
  reasoning: `This study demonstrates several key strengths that contribute to its high quality score. The methodology is robust, employing proper randomization and blinding procedures that minimize bias. The sample size of 1,000 participants is adequate for detecting the expected effect size, and the statistical analysis using appropriate methods strengthens the validity of findings.

However, some limitations exist that prevent this from being rated as excellent quality. The study population is relatively homogeneous, being predominantly recruited from a single academic medical center, which may limit generalizability to more diverse populations. The follow-up period of 6 months is also relatively short for assessing long-term outcomes and sustainability of observed effects.

Overall, this represents solid, methodologically sound research that makes a meaningful contribution to the field. The strengths, particularly in study design and statistical rigor, outweigh the identified limitations in external validity. The paper meets high standards for publication in a reputable journal.`,

  // POSITIVE ASPECTS: Each should have aspect, source_text, and explanation
  positive_aspects: [
    {
      aspect: "Study uses proper randomization and allocation concealment",
      source_text: "Participants were randomly assigned to treatment groups using a computer-generated randomization sequence with allocation concealment maintained by sealed, opaque envelopes",
      explanation: "Proper randomization with allocation concealment is critical for minimizing selection bias and establishing causal relationships. This methodology ensures balanced distribution of both known and unknown confounders between groups, strengthening the internal validity of the study's conclusions."
    },
    {
      aspect: "Large sample size provides adequate statistical power",
      source_text: "A total of 1,000 participants were enrolled in the study, providing 90% power to detect a 10% difference in the primary outcome",
      explanation: "The large, adequately powered sample size reduces the likelihood of Type II errors (false negatives) and increases precision of effect estimates. This sample size calculation demonstrates thoughtful study design and ensures the study can reliably detect clinically meaningful differences."
    },
    {
      aspect: "Comprehensive statistical analysis with appropriate methods",
      source_text: "We performed intention-to-treat analysis using mixed-effects models to account for repeated measurements and clustering by site",
      explanation: "Intention-to-treat analysis preserves the benefits of randomization and provides a conservative estimate of treatment effects. The use of mixed-effects models appropriately accounts for the hierarchical data structure and repeated measurements, preventing biased estimates and inflated Type I error rates."
    },
    {
      aspect: "Clear reporting of all outcomes including adverse events",
      source_text: "All pre-specified primary and secondary outcomes were reported. A total of 45 adverse events were documented, with detailed descriptions provided in Supplementary Table 3",
      explanation: "Transparent reporting of all outcomes, including negative results and adverse events, reduces publication bias and provides a complete picture of the intervention's effects. This transparency is essential for informed clinical decision-making and demonstrates adherence to reporting guidelines."
    }
  ],

  // NEGATIVE ASPECTS: Each should have aspect, source_text, and explanation
  negative_aspects: [
    {
      aspect: "Limited generalizability due to homogeneous study population",
      source_text: "Participants were predominantly white (92%), female (68%), and recruited from a single academic medical center in the northeastern United States",
      explanation: "The homogeneous demographic composition and single-site recruitment limit the study's external validity. Results may not generalize to more diverse populations or different healthcare settings, particularly underrepresented racial and ethnic groups who may respond differently to the intervention."
    },
    {
      aspect: "Relatively short follow-up period",
      source_text: "Participants were followed for 6 months after intervention completion, with the final assessment occurring at the 6-month time point",
      explanation: "A 6-month follow-up may be insufficient to assess long-term sustainability of treatment effects or identify delayed adverse events. Many clinical outcomes require longer observation periods to determine whether initial benefits are maintained and whether late-emerging side effects occur."
    },
    {
      aspect: "High dropout rate in control group",
      source_text: "The dropout rate was 22% in the intervention group and 38% in the control group (p=0.003)",
      explanation: "The significantly higher dropout rate in the control group (38% vs 22%) suggests potential differential attrition bias. This pattern could artificially inflate treatment effects if participants who dropped from the control group were those doing poorly, leading to overestimation of the intervention's true effectiveness."
    }
  ],

  journal_info: {
    journal_name: "Journal of Clinical Research",
    impact_factor: "5.2"
  }
};

console.log('Expected JSON structure:\n');
console.log(JSON.stringify(expectedAnalysisOutput, null, 2));

console.log('\n=== Format Validation ===\n');

// Validate the structure
let allValid = true;

// Check reasoning length
const reasoningParagraphs = expectedAnalysisOutput.reasoning.split('\n\n');
console.log(`✓ Reasoning paragraphs: ${reasoningParagraphs.length}`);
if (reasoningParagraphs.length >= 2 && reasoningParagraphs.length <= 3) {
  console.log('  ✓ PASS: Has 2-3 paragraphs as required');
} else {
  console.log('  ✗ FAIL: Should have 2-3 paragraphs');
  allValid = false;
}

// Check positive aspects
console.log(`\n✓ Positive aspects: ${expectedAnalysisOutput.positive_aspects.length}`);
for (let i = 0; i < expectedAnalysisOutput.positive_aspects.length; i++) {
  const aspect = expectedAnalysisOutput.positive_aspects[i];
  const hasAll = aspect.aspect && aspect.source_text && aspect.explanation;
  if (hasAll) {
    console.log(`  ✓ Aspect ${i+1}: Has aspect, source_text, and explanation`);
  } else {
    console.log(`  ✗ Aspect ${i+1}: Missing fields`);
    allValid = false;
  }
}

// Check negative aspects
console.log(`\n✓ Negative aspects: ${expectedAnalysisOutput.negative_aspects.length}`);
for (let i = 0; i < expectedAnalysisOutput.negative_aspects.length; i++) {
  const aspect = expectedAnalysisOutput.negative_aspects[i];
  const hasAll = aspect.aspect && aspect.source_text && aspect.explanation;
  if (hasAll) {
    console.log(`  ✓ Aspect ${i+1}: Has aspect, source_text, and explanation`);
  } else {
    console.log(`  ✗ Aspect ${i+1}: Missing fields`);
    allValid = false;
  }
}

// Token count estimation
const jsonString = JSON.stringify(expectedAnalysisOutput);
const estimatedTokens = Math.ceil(jsonString.length / 4); // Rough approximation: 1 token ≈ 4 characters
console.log(`\n✓ Token count estimate: ~${estimatedTokens} tokens`);
if (estimatedTokens <= 2500) {
  console.log('  ✓ PASS: Fits within max_tokens: 2500');
} else {
  console.log(`  ⚠ WARNING: May exceed max_tokens limit (${estimatedTokens} > 2500)`);
}

console.log('\n=== Test Summary ===\n');
if (allValid) {
  console.log('✓ All validations PASSED');
  console.log('\nThis output structure demonstrates what the LLM should return');
  console.log('with the increased max_tokens limit (2500 tokens).');
  console.log('\nKey features:');
  console.log('- Reasoning: 2-3 detailed paragraphs explaining the quality score');
  console.log('- Each aspect includes:');
  console.log('  • aspect: Clear description of the strength/weakness');
  console.log('  • source_text: Exact quote from the paper');
  console.log('  • explanation: 2-3 sentences on significance');
  console.log('\nThe UI in popup.js will display this data using the');
  console.log('createAspectElement() function, showing source and explanation');
  console.log('when users click on each aspect.');
  process.exit(0);
} else {
  console.log('✗ Some validations FAILED');
  process.exit(1);
}
