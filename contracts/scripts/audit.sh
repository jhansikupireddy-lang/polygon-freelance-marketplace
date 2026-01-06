#!/bin/bash

# Polygon Freelance Marketplace Audit Script
# Runs Slither, Mythril, and Echidna

mkdir -p audit-reports

echo "Running Slither..."
slither . --config-file .slither.json > audit-reports/slither-summary.txt 2>&1

echo "Running Mythril..."
myth analyze contracts/contracts/FreelanceEscrow.sol --execution-timeout 600 > audit-reports/mythril-results.txt 2>&1

echo "Running Echidna..."
echidna . --config echidna.yaml --contract Invariants --test-limit 10000 > audit-reports/echidna-results.txt 2>&1

echo "Audit reports generated in /audit-reports"
