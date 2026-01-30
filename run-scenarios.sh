#!/usr/bin/env bash
#
# run-scenarios.sh
# Run PDE MCP scenarios with an LLM agent
#
# Usage:
#   ./run-scenarios.sh [scenario-number]
#
# Examples:
#   ./run-scenarios.sh       # Run all scenarios
#   ./run-scenarios.sh 01    # Run scenario 01 only
#   ./run-scenarios.sh 03    # Run scenario 03 only
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIOS_DIR="${SCRIPT_DIR}/scenarios"
DIST_DIR="${SCRIPT_DIR}/dist"
MCP_CONFIG="${SCRIPT_DIR}/mcp-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dist folder exists
check_build() {
    if [[ ! -d "${DIST_DIR}" ]] || [[ ! -f "${DIST_DIR}/index.js" ]]; then
        echo_warn "Build not found. Running npm build..."
        cd "${SCRIPT_DIR}"
        npm run build
    else
        echo_info "Build found at ${DIST_DIR}"
    fi
}

# Check if MCP config exists
check_config() {
    if [[ ! -f "${MCP_CONFIG}" ]]; then
        echo_error "MCP config not found at ${MCP_CONFIG}"
        exit 1
    fi
    echo_info "MCP config found at ${MCP_CONFIG}"
}

# Run a single scenario
run_scenario() {
    local scenario_file="$1"
    local scenario_name=$(basename "${scenario_file}" .md)
    
    echo ""
    echo "========================================"
    echo -e "${BLUE}Running Scenario: ${scenario_name}${NC}"
    echo "========================================"
    echo ""
    
    # Display scenario content
    echo_info "Scenario content:"
    echo "----------------------------------------"
    head -50 "${scenario_file}"
    echo "..."
    echo "----------------------------------------"
    echo ""
    
    # Extract key test prompts from scenario
    echo_info "Key test prompts from this scenario:"
    grep -A1 '```$' "${scenario_file}" 2>/dev/null | grep -v '^```' | grep -v '^--$' | head -10 || true
    echo ""
    
    # For automated testing, we can call the MCP server directly
    # In practice, an LLM agent would use this
    echo_info "To test this scenario with an LLM agent:"
    echo "  1. Start the MCP server: node ${DIST_DIR}/index.js"
    echo "  2. Connect your LLM agent with config: ${MCP_CONFIG}"
    echo "  3. Follow the test steps in: ${scenario_file}"
    echo ""
    
    echo_success "Scenario ${scenario_name} loaded successfully"
}

# Run unit tests
run_tests() {
    echo ""
    echo "========================================"
    echo -e "${BLUE}Running Unit Tests${NC}"
    echo "========================================"
    echo ""
    
    cd "${SCRIPT_DIR}"
    
    if npm run test 2>&1; then
        echo_success "All tests passed!"
    else
        echo_error "Some tests failed"
        return 1
    fi
}

# Main function
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║  PDE-MCP Scenario Runner                      ║"
    echo "║  Prompt Decomposition Engine Test Suite       ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    
    # Check prerequisites
    check_build
    check_config
    
    # Run unit tests first
    echo_info "Running unit tests to verify build..."
    run_tests || echo_warn "Unit tests had issues, continuing anyway..."
    
    # Get scenario filter
    local scenario_filter="${1:-}"
    
    # Find and run scenarios
    if [[ -n "${scenario_filter}" ]]; then
        # Run specific scenario
        local scenario_file="${SCENARIOS_DIR}/${scenario_filter}-*.md"
        if ls ${scenario_file} 1>/dev/null 2>&1; then
            for f in ${scenario_file}; do
                run_scenario "$f"
            done
        else
            echo_error "Scenario ${scenario_filter} not found in ${SCENARIOS_DIR}"
            echo_info "Available scenarios:"
            ls -1 "${SCENARIOS_DIR}"/*.md 2>/dev/null | while read f; do
                echo "  - $(basename "$f" .md)"
            done
            exit 1
        fi
    else
        # Run all scenarios
        echo_info "Running all scenarios..."
        for scenario_file in "${SCENARIOS_DIR}"/*.md; do
            if [[ -f "${scenario_file}" ]]; then
                run_scenario "${scenario_file}"
            fi
        done
    fi
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}All scenarios processed!${NC}"
    echo "========================================"
    echo ""
    echo "To use PDE-MCP with your LLM agent:"
    echo ""
    echo "  1. Add to your MCP configuration:"
    echo "     {\"pde\": {\"command\": \"node\", \"args\": [\"${DIST_DIR}/index.js\"]}}"
    echo ""
    echo "  2. Available tools:"
    echo "     - pde_decompose: Decompose complex prompts"
    echo "     - pde_get_plan: Retrieve execution plans"
    echo "     - pde_validate_plan: Validate plan coherence"
    echo "     - pde_get_checkpoint: Get recovery checkpoints"
    echo "     - pde_list_workflows: List all workflows"
    echo ""
    echo "  3. Available resources:"
    echo "     - pde://ceremonies/medicine-wheel"
    echo "     - pde://schemas/intent-types"
    echo "     - pde://templates/workflow-stages"
    echo ""
    echo "  4. Available prompts:"
    echo "     - pde-intent-extraction"
    echo "     - pde-dependency-analysis"
    echo "     - pde-wheel-assignment"
    echo "     - pde-workflow-generation"
    echo "     - pde-execution-plan"
    echo ""
}

# Run main function
main "$@"
