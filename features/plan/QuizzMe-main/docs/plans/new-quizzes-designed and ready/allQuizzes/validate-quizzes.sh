#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# QuizzMe Quiz Validation Workflow
# Version: 1.0.0
# ═══════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# Quiz directory (default to current)
QUIZ_DIR="${1:-.}"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "              QuizzMe Quiz Validation Workflow"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 1: ContributionEvent Integration
# ─────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[CHECK 1] ContributionEvent Integration${NC}"
echo "─────────────────────────────────────────────────────────────────────"

check_contribution_event() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Skip deprecated files
    if [[ "$filename" =~ ^(celebrity-soulmate-quiz\.html|krafttier-quiz\.html|social-role-quiz\.html|chinesisches-horoskop-v2\.html)$ ]]; then
        echo -e "  ${YELLOW}SKIP${NC} $filename (deprecated)"
        return 0
    fi
    
    TOTAL=$((TOTAL + 1))
    
    # Check for ContributionEvent markers
    if grep -q "sp.contribution.v1" "$file" 2>/dev/null; then
        if grep -q "buildContributionEvent" "$file" 2>/dev/null; then
            echo -e "  ${GREEN}PASS${NC} $filename"
            PASSED=$((PASSED + 1))
            return 0
        fi
    fi
    
    echo -e "  ${RED}FAIL${NC} $filename (missing ContributionEvent)"
    FAILED=$((FAILED + 1))
    return 1
}

# Find all quiz files
for file in "$QUIZ_DIR"/*.html "$QUIZ_DIR"/*.jsx; do
    [ -f "$file" ] || continue
    
    # Only check quiz files (not other HTML)
    if grep -q "quiz\|Quiz" "$file" 2>/dev/null; then
        check_contribution_event "$file" || true
    fi
done

echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 2: JSON Definition Files
# ─────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[CHECK 2] JSON Definition Files${NC}"
echo "─────────────────────────────────────────────────────────────────────"

JSON_COUNT=0
for file in "$QUIZ_DIR"/*.json; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")
    
    # Check if it's a quiz definition (has meta.id)
    if grep -q '"meta"' "$file" 2>/dev/null; then
        JSON_COUNT=$((JSON_COUNT + 1))
        
        # Validate JSON syntax
        if python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
            echo -e "  ${GREEN}VALID${NC} $filename"
        else
            echo -e "  ${RED}INVALID${NC} $filename (JSON syntax error)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

if [ $JSON_COUNT -eq 0 ]; then
    echo -e "  ${YELLOW}WARNING${NC} No JSON quiz definitions found"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "  Found ${JSON_COUNT} JSON definition(s)"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 3: Design System Conformity
# ─────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[CHECK 3] Design System Conformity${NC}"
echo "─────────────────────────────────────────────────────────────────────"

check_design_system() {
    local file="$1"
    local filename=$(basename "$file")
    local issues=0
    
    # Check for required fonts
    if ! grep -q "Cormorant Garamond\|Instrument Serif" "$file" 2>/dev/null; then
        issues=$((issues + 1))
    fi
    
    if ! grep -q "Inter\|Satoshi" "$file" 2>/dev/null; then
        issues=$((issues + 1))
    fi
    
    # Check for brand colors (at least gold accent)
    if ! grep -qE "#D2A95A|#d4a853|d2a95a|d4a853" "$file" 2>/dev/null; then
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        echo -e "  ${GREEN}PASS${NC} $filename"
    elif [ $issues -lt 2 ]; then
        echo -e "  ${YELLOW}WARN${NC} $filename ($issues design issue(s))"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "  ${RED}FAIL${NC} $filename (non-conformant design)"
    fi
}

for file in "$QUIZ_DIR"/*.html "$QUIZ_DIR"/*.jsx; do
    [ -f "$file" ] || continue
    
    if grep -q "quiz\|Quiz" "$file" 2>/dev/null; then
        check_design_system "$file"
    fi
done

echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 4: Scoring Logic Validation
# ─────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[CHECK 4] Scoring Logic Presence${NC}"
echo "─────────────────────────────────────────────────────────────────────"

check_scoring() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check for scoring patterns
    if grep -qE "scores\[|scores\.|calculateScore|calculateProfile|normalizeScore" "$file" 2>/dev/null; then
        echo -e "  ${GREEN}PASS${NC} $filename (has scoring logic)"
    else
        echo -e "  ${YELLOW}WARN${NC} $filename (no scoring logic found)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

for file in "$QUIZ_DIR"/*.html "$QUIZ_DIR"/*.jsx; do
    [ -f "$file" ] || continue
    
    if grep -q "quiz\|Quiz" "$file" 2>/dev/null; then
        check_scoring "$file"
    fi
done

echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 5: Share Functionality
# ─────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[CHECK 5] Share Functionality${NC}"
echo "─────────────────────────────────────────────────────────────────────"

for file in "$QUIZ_DIR"/*.html "$QUIZ_DIR"/*.jsx; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")
    
    if grep -q "quiz\|Quiz" "$file" 2>/dev/null; then
        if grep -qE "navigator\.share|shareResult|copyToClipboard|share_config" "$file" 2>/dev/null; then
            echo -e "  ${GREEN}PASS${NC} $filename"
        else
            echo -e "  ${YELLOW}WARN${NC} $filename (no share function)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

echo ""

# ─────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────

echo "═══════════════════════════════════════════════════════════════════"
echo "                        VALIDATION SUMMARY"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ContributionEvent Checks: ${GREEN}$PASSED passed${NC} / ${RED}$FAILED failed${NC}"
echo -e "  Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -lt 5 ]; then
    echo -e "  ${GREEN}✓ All critical checks passed${NC}"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "  ${YELLOW}⚠ Passed with warnings${NC}"
    exit 0
else
    echo -e "  ${RED}✗ Some checks failed - review required${NC}"
    exit 1
fi
