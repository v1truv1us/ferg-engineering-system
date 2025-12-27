/**
 * Tests for research analysis functionality (Bun-compatible).
 *
 * NOTE: analysis.ts imports `readFile` directly from `fs/promises`, which makes
 * module-level mocking brittle. These tests instead create real temporary files
 * and point discovery results at them.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
    AnalysisHandler,
    CodebaseAnalyzer,
    ResearchAnalyzer,
} from "../../src/research/analysis.js";
import {
    ConfidenceLevel,
    type DiscoveryResult,
    ResearchDepth,
    type ResearchQuery,
    ResearchScope,
} from "../../src/research/types.js";

describe("CodebaseAnalyzer (Fixed)", () => {
    let analyzer: CodebaseAnalyzer;
    let mockConfig: any;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "analysis-fixed-"));

        mockConfig = {
            maxFileSize: 1024 * 1024,
            enableCaching: true,
        };

        analyzer = new CodebaseAnalyzer(mockConfig);
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it("should create analyzer with config", () => {
        expect(analyzer).toBeInstanceOf(CodebaseAnalyzer);
    });

    it("should analyze discovery results with real files", async () => {
        const filePath = join(tempDir, "file1.ts");
        await writeFile(
            filePath,
            `export class TestClass {
  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  // TODO: Implement this method
  public getValue(): string {
    return this.value;
  }
}

import { ExternalModule } from 'external-package';
`,
            "utf-8",
        );

        const mockDiscoveryResults: DiscoveryResult[] = [
            {
                source: "codebase-locator",
                files: [
                    {
                        path: filePath,
                        relevance: 0.8,
                        language: "typescript",
                    },
                ],
                patterns: [],
                documentation: [],
                executionTime: 100,
                confidence: ConfidenceLevel.HIGH,
            },
        ];

        const result = await analyzer.analyze(mockDiscoveryResults);

        expect(result).toHaveProperty("source", "codebase-analyzer");
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.evidence.length).toBeGreaterThan(0);
    });

    it("should handle empty discovery results", async () => {
        const result = await analyzer.analyze([]);

        expect(result.source).toBe("codebase-analyzer");
        expect(result.insights).toEqual([]);
        expect(result.evidence).toEqual([]);
        expect(result.relationships).toEqual([]);
    });

    it("should detect technical debt markers", async () => {
        const filePath = join(tempDir, "with-debt.ts");
        await writeFile(
            filePath,
            `class TestClass {
  // TODO: Implement proper error handling
  public method1() {}

  // FIXME: This is a temporary solution
  public method2() {}

  // TODO: Add validation
  public method3() {}
}
`,
            "utf-8",
        );

        const mockDiscoveryResults: DiscoveryResult[] = [
            {
                source: "codebase-locator",
                files: [
                    {
                        path: filePath,
                        relevance: 0.8,
                        language: "typescript",
                    },
                ],
                patterns: [],
                documentation: [],
                executionTime: 100,
                confidence: ConfidenceLevel.HIGH,
            },
        ];

        const result = await analyzer.analyze(mockDiscoveryResults);

        const debtInsight = result.insights.find(
            (i) => i.category === "technical-debt",
        );
        expect(debtInsight).toBeDefined();
        expect(debtInsight?.type).toBe("finding");
        expect(debtInsight?.title).toContain("Technical debt markers");
    });
});

describe("ResearchAnalyzer (Fixed)", () => {
    let analyzer: ResearchAnalyzer;
    let mockConfig: any;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "analysis-fixed-"));

        mockConfig = {
            maxFileSize: 1024 * 1024,
            enableCaching: true,
        };

        analyzer = new ResearchAnalyzer(mockConfig);
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it("should create analyzer with config", () => {
        expect(analyzer).toBeInstanceOf(ResearchAnalyzer);
    });

    it("should analyze documentation results", async () => {
        const docPath = join(tempDir, "docs.md");
        await writeFile(
            docPath,
            `# Test Documentation

This is a test document with some code examples:

\`\`\`typescript
const example = "test";
\`\`\`

See also the [related page](./other.md) for more information.

**Important note**: This is critical information.

TODO: Update this section
`,
            "utf-8",
        );

        const mockDiscoveryResults: DiscoveryResult[] = [
            {
                source: "research-locator",
                files: [],
                patterns: [
                    {
                        pattern: "test-pattern",
                        matches: [],
                        frequency: 10,
                        confidence: ConfidenceLevel.HIGH,
                        category: "test",
                    },
                ],
                documentation: [
                    {
                        path: docPath,
                        relevance: 0.9,
                        type: "markdown",
                    },
                ],
                executionTime: 150,
                confidence: ConfidenceLevel.HIGH,
            },
        ];

        const result = await analyzer.analyze(mockDiscoveryResults);

        expect(result).toHaveProperty("source", "research-analyzer");
        expect(result).toHaveProperty("insights");
        expect(result).toHaveProperty("evidence");
        expect(result).toHaveProperty("relationships");
        expect(result).toHaveProperty("confidence");
        expect(result).toHaveProperty("executionTime");
    });
});

describe("AnalysisHandler (Fixed)", () => {
    let handler: AnalysisHandler;
    let mockConfig: any;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "analysis-fixed-"));

        mockConfig = {
            maxFileSize: 1024 * 1024,
            enableCaching: true,
        };

        handler = new AnalysisHandler(mockConfig);
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it("should create handler with config", () => {
        expect(handler).toBeInstanceOf(AnalysisHandler);
    });

    it("should execute sequential analysis", async () => {
        const filePath = join(tempDir, "file.ts");
        await writeFile(
            filePath,
            `export class TestClass {
  constructor() {}
}
`,
            "utf-8",
        );

        const mockDiscoveryResults: DiscoveryResult[] = [
            {
                source: "codebase-locator",
                files: [
                    {
                        path: filePath,
                        relevance: 0.8,
                        language: "typescript",
                    },
                ],
                patterns: [],
                documentation: [],
                executionTime: 100,
                confidence: ConfidenceLevel.HIGH,
            },
        ];

        const mockQuery: ResearchQuery = {
            id: "test-query",
            query: "test query",
            scope: ResearchScope.CODEBASE,
            depth: ResearchDepth.MEDIUM,
        };

        const result = await handler.executeAnalysis(
            mockDiscoveryResults,
            mockQuery,
        );

        expect(result).toHaveProperty("codebaseAnalysis");
        expect(result).toHaveProperty("researchAnalysis");
        expect(result).toHaveProperty("combinedInsights");
        expect(result).toHaveProperty("combinedEvidence");
        expect(result).toHaveProperty("combinedRelationships");

        expect(result.codebaseAnalysis.source).toBe("codebase-analyzer");
        expect(result.researchAnalysis.source).toBe("research-analyzer");
    });

    it("should calculate analysis metrics", async () => {
        const mockResults = {
            codebaseAnalysis: {
                source: "codebase-analyzer",
                insights: [
                    { id: "insight1", confidence: ConfidenceLevel.HIGH },
                    { id: "insight2", confidence: ConfidenceLevel.MEDIUM },
                ],
                evidence: [
                    { id: "evidence1", confidence: ConfidenceLevel.HIGH },
                    { id: "evidence2", confidence: ConfidenceLevel.LOW },
                ],
                relationships: [],
                confidence: ConfidenceLevel.HIGH,
                executionTime: 200,
            },
            researchAnalysis: {
                source: "research-analyzer",
                insights: [
                    { id: "insight3", confidence: ConfidenceLevel.MEDIUM },
                ],
                evidence: [
                    { id: "evidence3", confidence: ConfidenceLevel.HIGH },
                ],
                relationships: [],
                confidence: ConfidenceLevel.MEDIUM,
                executionTime: 150,
            },
            combinedInsights: [
                { id: "insight1", confidence: ConfidenceLevel.HIGH },
                { id: "insight2", confidence: ConfidenceLevel.MEDIUM },
                { id: "insight3", confidence: ConfidenceLevel.MEDIUM },
            ],
            combinedEvidence: [
                { id: "evidence1", confidence: ConfidenceLevel.HIGH },
                { id: "evidence2", confidence: ConfidenceLevel.LOW },
                { id: "evidence3", confidence: ConfidenceLevel.HIGH },
            ],
            combinedRelationships: [],
        };

        const metrics = handler.getAnalysisMetrics(mockResults as any);

        expect(metrics).toHaveProperty("totalInsights");
        expect(metrics).toHaveProperty("totalEvidence");
        expect(metrics).toHaveProperty("totalRelationships");
        expect(metrics).toHaveProperty("averageConfidence");
        expect(metrics).toHaveProperty("executionTime");

        expect(metrics.totalInsights).toBe(3);
        expect(metrics.totalEvidence).toBe(3);
        expect(metrics.executionTime).toBe(350);
        expect(metrics.averageConfidence).toBeGreaterThan(0);
        expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
    });
});
