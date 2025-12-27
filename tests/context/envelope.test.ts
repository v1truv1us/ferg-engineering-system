#!/usr/bin/env bun

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MarkdownContextExporter } from "../../src/context/exporters/markdown";
import { MemoryManager } from "../../src/context/memory";
import { createCommandEnvelope } from "../../src/context/types";

function makeTempDir(): string {
    const id = crypto.randomUUID();
    return join(tmpdir(), `ai-eng-envelope-test-${id}`);
}

describe("CommandContextEnvelope", () => {
    let tempDir: string;
    let previousSilentEnv: string | undefined;

    beforeEach(() => {
        previousSilentEnv = process.env.AI_ENG_SILENT;
        process.env.AI_ENG_SILENT = "1";

        tempDir = makeTempDir();
        mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }

        if (previousSilentEnv === undefined) {
            process.env.AI_ENG_SILENT = undefined;
        } else {
            process.env.AI_ENG_SILENT = previousSilentEnv;
        }

        previousSilentEnv = undefined;
    });

    it("stores and retrieves latest envelope via MemoryManager", async () => {
        const memory = new MemoryManager({ storagePath: tempDir });
        await memory.initialize();

        const envelope = createCommandEnvelope({
            commandName: "validate",
            status: "success",
            startTimeMs: Date.now() - 25,
            endTimeMs: Date.now(),
            inputs: { file: "plan.yaml" },
            outputSummary: "Validated plan",
        });

        await memory.storeCommandEnvelope(envelope);

        const latest = memory.getLatestCommandEnvelope({
            commandName: "validate",
        });
        expect(latest).toBeDefined();
        expect(latest?.commandName).toBe("validate");
        expect(latest?.status).toBe("success");
        expect(latest?.tags).toContain("command-envelope");
        expect(latest?.tags).toContain("command:validate");
    });

    it("exports markdown to configured outputDir", async () => {
        const outputDir = join(tempDir, "exports");

        const exporter = new MarkdownContextExporter({
            storagePath: tempDir,
            maxMemoriesPerType: 100,
            sessionArchiveDays: 30,
            confidenceDecayRate: 0.05,
            enableEmbeddings: false,
            defaultSkillTier: 1,
            enableAutoInference: true,
            export: {
                enabled: true,
                markdown: {
                    outputDir,
                },
            },
        });

        const envelope = createCommandEnvelope({
            commandName: "report",
            status: "failure",
            startTimeMs: Date.now() - 10,
            endTimeMs: Date.now(),
            inputs: { file: "missing.json" },
            error: new Error("Report missing"),
        });

        await exporter.exportEnvelope(envelope);

        expect(existsSync(outputDir)).toBe(true);
        const files = readdirSync(outputDir);
        expect(files.length).toBe(1);

        const md = readFileSync(join(outputDir, files[0]), "utf-8");
        expect(md).toContain("# Command Envelope: report");
        expect(md).toContain("**Status:** failure");
        expect(md).toContain("Report missing");
    });
});
