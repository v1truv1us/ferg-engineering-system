# Decision Record: Local vs. Cloud Execution Strategy

**Date:** 2025-12-11  
**Status:** Accepted  
**Target Release:** v0.3.0

## Context

As part of the architectural planning for the v0.3.0 release of the AI Engineering System, we evaluated two primary execution models for agent swarms and long-running tasks:

1.  **Local Execution**: Running all agents, swarms, and tasks directly on the user's machine (via Bun/Node.js).
2.  **Cloud Execution**: Offloading heavy tasks to a cloud environment, specifically investigating an SST (Serverless Stack) architecture on AWS to support async agents and distributed processing.

The research included an analysis of the "SST OpenCode Async Agents" pattern, which offers scalability and persistence but introduces significant infrastructure complexity.

## Decision

We have decided to **stick with Local Execution** for the v0.3.0 release.

All agent coordination, swarm execution, and task processing will occur within the local runtime environment. The system will not require any external cloud infrastructure (AWS, Azure, etc.) to function.

## Rationale

This decision is driven by the following factors:

*   **Cost**: Local execution incurs zero additional infrastructure costs. As this is primarily a personal productivity tool and developer utility, avoiding monthly cloud bills for compute resources is a significant advantage.
*   **Complexity**: Implementing a robust serverless architecture (Lambda, DynamoDB, SQS, EventBridge) introduces substantial overhead. For a single-user tool, the maintenance burden of a cloud stack outweighs the benefits of scalability.
*   **Privacy**: Keeping execution local ensures that sensitive codebase data, API keys, and intellectual property never leave the user's machine (except for necessary calls to LLM providers).
*   **Simplicity**: Local execution eliminates network latency, distributed system failure modes, and the complexity of debugging across boundaries. It allows for a faster "edit-refresh" cycle during development of the tool itself.

## Future Path

While we are choosing local execution for now, the Cloud/SST architecture remains a valid candidate for future iterations (v0.4.0+). We may revisit this decision if:

*   **Workload Capacity**: Agent swarms become too computationally intensive or memory-hungry for a standard developer laptop.
*   **Duration**: We introduce long-running autonomous tasks that need to persist beyond a single terminal session or survive system restarts.
*   **Collaboration**: The tool evolves to support multi-user collaboration where shared state and remote execution become necessary.

We have already designed the **Hybrid Architecture** (see `docs/research/2025-12-11-sst-opencode-async-agents.md`) which allows us to plug in a remote executor later without rewriting the core agent logic. This "Local First, Cloud Optional" strategy gives us the best of both worlds.

## Consequences

*   **Positive**: Faster release cycle for v0.3.0; easier installation for users (no AWS credentials needed); lower operating costs.
*   **Negative**: Long-running tasks will block the local terminal or consume local resources; limited by the host machine's hardware.
