/**
 * Ferg Engineering System - OpenCode Plugin
 *
 * Provides hooks and tools for compounding engineering workflows:
 * - Planning and research
 * - Multi-agent code review
 * - SEO audits
 * - Deployment workflows
 */

import type { Plugin, PluginContext } from "@opencode-ai/plugin";

export default function fergEngineering(): Plugin {
  return {
    name: "ferg-engineering",
    version: "1.0.0",

    hooks: {
      // Log when commands are invoked
      onCommandStart: async (context: PluginContext, command: string) => {
        if (["plan", "review", "seo", "deploy", "work", "compound"].includes(command)) {
          console.log(`[ferg-engineering] Starting: ${command}`);
        }
      },

      // Validate environment on session start
      onSessionStart: async (context: PluginContext) => {
        console.log("[ferg-engineering] Session started. Ferg Engineering System ready.");
        console.log("[ferg-engineering] Available agents: plan, review, build");
        console.log("[ferg-engineering] Available commands: plan, review, seo, work, compound, deploy");
      },

      // Track completion of major workflows
      onSessionEnd: async (context: PluginContext) => {
        console.log("[ferg-engineering] Session ended.");
      },
    },

    // Custom tools can be added here if needed
    tools: [],
  };
}
