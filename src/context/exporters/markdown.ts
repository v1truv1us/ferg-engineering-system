/**
 * Markdown exporter for CommandContextEnvelope.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CommandContextEnvelope, ContextConfig } from "../types";
import type { ContextExporter } from "./types";

function pad2(n: number): string {
    return n.toString().padStart(2, "0");
}

function fileSafe(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatTimestampForFile(d: Date): string {
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function toMarkdown(envelope: CommandContextEnvelope): string {
    const lines: string[] = [];

    lines.push(`# Command Envelope: ${envelope.commandName}`);
    lines.push("");
    lines.push(`- **ID:** ${envelope.id}`);
    lines.push(`- **Created:** ${envelope.createdAt}`);
    lines.push(`- **Status:** ${envelope.status}`);
    lines.push(`- **Duration:** ${envelope.durationMs}ms`);

    if (envelope.project) lines.push(`- **Project:** ${envelope.project}`);
    if (envelope.sessionId) lines.push(`- **Session:** ${envelope.sessionId}`);

    if (envelope.tags?.length) {
        lines.push(`- **Tags:** ${envelope.tags.join(", ")}`);
    }

    if (envelope.inputs && Object.keys(envelope.inputs).length > 0) {
        lines.push("");
        lines.push("## Inputs");
        lines.push("```json");
        lines.push(JSON.stringify(envelope.inputs, null, 2));
        lines.push("```");
    }

    if (envelope.outputSummary) {
        lines.push("");
        lines.push("## Output Summary");
        lines.push(envelope.outputSummary);
    }

    if (envelope.filesTouched && envelope.filesTouched.length > 0) {
        lines.push("");
        lines.push("## Files Touched");
        envelope.filesTouched.forEach((f) => lines.push(`- ${f}`));
    }

    if (envelope.decisions && envelope.decisions.length > 0) {
        lines.push("");
        lines.push("## Decisions");
        envelope.decisions.forEach((d) => lines.push(`- ${d}`));
    }

    if (envelope.error) {
        lines.push("");
        lines.push("## Error");
        lines.push("```");
        lines.push(
            `${envelope.error.name ?? "Error"}: ${envelope.error.message}`,
        );
        if (envelope.error.stack) {
            lines.push("");
            lines.push(envelope.error.stack);
        }
        lines.push("```");
    }

    lines.push("");
    return lines.join("\n");
}

export class MarkdownContextExporter implements ContextExporter {
    private outputDir: string;

    constructor(config: ContextConfig) {
        this.outputDir =
            config.export?.markdown?.outputDir || ".ai-context/exports";
    }

    async exportEnvelope(envelope: CommandContextEnvelope): Promise<void> {
        await mkdir(this.outputDir, { recursive: true });

        const created = new Date(envelope.createdAt);
        const prefix = formatTimestampForFile(created);
        const fileName = `${prefix}_${fileSafe(envelope.commandName)}_${fileSafe(envelope.id)}.md`;

        const path = join(this.outputDir, fileName);
        await writeFile(path, toMarkdown(envelope), "utf-8");
    }
}
