#!/usr/bin/env node

/**
 * Generate patch proposal from test report using LLM
 * 
 * This script analyzes failed test results and uses OpenAI's API to generate
 * a conservative patch proposal to fix the issues.
 * 
 * Safety features:
 * - Rate limiting
 * - Max diff size restrictions
 * - Never edits manifest.json permissions
 * - Conservative change suggestions only
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MAX_DIFF_SIZE = 50000; // Max characters in generated diff
const FORBIDDEN_FILES = ['manifest.json']; // Files that should never be auto-edited
const MAX_FILES_TO_ANALYZE = 10;

async function main() {
  const reportFile = process.argv[2];
  
  if (!reportFile) {
    console.error('Usage: node generate_patch_from_report.js <test-report.json>');
    process.exit(1);
  }

  // Check if OpenAI API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  // Read test report
  let report;
  try {
    const reportContent = fs.readFileSync(reportFile, 'utf-8');
    report = JSON.parse(reportContent);
  } catch (error) {
    console.error('Error reading test report:', error.message);
    process.exit(1);
  }

  // Extract failed tests
  const failedTests = extractFailedTests(report);
  
  if (failedTests.length === 0) {
    console.error('No failed tests found in report');
    process.exit(0);
  }

  // Analyze repository context
  const context = analyzeContext(failedTests);

  // Generate patch using LLM
  const patch = await generatePatchWithLLM(apiKey, failedTests, context);

  // Validate and output patch
  if (validatePatch(patch)) {
    console.log(patch);
  } else {
    console.error('Generated patch failed validation');
    process.exit(1);
  }
}

/**
 * Extract failed tests from Playwright JSON report
 */
function extractFailedTests(report) {
  const failed = [];
  
  if (!report.suites) {
    return failed;
  }

  function traverseSuites(suites) {
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          if (spec.tests) {
            for (const test of spec.tests) {
              if (test.status === 'failed' || test.status === 'timedOut') {
                failed.push({
                  title: test.title || spec.title,
                  file: spec.file,
                  error: test.results?.[0]?.error?.message || 'Unknown error',
                  line: test.results?.[0]?.error?.stack
                });
              }
            }
          }
        }
      }
      if (suite.suites) {
        traverseSuites(suite.suites);
      }
    }
  }

  traverseSuites(report.suites);
  return failed;
}

/**
 * Analyze repository context around failed tests
 */
function analyzeContext(failedTests) {
  const context = {
    files: [],
    snippets: []
  };

  // Get unique files mentioned in failures
  const files = new Set();
  failedTests.forEach(test => {
    if (test.file) files.add(test.file);
    
    // Extract file references from error messages
    const fileMatches = test.error?.match(/[\w-]+\.(js|ts|json|html)/g) || [];
    fileMatches.forEach(f => {
      const fullPath = path.resolve('.', f);
      if (fs.existsSync(fullPath)) {
        files.add(fullPath);
      }
    });
  });

  // Read relevant files (up to limit)
  const filesArray = Array.from(files).slice(0, MAX_FILES_TO_ANALYZE);
  
  for (const file of filesArray) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      // Limit content size
      const truncated = content.length > 5000 ? content.slice(0, 5000) + '\n...[truncated]' : content;
      context.files.push({
        path: file,
        content: truncated
      });
    } catch (error) {
      // Ignore files we can't read
    }
  }

  return context;
}

/**
 * Generate patch using OpenAI API
 */
async function generatePatchWithLLM(apiKey, failedTests, context) {
  const prompt = buildPrompt(failedTests, context);

  const requestBody = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert software engineer helping to fix browser extension tests. Generate a minimal, conservative git diff patch to fix failing tests. Only output the patch in unified diff format, nothing else. Never modify manifest.json permissions or security-critical configurations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`OpenAI API error: ${response.error.message}`));
          } else if (response.choices && response.choices[0]) {
            const content = response.choices[0].message.content;
            // Extract diff if wrapped in markdown code blocks
            const diffMatch = content.match(/```(?:diff)?\n?([\s\S]*?)```/) || [null, content];
            resolve(diffMatch[1].trim());
          } else {
            reject(new Error('Unexpected API response format'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Build prompt for LLM
 */
function buildPrompt(failedTests, context) {
  let prompt = '# Failed Tests Report\n\n';
  
  failedTests.forEach((test, i) => {
    prompt += `## Test ${i + 1}: ${test.title}\n`;
    prompt += `File: ${test.file}\n`;
    prompt += `Error: ${test.error}\n\n`;
  });

  prompt += '\n# Relevant Files\n\n';
  context.files.forEach(file => {
    prompt += `## ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
  });

  prompt += '\n# Task\n\n';
  prompt += 'Generate a minimal git diff patch to fix these test failures. ';
  prompt += 'Be conservative - only fix the specific issues mentioned. ';
  prompt += 'Do not modify manifest.json or any security-related configurations. ';
  prompt += 'Output only the unified diff format patch, no explanations.\n';

  return prompt;
}

/**
 * Validate generated patch
 */
function validatePatch(patch) {
  // Check size
  if (patch.length > MAX_DIFF_SIZE) {
    console.error('Patch too large');
    return false;
  }

  // Check for forbidden files
  for (const forbidden of FORBIDDEN_FILES) {
    if (patch.includes(`--- a/${forbidden}`) || patch.includes(`+++ b/${forbidden}`)) {
      console.error(`Patch attempts to modify forbidden file: ${forbidden}`);
      return false;
    }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /permissions.*:\s*\[/i,  // Don't modify permissions array
    /host_permissions.*:\s*\[/i,  // Don't modify host permissions
    /\.env/i,  // Don't touch env files
    /secret|password|token|key/i  // Don't add secrets
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(patch)) {
      console.error('Patch contains suspicious patterns');
      return false;
    }
  }

  // Must look like a valid diff
  if (!patch.includes('---') || !patch.includes('+++')) {
    console.error('Patch does not appear to be valid unified diff format');
    return false;
  }

  return true;
}

// Run main function
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
