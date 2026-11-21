#!/bin/bash

# Test Build Script for Time Tailor
# This script verifies the build is ready for deployment

echo "🧪 Time Tailor Build Test"
echo "=========================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check if package.json exists
echo "Test 1: Checking root package.json..."
if [ -f "package.json" ]; then
    test_result 0 "Root package.json exists"
else
    test_result 1 "Root package.json not found"
fi

# Test 2: Check if workspaces are defined
echo "Test 2: Checking workspace configuration..."
if grep -q '"workspaces"' package.json; then
    test_result 0 "Workspaces configured"
else
    test_result 1 "Workspaces not configured"
fi

# Test 3: Check if client exists
echo "Test 3: Checking client directory..."
if [ -d "client" ] && [ -f "client/package.json" ]; then
    test_result 0 "Client directory and package.json exist"
else
    test_result 1 "Client directory or package.json missing"
fi

# Test 4: Check if server exists
echo "Test 4: Checking server directory..."
if [ -d "server" ] && [ -f "server/package.json" ] && [ -f "server/server.js" ]; then
    test_result 0 "Server directory and files exist"
else
    test_result 1 "Server directory or required files missing"
fi

# Test 5: Check if .render.yaml exists
echo "Test 5: Checking Render configuration..."
if [ -f ".render.yaml" ]; then
    test_result 0 "Render configuration exists"
else
    test_result 1 "Render configuration (.render.yaml) not found"
fi

# Test 6: Check node_modules
echo "Test 6: Checking if dependencies are installed..."
if [ -d "node_modules" ] && [ -d "client/node_modules" ] && [ -d "server/node_modules" ]; then
    test_result 0 "Dependencies installed"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Dependencies not fully installed. Run: npm install"
    test_result 1 "Dependencies not fully installed"
fi

# Test 7: Build the client
echo "Test 7: Building client..."
echo "Running: npm run build"
if npm run build > /dev/null 2>&1; then
    test_result 0 "Client build successful"
else
    test_result 1 "Client build failed"
    echo "  Run 'npm run build' to see detailed error"
fi

# Test 8: Check if dist folder was created
echo "Test 8: Checking build output..."
if [ -d "client/dist" ] && [ -f "client/dist/index.html" ]; then
    test_result 0 "Build output (dist folder) exists"
    
    # Check for assets
    if [ -d "client/dist/assets" ]; then
        ASSET_COUNT=$(ls -1 client/dist/assets | wc -l)
        echo "  Found $ASSET_COUNT asset files"
    fi
else
    test_result 1 "Build output missing or incomplete"
fi

# Test 9: Check for required server files
echo "Test 9: Checking server structure..."
REQUIRED_DIRS=("models" "routes" "config" "middleware" "utils")
MISSING_DIRS=()

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "server/$dir" ]; then
        MISSING_DIRS+=("$dir")
    fi
done

if [ ${#MISSING_DIRS[@]} -eq 0 ]; then
    test_result 0 "Server directory structure complete"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Missing directories: ${MISSING_DIRS[*]}"
    test_result 0 "Server structure (some optional dirs missing)"
fi

# Test 10: Check for environment validation
echo "Test 10: Checking environment validation..."
if [ -f "server/config/validateEnv.js" ]; then
    test_result 0 "Environment validation configured"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: No environment validation found"
    test_result 1 "Environment validation missing"
fi

# Summary
echo ""
echo "=========================="
echo "📊 Test Summary"
echo "=========================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review PRE-DEPLOY-CHECKLIST.md"
    echo "2. Ensure environment variables are ready"
    echo "3. Push to your git repository"
    echo "4. Deploy to Render"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Review the failures above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Run 'npm install' to install dependencies"
    echo "- Run 'npm run build' to build the client"
    echo "- Check file structure matches expected layout"
    exit 1
fi
