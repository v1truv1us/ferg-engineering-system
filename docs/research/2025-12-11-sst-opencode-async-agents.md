---
date: 2025-12-11
researcher: Assistant
topic: SST/OpenCode Async Agent Architecture
tags: [research, architecture, async, sst, opencode, serverless, aws]
status: complete
confidence: 0.85
agents_used: [explore, web-search-researcher, system-architect]
---

## Synopsis

The proposed SST/OpenCode async agent architecture shifts from local, synchronous agent execution to a distributed, event-driven serverless model using AWS infrastructure. This enables scalable agent swarms by leveraging WebSocket APIs, SQS queues, EventBridge event buses, and Lambda/Fargate workers, transforming the current local CLI-based system into a cloud-native platform capable of handling complex, multi-agent workflows at scale.

## Summary

- **Architecture Shift**: Move from in-memory local execution to serverless AWS infrastructure managed by SST
- **Key Components**: WebSocket API for client connections, SQS for task queuing, EventBridge for event routing, Lambda/Fargate for scalable workers
- **Execution Model**: Async remote processing with persistent state, enabling swarm capabilities from previous research
- **Current vs Proposed**: Local execution (limited resources, ephemeral state) vs distributed (scalable, persistent, higher latency)
- **Implementation Approach**: Incremental migration with new execution strategies and infrastructure-as-code

## Detailed Findings

### Architecture

The proposed architecture consists of four main AWS components orchestrated by SST:

1. **WebSocket API (API Gateway)**: Handles real-time bidirectional communication between the local CLI client and cloud infrastructure
2. **SQS Queue**: Acts as a durable task queue for agent execution requests, enabling decoupling and scalability
3. **EventBridge**: Serves as the event bus for routing execution events, progress updates, and inter-agent communication
4. **Lambda/Fargate Workers**: Serverless compute environments that execute agent logic, with Lambda for lightweight tasks and Fargate for more complex workloads

This infrastructure enables the "swarm" capabilities identified in previous research by providing a scalable runtime environment for distributed agent coordination.

### Component Breakdown

- **OpenCode Plugin**: Client-side adapter that integrates with the existing `AgentCoordinator` to dispatch tasks to the cloud instead of using the local `ExecutorBridge`. Maintains backward compatibility while adding remote execution capability.

- **SST Config**: Infrastructure-as-Code definition using SST framework to provision and manage AWS resources. Defines the WebSocket API, SQS queue, EventBridge rules, and Lambda/Fargate functions with proper IAM roles and networking.

- **Worker Logic**: Cloud-hosted version of the agent execution logic that processes tasks from SQS, executes agents using shared `src/agents/` code, and emits events to EventBridge for progress tracking and result delivery.

### Comparison

| Aspect | Current Local Execution | Proposed Async Architecture |
|--------|------------------------|------------------------------|
| **Execution Model** | Synchronous in-memory Promises via `AgentCoordinator` | Asynchronous remote processing via SQS/EventBridge |
| **Scalability** | Limited by local machine resources (CPU, memory) | Elastic scaling via AWS Lambda/Fargate auto-scaling |
| **State Management** | Ephemeral in-memory state, lost on process restart | Persistent state via DynamoDB (implied) or event logs |
| **Latency** | Low (<100ms for local tasks) | Higher (network + cold start overhead) |
| **Throughput** | Limited by single process concurrency | High (thousands of concurrent tasks via cloud scaling) |
| **Reliability** | Dependent on local machine stability | Cloud-native fault tolerance and redundancy |
| **Debugging** | Direct local debugging | Distributed tracing via CloudWatch/EventBridge |

### Implementation Plan

1. **Infrastructure Setup**:
   - Create `sst.config.ts` in project root defining AWS resources
   - Define WebSocket API, SQS queue, EventBridge bus, and worker functions
   - Set up IAM roles and permissions for secure resource access

2. **Execution Strategy Interface**:
   - Add `ExecutionStrategy` interface in `src/agents/types.ts` with `Local` and `Remote` implementations
   - Refactor `AgentCoordinator` to accept execution strategy parameter
   - Implement `RemoteExecutionStrategy` that pushes tasks to SQS

3. **Client-Side Changes**:
   - Modify `AgentCoordinator` to support strategy-based execution
   - Create `RemoteExecutorBridge` in `src/agents/` for cloud task submission
   - Add WebSocket client for real-time progress updates

4. **Worker Implementation**:
   - Create worker entry points that reuse existing `src/agents/` logic
   - Implement SQS message processing and EventBridge event emission
   - Add error handling and retry logic for failed tasks

5. **State Persistence**:
   - Implement session state storage in DynamoDB
   - Add event logging for audit trails and debugging
   - Enable session resumption across client restarts

## Code References

- `src/agents/coordinator.ts:46-80` - Current `executeTasks` method using local Promise-based execution
- `src/agents/coordinator.ts:280-283` - `executeAgent` method calling `executorBridge.execute()` (currently local)
- `src/execution/task-executor.ts:74-85` - Task execution flow with dependency resolution
- `src/execution/task-executor.ts:373-383` - Agent task execution via `agentCoordinator.executeTask()`
- `docs/research/2025-12-11-agent-swarm-architecture.md:87-117` - Hybrid Swarm Architecture proposal
- `docs/research/2025-12-11-swarms-integration-research.md:396-430` - Hybrid Architecture Implementation plan

## Recommendations

### Immediate Actions

1. **Initialize SST Configuration**:
   - Create `sst.config.ts` in project root with basic AWS resource definitions
   - Start with minimal infrastructure (WebSocket API + SQS queue)
   - Test local SST deployment and resource provisioning

2. **Define Execution Strategy Interface**:
   - Add `ExecutionStrategy` interface to `src/agents/types.ts`
   - Implement `LocalExecutionStrategy` wrapper for existing logic
   - Create skeleton `RemoteExecutionStrategy` class

3. **Prototype Remote Executor Bridge**:
   - Create `RemoteExecutorBridge` class in `src/agents/`
   - Implement basic SQS task submission logic
   - Add WebSocket client for progress updates

### Long-term Considerations

1. **State Persistence Infrastructure**:
   - Implement DynamoDB tables for session and task state
   - Add event sourcing pattern for audit trails
   - Enable cross-session context sharing for swarm intelligence

2. **Authentication and Security**:
   - Add Cognito/OIDC integration for WebSocket API authentication
   - Implement fine-grained IAM permissions for different agent types
   - Add encryption for sensitive task data and results

3. **Observability and Monitoring**:
   - Set up CloudWatch dashboards for performance metrics
   - Implement distributed tracing across Lambda/Fargate workers
   - Add alerting for failed tasks and performance degradation

4. **Cost Optimization**:
   - Implement Lambda provisioned concurrency for frequently used agents
   - Use Fargate spot instances for cost-effective long-running tasks
   - Add usage monitoring and budget alerts

5. **Multi-Region Deployment**:
   - Design for global distribution with region-specific worker pools
   - Implement cross-region EventBridge routing for resilience
   - Add latency-based routing for optimal performance

## Risks & Limitations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Network Latency** | Higher response times for small tasks | High | Optimize WebSocket connections, implement local caching, use Lambda@Edge for global distribution |
| **Cold Start Overhead** | Initial execution delays for Lambda workers | Medium | Use provisioned concurrency, implement warm-up strategies, consider Fargate for consistent workloads |
| **Distributed Debugging Complexity** | Harder to debug issues across multiple services | High | Implement comprehensive logging, use CloudWatch Insights, add correlation IDs for request tracing |
| **AWS Service Limits** | Potential throttling or quota issues | Medium | Monitor usage against AWS limits, implement exponential backoff, design for graceful degradation |
| **Cost Scaling** | Unexpected costs from high usage | Medium | Set up detailed cost monitoring, implement usage quotas, add cost optimization strategies |
| **State Consistency** | Potential race conditions in distributed state | Low | Use DynamoDB transactions, implement optimistic locking, add conflict resolution logic |
| **Vendor Lock-in** | Heavy AWS dependency | Medium | Design with abstraction layers, consider multi-cloud options, maintain local execution fallback |

## Open Questions

- [ ] How to handle agent-specific resource requirements (memory, CPU) in Lambda vs Fargate sizing?
- [ ] What's the optimal balance between Lambda (fast startup) and Fargate (consistent performance) for different agent types?
- [ ] How to implement efficient session resumption when clients disconnect and reconnect?
- [ ] What's the best approach for handling large agent outputs that exceed WebSocket message limits?
- [ ] How to ensure data privacy and compliance (GDPR, HIPAA) in the cloud environment?
- [ ] What's the migration strategy for existing local-only workflows and user expectations?

## External References

- [SST Documentation](https://sst.dev/) - Serverless Stack framework for AWS infrastructure
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html) - Performance optimization and cold start mitigation
- [Amazon EventBridge Patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-patterns.html) - Event-driven architecture patterns
- [WebSocket API Gateway Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html) - Real-time API implementation

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| **Architecture Design** | 0.90 | Based on proven AWS serverless patterns and SST framework capabilities |
| **Current System Analysis** | 0.95 | Direct code review of coordinator and executor components |
| **Migration Feasibility** | 0.80 | Incremental approach reduces risk, but distributed complexity adds uncertainty |
| **Performance Impact** | 0.75 | Network latency is predictable, but cold starts and scaling behavior need validation |
| **Cost Estimation** | 0.70 | AWS pricing models are complex; actual costs depend on usage patterns |
| **Timeline Accuracy** | 0.85 | Based on similar serverless migration projects, but team capacity affects delivery |

**Overall Confidence: 0.85** - Strong technical foundation with clear implementation path, but execution details need prototyping validation.