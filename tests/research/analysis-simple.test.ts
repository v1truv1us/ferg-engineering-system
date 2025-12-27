import { beforeEach, describe, expect, it } from "bun:test";

describe("Analysis Module Import", () => {
    it("should import types", async () => {
        const { ConfidenceLevel } = await import("../../src/research/types.js");
        expect(ConfidenceLevel).toBeDefined();
    });
});
