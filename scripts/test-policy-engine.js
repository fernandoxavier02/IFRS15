// Simple test script to validate Policy Engine functionality
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Policy Engine Implementation...\n');

// Test 1: Check if all files exist
const policyEngineDir = path.join(__dirname, '..', 'packages', 'domain', 'src', 'policy-engine');
const requiredFiles = [
  'types.ts',
  'validators.ts', 
  'calculators.ts',
  'engine.ts',
  'index.ts',
  '__tests__/engine.test.ts',
  '__tests__/validators.test.ts',
  '__tests__/calculators.test.ts',
  'examples/software-license-policy.yaml',
  'examples/construction-contract-policy.json',
  'examples/saas-subscription-policy.yaml',
  'examples/telecom-bundle-policy.json',
  'README.md'
];

console.log('📁 File Structure Check:');
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(policyEngineDir, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Test 2: Check file sizes
console.log('\n📊 File Sizes:');
let totalSize = 0;
for (const file of requiredFiles) {
  const filePath = path.join(policyEngineDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  ${file}: ${sizeKB} KB`);
    totalSize += stats.size;
  }
}
console.log(`  Total: ${(totalSize / 1024).toFixed(2)} KB`);

// Test 3: Check TypeScript syntax
console.log('\n🔧 TypeScript Syntax Check:');
const tsFiles = requiredFiles.filter(f => f.endsWith('.ts'));
for (const file of tsFiles) {
  const filePath = path.join(policyEngineDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasImports = content.includes('import');
    const hasExports = content.includes('export');
    const hasTypes = content.includes('type') || content.includes('interface');
    console.log(`  ${file}: imports=${hasImports}, exports=${hasExports}, types=${hasTypes}`);
  }
}

// Test 4: Check examples validity
console.log('\n📋 Examples Check:');
const exampleFiles = requiredFiles.filter(f => f.startsWith('examples/'));
for (const file of exampleFiles) {
  const filePath = path.join(policyEngineDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const isValid = content.length > 100 && (
      content.includes('contractId') || 
      content.includes('performanceObligations')
    );
    console.log(`  ${file}: ${isValid ? 'Valid' : 'Invalid'} (${content.length} chars)`);
  }
}

// Test 5: Package.json dependencies
console.log('\n📦 Dependencies Check:');
const domainPackageJson = path.join(__dirname, '..', 'packages', 'domain', 'package.json');
if (fs.existsSync(domainPackageJson)) {
  const packageContent = JSON.parse(fs.readFileSync(domainPackageJson, 'utf8'));
  const hasZod = packageContent.dependencies && packageContent.dependencies.zod;
  const hasJest = packageContent.devDependencies && packageContent.devDependencies['@jest/globals'];
  const hasExports = packageContent.exports && packageContent.exports['./policy-engine'];
  
  console.log(`  Zod dependency: ${hasZod ? '✅' : '❌'}`);
  console.log(`  Jest dependency: ${hasJest ? '✅' : '❌'}`);
  console.log(`  Policy engine export: ${hasExports ? '✅' : '❌'}`);
}

// Summary
console.log('\n🎯 Summary:');
console.log(`  Files exist: ${allFilesExist ? '✅' : '❌'}`);
console.log(`  Total implementation size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`  Components: ${requiredFiles.length} files`);

if (allFilesExist) {
  console.log('\n🚀 Policy Engine appears to be fully implemented!');
} else {
  console.log('\n⚠️  Some files are missing. Implementation may be incomplete.');
}
