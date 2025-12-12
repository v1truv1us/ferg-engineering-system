---
date: 2025-12-11
researcher: Assistant
topic: Agent/Subagent Swarm Architecture for Engineering System
tags: [research, architecture, multi-agent, swarm, orchestration]
status: complete
confidence: 0.85
agents_used: [explore, web-search-researcher, system-architect]
---

## Synopsis

A comprehensive analysis of agent swarm architectures and how to evolve the Ferg Engineering System from centralized coordination to a hybrid swarm model enabling better agent collaboration.

## Summary

- **Current State**: The system uses centralized `AgentCoordinator` with simulated agent execution; no real inter-agent communication exists
- **Industry Best Practice**: Modern frameworks (OpenAI Agents SDK, LangGraph, AutoGen, CrewAI) converge on handoff-based swarms with shared context and capability-based routing
- **Recommended Approach**: Hybrid Swarm Architecture with central registry + decentralized execution
- **Integration Feasibility**: High - existing EventEmitter foundation and TypeScript codebase align well with recommended patterns
- **Migration Path**: 6-phase incremental evolution maintaining backward compatibility

## Detailed Findings

### Current System Architecture

#### Strengths
| Component | Capability | Location |
|-----------|-----------|----------|
| AgentCoordinator | Parallel/sequential execution, dependency resolution, caching, metrics | `src/agents/coordinator.ts` |
| ResearchOrchestrator | 3-phase workflow (Discovery → Analysis → Synthesis) | `src/research/orchestrator.ts` |
| SessionManager | Persistent session state with workbench abstraction | `src/context/session.ts` |
| MemoryManager | Three-tier memory (declarative, procedural, episodic) with confidence decay | `src/context/memory.ts` |
| Event-driven communication | EventEmitter-based progress and status updates | Throughout |

#### Critical Gaps
1. **Simulated Execution**: Agent invocation is mocked (`simulateAgentExecution()`) - no real agent dispatch
2. **Static Agent Registry**: Only 8 `AgentType` enum values vs 24 documented agents
3. **No Inter-Agent Communication**: All routing through central coordinator
4. **Disconnected Context**: Memory/session systems not integrated with agent decisions
5. **Code Quality Issues**: Duplicate code blocks, undefined variables in orchestrator

### Industry Best Practices (2024-2025)

#### Dominant Swarm Patterns

| Pattern | Framework | Key Mechanism | Best For |
|---------|-----------|---------------|----------|
| **Handoff-Based** | OpenAI Swarm/Agents SDK, AutoGen | Tool calls transfer control between agents | Decentralized, lightweight systems |
| **Supervisor/Hierarchical** | CrewAI, LangGraph | Manager agent coordinates specialists | Complex multi-step tasks |
| **Graph-Based Workflows** | LangGraph | Explicit state transitions as directed graph | Deterministic, auditable flows |
| **Selector Group Chat** | AutoGen | LLM-based speaker selection with shared context | Dynamic collaboration |

#### Core Concepts from Leading Frameworks

**OpenAI Agents SDK (Production-Ready)**
```typescript
// 5 Core Concepts
interface AgentSDKConcepts {
  agents: "LLMs with instructions, tools, guardrails, handoffs";
  handoffs: "Tool calls for transferring control between agents";
  guardrails: "Input/output validation";
  sessions: "Automatic conversation history management";
  tracing: "Built-in tracking of agent runs";
}
```

**AutoGen Swarm Pattern**
```typescript
// Decentralized task delegation with shared context
interface SwarmBehavior {
  delegation: "HandoffMessage signals next speaker";
  context: "All agents share same message history";
  selection: "Most recent HandoffMessage determines next agent";
}
```

**CrewAI Memory System**
```typescript
interface MemoryLayers {
  shortTerm: "RAG-based current context";
  longTerm: "SQLite for cross-session persistence";
  entity: "Relationship tracking";
  contextual: "Combines all memory types";
}
```

### Recommended Swarm Architecture

#### Hybrid Swarm Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      SwarmCoordinator                            │
│         (Workflow orchestration, saga patterns)                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ TaskBroker  │ │  Blackboard │ │ContextHub   │
    │ (Routing)   │ │  (Shared)   │ │ (Memory)    │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │
           ▼               ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                    SwarmRegistry                             │
    │    (Agent manifests, capabilities, health monitoring)        │
    └─────────────────────────────────────────────────────────────┘
           │
    ┌──────┴────────────────────────────────────────────┐
    ▼              ▼              ▼              ▼       ▼
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│Agent 1 │   │Agent 2 │   │Agent 3 │   │Agent N │...│Agent 24│
│Runtime │   │Runtime │   │Runtime │   │Runtime │   │Runtime │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘
```

#### New Components Required

| Component | Responsibility | Key Patterns |
|-----------|---------------|--------------|
| **SwarmRegistry** | Dynamic agent registration, capability indexing, health monitoring | Service Registry, Capability Manifest |
| **TaskBroker** | Capability-based routing, load balancing, result collection | Competing Consumers, Request-Reply |
| **SharedBlackboard** | Agent collaboration space, stigmergic coordination | Tuple Space, Pub-Sub |
| **AgentRuntime** | Individual agent execution, sandboxing, context injection | Actor Model, Capability Security |
| **SwarmCoordinator** | Workflow orchestration, saga patterns, compensation | Saga, Choreography |
| **ContextHub** | Unified context from session, memory, vectors | Cache-Aside, Lazy Loading |

#### Agent Manifest Schema

```typescript
interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: Capability[];
  handoffs?: string[];           // Agents this agent can delegate to
  tools: Tool[];
  instructions: string;
  healthEndpoint?: string;
  resourceLimits?: {
    timeout: number;
    maxTokens: number;
    maxConcurrent: number;
  };
}

interface Capability {
  name: string;
  description: string;
  inputs: ParameterSchema[];
  outputs: ParameterSchema[];
  confidence: number;            // How well agent handles this capability
}
```

#### Handoff Protocol

```typescript
interface HandoffMessage {
  type: 'handoff';
  source: string;                // Agent initiating handoff
  target: string;                // Agent receiving control
  reason: string;                // Why handoff is occurring
  context: Record<string, any>; // State to pass
  conversationId: string;        // For tracing
  timestamp: Date;
}

// Swarm execution loop
async function runSwarm(
  initialAgent: Agent,
  task: SwarmTask,
  options: SwarmOptions
): Promise<SwarmResult> {
  let currentAgent = initialAgent;
  let turn = 0;
  const messages: Message[] = [];
  
  while (turn < options.maxTurns) {
    const response = await currentAgent.execute(task, messages);
    messages.push(response);
    
    // Check for completion
    if (response.isComplete) {
      return { success: true, result: response.output, messages };
    }
    
    // Handle handoff
    if (response.handoff) {
      const nextAgent = await registry.getAgent(response.handoff.target);
      currentAgent = nextAgent;
      messages.push(createHandoffMessage(response.handoff));
    }
    
    turn++;
  }
  
  return { success: false, error: 'Max turns exceeded', messages };
}
```

## Code References

- `src/agents/coordinator.ts:40-74` - Current task execution flow (parallel/sequential/conditional)
- `src/agents/coordinator.ts:274-300` - Agent execution (currently simulated)
- `src/agents/coordinator.ts:328-367` - Topological sort for dependencies (keep this)
- `src/agents/types.ts:9-18` - AgentType enum (needs expansion to 24 agents)
- `src/agents/types.ts:122-127` - AggregationStrategy (good foundation for consensus)
- `src/research/orchestrator.ts:75-113` - 3-phase research workflow (model for swarm workflows)
- `src/research/discovery.ts:644-658` - Promise.allSettled pattern (reuse for parallel agents)
- `src/context/memory.ts:80-123` - Memory entry with provenance (extend for agent memory)
- `src/context/session.ts:77-96` - Session creation (extend for swarm sessions)

## Architecture Insights

### Communication Patterns Comparison

| Current System | Recommended Swarm |
|----------------|-------------------|
| EventEmitter broadcasts | Blackboard + targeted handoffs |
| Parameter passing | Shared context with subscriptions |
| Central coordinator routing | Capability-based + LLM selection |
| Synchronous phases | Async event-driven |

### State Management Evolution

```
Current:                          Recommended:
┌─────────────────┐               ┌─────────────────────────────────┐
│ SessionManager  │               │           ContextHub            │
│ MemoryManager   │  ──────────▶  │  ┌─────────┐ ┌───────────────┐  │
│ VectorManager   │               │  │ Session │ │ Memory        │  │
│ (Independent)   │               │  │ Manager │ │ (Short/Long)  │  │
│                 │               │  └─────────┘ └───────────────┘  │
└─────────────────┘               │  ┌─────────┐ ┌───────────────┐  │
                                  │  │ Vector  │ │ Entity        │  │
                                  │  │ Search  │ │ Relationships │  │
                                  │  └─────────┘ └───────────────┘  │
                                  └─────────────────────────────────┘
```

## Recommendations

### Immediate Actions

1. **Fix Code Quality Issues** (1-2 days)
   - Resolve `orchestrator.ts:235` undefined variable
   - Remove duplicate code in `retrieval.ts:287-312`
   - Align AgentType enum with documented 24 agents

2. **Create Agent Manifest Schema** (2-3 days)
   - Define TypeScript interface for agent capabilities
   - Generate manifests from existing markdown agent definitions
   - Validate all 24 agents have complete manifests

3. **Prototype SwarmRegistry** (1 week)
   - In-memory registry with capability indexing
   - Health check infrastructure
   - Replace enum lookups with registry queries

### Long-term Considerations

| Phase | Timeline | Key Deliverables | Risk |
|-------|----------|------------------|------|
| P1: Foundation | 2-3 weeks | SwarmRegistry, agent manifests, health checks | Low |
| P2: Task Broker | 3-4 weeks | Capability routing, task claiming, load balancing | Medium |
| P3: Blackboard | 2-3 weeks | Shared knowledge space, pub-sub, persistence | Medium |
| P4: Agent Runtime | 4-6 weeks | Real execution, sandboxing, context injection | High |
| P5: Swarm Coordinator | 3-4 weeks | Workflow language, saga patterns, compensation | Medium |
| P6: Observability | 2-3 weeks | OpenTelemetry, decision logging, dashboards | Low |

**Total Estimated Timeline: 4-6 months for full swarm capability**

### Integration with Existing System

| Existing Component | Integration Strategy |
|-------------------|---------------------|
| `AgentCoordinator` | Wrap with TaskBroker, gradually migrate task submission |
| `ResearchOrchestrator` | Convert phases to SwarmCoordinator workflows |
| `SessionManager` | Integrate into ContextHub, extend for swarm sessions |
| `MemoryManager` | Add agent-specific memory partitions, entity tracking |
| `EventEmitter` | Extend for blackboard notifications, keep for progress |
| Agent markdown files | Auto-generate manifests, maintain as source of truth |

## Risks & Limitations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Real agent execution complexity | High | High | Start with simplest agents, maintain simulation fallback |
| Blackboard pollution | Medium | Medium | TTL on entries, garbage collection, versioning |
| Task starvation for specialists | Medium | Medium | Priority queues, capability affinity, task aging |
| Migration breaks workflows | High | Medium | Feature flags, shadow mode, comprehensive tests |
| TypeScript framework limitations | Medium | Low | LangGraph.js available, OpenAI SDK has TS version |

## Open Questions

- [ ] Should we use existing LangGraph.js or build custom swarm framework?
- [ ] How to handle cross-agent context size limits (token budgets)?
- [ ] What's the right granularity for agent capabilities?
- [ ] Should blackboard entries be typed or schemaless?
- [ ] How to test swarm behavior at scale (agent simulation)?
- [ ] What observability tooling integrates best with TypeScript?

## External References

- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) - Production handoff patterns
- [LangGraph Multi-Agent Workflows](https://blog.langchain.dev/langgraph-multi-agent-workflows/) - Graph-based orchestration
- [AutoGen Swarm Documentation](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html) - Decentralized coordination
- [CrewAI Documentation](https://docs.crewai.com/) - Role-based collaboration patterns

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| Current state analysis | 0.90 | Based on direct code review |
| Industry best practices | 0.85 | From authoritative sources (OpenAI, Microsoft, LangChain) |
| Proposed architecture | 0.75 | Sound patterns but implementation details need validation |
| Migration feasibility | 0.70 | Depends on team capacity and real agent implementation |
| Timeline estimates | 0.60 | High variance based on unknown complexity |

**Overall Confidence: 0.85**