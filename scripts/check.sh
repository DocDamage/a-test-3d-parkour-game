#!/bin/bash
# check.sh — Mechanical validation for agent-generated code.
# Run this before committing to catch syntax errors and file size violations.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
JS_DIR="${REPO_ROOT}/js"

ERRORS=0

echo "=== Syntax Check (node -c) ==="
for f in "${JS_DIR}"/*.js; do
    if ! node -c "$f" > /dev/null 2>&1; then
        echo "  FAIL: $(basename "$f")"
        ERRORS=$((ERRORS + 1))
    fi
done

echo "=== File Size Check ==="
MAX_LINES=2000
for f in "${JS_DIR}"/*.js; do
    LINES=$(wc -l < "$f")
    if [ "$LINES" -gt "$MAX_LINES" ]; then
        echo "  WARN: $(basename "$f") has ${LINES} lines (max ${MAX_LINES})"
    fi
done

echo "=== Module Count Check ==="
MODULE_COUNT=$(ls -1 "${JS_DIR}"/*.js 2>/dev/null | wc -l)
echo "  ${MODULE_COUNT} JS modules"

echo "=== Docs Freshness Check ==="
for doc in ARCHITECTURE.md DESIGN.md QUALITY.md; do
    if [ ! -f "${REPO_ROOT}/docs/${doc}" ]; then
        echo "  FAIL: docs/${doc} missing"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo "${ERRORS} error(s) found. Fix before committing."
    exit 1
fi

echo ""
echo "All checks passed."
