/**
 * Communication System for Agent Coordination
 *
 * Provides chatroom-style messaging between agents for collaboration,
 * handoff coordination, and real-time status updates.
 */

import { EventEmitter } from "node:events";
import type { MemoryManager } from "../context/memory.js";
import type { AgentType } from "./types.js";

export interface AgentMessage {
    id: string;
    from: AgentType;
    to: AgentType | "broadcast";
    type:
        | "status"
        | "request"
        | "response"
        | "handoff"
        | "notification"
        | "collaboration";
    content: any;
    timestamp: Date;
    correlationId?: string;
    priority: "low" | "medium" | "high" | "urgent";
}

export interface CommunicationChannel {
    id: string;
    participants: AgentType[];
    topic: string;
    messages: AgentMessage[];
    created: Date;
    active: boolean;
}

export interface HandoffRequest {
    id: string;
    fromAgent: AgentType;
    toAgent: AgentType;
    context: Record<string, any>;
    reason: string;
    priority: "low" | "medium" | "high" | "urgent";
    timestamp: Date;
}

export interface CollaborationSession {
    id: string;
    taskId: string;
    participants: AgentType[];
    status: "active" | "completed" | "failed";
    startTime: Date;
    endTime?: Date;
    messages: AgentMessage[];
    outcome?: any;
}

/**
 * Agent Communication Hub
 * Manages inter-agent messaging, handoffs, and collaboration sessions
 */
export class AgentCommunicationHub extends EventEmitter {
    private channels: Map<string, CommunicationChannel> = new Map();
    private activeSessions: Map<string, CollaborationSession> = new Map();
    private pendingHandoffs: Map<string, HandoffRequest> = new Map();
    private memoryManager: MemoryManager;
    private messageHistory: AgentMessage[] = [];

    constructor(memoryManager: MemoryManager) {
        super();
        this.memoryManager = memoryManager;
        this.setupEventHandlers();
    }

    /**
     * Send a message between agents
     */
    async sendMessage(
        message: Omit<AgentMessage, "id" | "timestamp">,
    ): Promise<string> {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const fullMessage: AgentMessage = {
            ...message,
            id: messageId,
            timestamp: new Date(),
        };

        // Store in memory
        await this.storeMessage(fullMessage);

        // Handle based on type
        if (message.to === "broadcast") {
            await this.broadcastMessage(fullMessage);
        } else {
            await this.deliverMessage(fullMessage);
        }

        this.emit("message_sent", fullMessage);
        return messageId;
    }

    /**
     * Create a collaboration session for multi-agent tasks
     */
    async createCollaborationSession(
        taskId: string,
        participants: AgentType[],
        topic: string,
    ): Promise<string> {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const session: CollaborationSession = {
            id: sessionId,
            taskId,
            participants,
            status: "active",
            startTime: new Date(),
            messages: [],
        };

        this.activeSessions.set(sessionId, session);

        // Create communication channel
        const channelId = await this.createChannel(participants, topic);
        session.messages.push({
            id: `init_${Date.now()}`,
            from: participants[0], // Coordinator
            to: "broadcast",
            type: "notification",
            content: { action: "session_started", sessionId, topic },
            timestamp: new Date(),
            priority: "medium",
        });

        this.emit("collaboration_started", session);
        return sessionId;
    }

    /**
     * Request a handoff between agents
     */
    async requestHandoff(
        request: Omit<HandoffRequest, "id" | "timestamp">,
    ): Promise<string> {
        const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const fullRequest: HandoffRequest = {
            ...request,
            id: handoffId,
            timestamp: new Date(),
        };

        this.pendingHandoffs.set(handoffId, fullRequest);

        // Send handoff message
        await this.sendMessage({
            from: request.fromAgent,
            to: request.toAgent,
            type: "handoff",
            content: {
                handoffId,
                context: request.context,
                reason: request.reason,
            },
            priority: request.priority,
            correlationId: handoffId,
        });

        this.emit("handoff_requested", fullRequest);
        return handoffId;
    }

    /**
     * Accept a handoff request
     */
    async acceptHandoff(
        handoffId: string,
        acceptingAgent: AgentType,
    ): Promise<void> {
        const request = this.pendingHandoffs.get(handoffId);
        if (!request) {
            throw new Error(`Handoff request ${handoffId} not found`);
        }

        // Send acceptance message
        await this.sendMessage({
            from: acceptingAgent,
            to: request.fromAgent,
            type: "response",
            content: { handoffId, accepted: true },
            priority: "high",
            correlationId: handoffId,
        });

        this.pendingHandoffs.delete(handoffId);
        this.emit("handoff_accepted", { handoffId, acceptingAgent });
    }

    /**
     * Complete a collaboration session
     */
    async completeSession(sessionId: string, outcome?: any): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.status = "completed";
        session.endTime = new Date();
        session.outcome = outcome;

        // Send completion message
        await this.sendMessage({
            from: session.participants[0], // Coordinator
            to: "broadcast",
            type: "notification",
            content: {
                action: "session_completed",
                sessionId,
                outcome,
            },
            priority: "medium",
        });

        this.emit("collaboration_completed", session);
    }

    /**
     * Get messages for an agent
     */
    getAgentMessages(agent: AgentType, limit = 50): AgentMessage[] {
        return this.messageHistory
            .filter(
                (msg) =>
                    msg.to === agent ||
                    msg.to === "broadcast" ||
                    msg.from === agent,
            )
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get active collaboration sessions
     */
    getActiveSessions(): CollaborationSession[] {
        return Array.from(this.activeSessions.values()).filter(
            (session) => session.status === "active",
        );
    }

    /**
     * Get pending handoffs for an agent
     */
    getPendingHandoffs(agent: AgentType): HandoffRequest[] {
        return Array.from(this.pendingHandoffs.values()).filter(
            (request) => request.toAgent === agent,
        );
    }

    private async createChannel(
        participants: AgentType[],
        topic: string,
    ): Promise<string> {
        const channelId = `channel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const channel: CommunicationChannel = {
            id: channelId,
            participants,
            topic,
            messages: [],
            created: new Date(),
            active: true,
        };

        this.channels.set(channelId, channel);
        return channelId;
    }

    private async broadcastMessage(message: AgentMessage): Promise<void> {
        // In a real implementation, this would send to all relevant agents
        // For now, just log and store
        console.log(
            `Broadcasting message from ${message.from}:`,
            message.content,
        );
    }

    private async deliverMessage(message: AgentMessage): Promise<void> {
        // In a real implementation, this would deliver to the specific agent
        // For now, just log and store
        console.log(
            `Delivering message from ${message.from} to ${message.to}:`,
            message.content,
        );

        // Add to relevant channels/sessions
        this.addMessageToChannels(message);
    }

    private addMessageToChannels(message: AgentMessage): void {
        for (const channel of this.channels.values()) {
            if (
                channel.active &&
                (channel.participants.includes(message.from) ||
                    (message.to !== "broadcast" &&
                        channel.participants.includes(message.to as AgentType)))
            ) {
                channel.messages.push(message);
            }
        }

        // Add to collaboration sessions
        for (const session of this.activeSessions.values()) {
            if (
                session.participants.includes(message.from) ||
                (message.to !== "broadcast" &&
                    session.participants.includes(message.to as AgentType))
            ) {
                session.messages.push(message);
            }
        }
    }

    private async storeMessage(message: AgentMessage): Promise<void> {
        this.messageHistory.push(message);

        // Store in memory system
        await this.memoryManager.addMemory(
            "episodic",
            `Agent communication: ${message.from} -> ${message.to} (${message.type})`,
            {
                source: "agent",
                context: `Communication between ${message.from} and ${message.to}`,
                tags: ["communication", message.type, message.from, message.to],
                confidence: 1.0,
            },
        );

        // Keep only recent messages
        if (this.messageHistory.length > 1000) {
            this.messageHistory = this.messageHistory.slice(-500);
        }
    }

    private setupEventHandlers(): void {
        this.on("message_sent", (message: AgentMessage) => {
            console.log(
                `📨 Message sent: ${message.from} -> ${message.to} [${message.type}]`,
            );
        });

        this.on("handoff_requested", (request: HandoffRequest) => {
            console.log(
                `🔄 Handoff requested: ${request.fromAgent} -> ${request.toAgent} (${request.reason})`,
            );
        });

        this.on("collaboration_started", (session: CollaborationSession) => {
            console.log(
                `🤝 Collaboration started: ${session.participants.join(", ")} for ${session.taskId}`,
            );
        });

        this.on("collaboration_completed", (session: CollaborationSession) => {
            console.log(
                `✅ Collaboration completed: ${session.id} with outcome:`,
                session.outcome,
            );
        });
    }

    /**
     * Get communication statistics
     */
    getStats(): {
        totalMessages: number;
        activeSessions: number;
        pendingHandoffs: number;
        activeChannels: number;
    } {
        return {
            totalMessages: this.messageHistory.length,
            activeSessions: this.activeSessions.size,
            pendingHandoffs: this.pendingHandoffs.size,
            activeChannels: Array.from(this.channels.values()).filter(
                (c) => c.active,
            ).length,
        };
    }
}

/**
 * Singleton instance
 */
let defaultHub: AgentCommunicationHub | null = null;

export function getAgentCommunicationHub(
    memoryManager?: MemoryManager,
): AgentCommunicationHub {
    if (!defaultHub && memoryManager) {
        defaultHub = new AgentCommunicationHub(memoryManager);
    }
    return defaultHub!;
}
