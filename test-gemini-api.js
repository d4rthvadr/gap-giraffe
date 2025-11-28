#!/usr/bin/env node

/**
 * Gemini API Test Script
 * 
 * This script tests the Gemini API directly to verify:
 * 1. API key works
 * 2. Model name is correct
 * 3. API endpoint is reachable
 * 4. Response format is as expected
 * 
 * Usage:
 *   node test-gemini-api.js
 * 
 * Or with API key as argument:
 *   node test-gemini-api.js YOUR_API_KEY_HERE
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Option 1: Hardcode your API key here (for quick testing)
const HARDCODED_API_KEY = 'YOUR_API_KEY_HERE';

// Option 2: Pass API key as command line argument
const API_KEY = process.argv[2] || HARDCODED_API_KEY;

// Model to test (use one of these verified models)
const MODEL_NAME = 'gemini-2.5-flash';
// Alternative models to try:
// const MODEL_NAME = 'gemini-2.5-pro';
// const MODEL_NAME = 'gemini-1.5-flash';
// const MODEL_NAME = 'gemini-1.5-pro';

// ============================================
// MOCK DATA - Small job posting for testing
// ============================================

const MOCK_JOB_TITLE = 'Senior Software Engineer';
const MOCK_JOB_COMPANY = 'Tech Corp';
const MOCK_JOB_DESCRIPTION = `
We are seeking a Senior Software Engineer with:
- 5+ years of JavaScript/TypeScript experience
- React and Node.js expertise
- Experience with cloud platforms (AWS/GCP)
- Strong problem-solving skills
`;

// Optional: Add mock resume content for full testing
const MOCK_RESUME_CONTENT = `
John Doe
Senior Software Developer

Experience:
- 6 years JavaScript/TypeScript
- React, Vue.js, Node.js
- AWS deployment experience
- Team leadership

Skills: JavaScript, TypeScript, React, Node.js, AWS, Docker
`;

// ============================================
// TEST SCRIPT
// ============================================

async function testGeminiAPI() {
  console.log('\n🧪 Gemini API Test Script');
  console.log('='.repeat(50));
  
  // Validate API key
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('\n❌ ERROR: API key not set!');
    console.log('\nPlease either:');
    console.log('1. Edit this file and set HARDCODED_API_KEY');
    console.log('2. Run: node test-gemini-api.js YOUR_API_KEY_HERE\n');
    process.exit(1);
  }

  console.log(`\n📋 Test Configuration:`);
  console.log(`   Model: ${MODEL_NAME}`);
  console.log(`   API Key: ${API_KEY.substring(0, 10)}...${API_KEY.slice(-4)}`);
  console.log(`   Endpoint: ${GEMINI_API_BASE}`);

  // Build the prompt
  const prompt = buildAnalysisPrompt();
  console.log(`\n📝 Prompt Length: ${prompt.length} characters`);

  // Build the API URL
  const url = `${GEMINI_API_BASE}/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  console.log(`\n🚀 Making API Request...`);
  console.log(`   URL: ${GEMINI_API_BASE}/models/${MODEL_NAME}:generateContent`);

  try {
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      })
    });

    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Response Time: ${duration}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Error:');
      console.error('   Status:', response.status);
      console.error('   Response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('\n   Parsed Error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Error text is not JSON
      }
      
      process.exit(1);
    }

    // Parse response
    const data = await response.json();
    console.log('\n✅ API Call Successful!');
    
    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('\n⚠️  No text in response!');
      console.log('Full response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n📊 Generated Response:');
    console.log('-'.repeat(50));
    console.log(generatedText);
    console.log('-'.repeat(50));

    // Try to parse as JSON
    try {
      const analysis = JSON.parse(generatedText);
      console.log('\n✅ Response is valid JSON!');
      console.log('\n📈 Analysis Summary:');
      console.log(`   Match Score: ${analysis.matchScore || 'N/A'}`);
      console.log(`   Certainty Score: ${analysis.certaintyScore || 'N/A'}`);
      console.log(`   Missing Skills: ${analysis.missingSkills?.length || 0}`);
      console.log(`   Strengths: ${analysis.strengths?.length || 0}`);
      console.log(`   Suggestions: ${analysis.suggestions?.length || 0}`);
      
      if (analysis.missingSkills?.length > 0) {
        console.log(`\n   Top Missing Skills:`);
        analysis.missingSkills.slice(0, 3).forEach((skill, i) => {
          console.log(`   ${i + 1}. ${skill}`);
        });
      }
      
    } catch (parseError) {
      console.error('\n⚠️  Response is not valid JSON');
      console.error('   Parse Error:', parseError.message);
    }

    console.log('\n✅ Test Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Network/Fetch Error:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt() {
  if (MOCK_RESUME_CONTENT.trim()) {
    // With resume - full analysis
    return `You are an expert resume optimization assistant. Analyze the following job posting against the candidate's resume and provide detailed feedback.

JOB POSTING:
Title: ${MOCK_JOB_TITLE}
Company: ${MOCK_JOB_COMPANY}
Description: ${MOCK_JOB_DESCRIPTION}

RESUME:
${MOCK_RESUME_CONTENT}

Provide a comprehensive analysis in the following JSON format:
{
  "matchScore": <number 0-100, overall fit for this role>,
  "certaintyScore": <number 0-100, how confident you are in this analysis>,
  "keyRequirements": [<array of main job requirements extracted from posting>],
  "missingSkills": [<array of required skills the candidate lacks>],
  "strengths": [<array of candidate's strong points for this role>],
  "analysis": {
    "technicalFit": <number 0-100, technical skills match>,
    "experienceFit": <number 0-100, experience level match>,
    "culturalFit": <number 0-100, based on job description tone and candidate background>
  },
  "suggestions": [
    {
      "id": "<unique-id>",
      "type": "add|modify|remove|reorder",
      "section": "summary|experience|skills|education",
      "priority": "high|medium|low",
      "current": "<current text if modifying>",
      "suggested": "<suggested improvement>",
      "reason": "<why this change helps>",
      "impact": <expected score improvement 0-20>
    }
  ]
}

Be specific and actionable.`;
  } else {
    // No resume - just analyze job
    return `You are an expert job requirements analyst. Analyze the following job posting and extract key information.

JOB POSTING:
Title: ${MOCK_JOB_TITLE}
Company: ${MOCK_JOB_COMPANY}
Description: ${MOCK_JOB_DESCRIPTION}

Provide an analysis in the following JSON format:
{
  "matchScore": 0,
  "certaintyScore": 90,
  "keyRequirements": [<array of main job requirements and skills needed>],
  "missingSkills": [],
  "strengths": [],
  "analysis": {
    "technicalFit": 0,
    "experienceFit": 0,
    "culturalFit": 0
  },
  "suggestions": [
    {
      "id": "req-1",
      "type": "add",
      "section": "skills",
      "priority": "high",
      "suggested": "<skill or experience needed>",
      "reason": "Required for this position",
      "impact": 10
    }
  ]
}

Focus on extracting technical requirements, required experience level, and key qualifications.`;
  }
}

// Run the test
testGeminiAPI().catch(error => {
  console.error('\n💥 Unhandled Error:', error);
  process.exit(1);
});
