/**
 * Progressive Disclosure Architecture (PDA)
 *
 * Implements 3-tier skill loading to reduce token usage by ~90%.
 * Based on Claude Skills research by Rick Hightower.
 *
 * Tier 1: Metadata (always loaded) - ~50 tokens
 * Tier 2: Instructions (loaded on demand) - ~500 tokens
 * Tier 3: Resources (loaded when needed) - ~2000+ tokens
 */

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type {
    LoadedSkill,
    SkillContent,
    SkillMetadata,
    SkillTier,
} from "./types";

export class ProgressiveSkillLoader {
    private skillsDir: string;
    private loadedCache: Map<string, LoadedSkill> = new Map();

    constructor(skillsDir = "./skills") {
        this.skillsDir = skillsDir;
    }

    /**
     * Parse YAML frontmatter from skill markdown
     */
    private parseFrontmatter(content: string): {
        meta: Record<string, any>;
        body: string;
    } {
        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!match) {
            return { meta: {}, body: content };
        }

        const [, frontmatter, body] = match;
        const meta: Record<string, any> = {};

        for (const line of frontmatter.split("\n")) {
            const colonIndex = line.indexOf(":");
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim();
                let value: any = line.slice(colonIndex + 1).trim();

                // Parse booleans and numbers
                if (value === "true") value = true;
                else if (value === "false") value = false;
                else if (!Number.isNaN(Number(value))) value = Number(value);

                meta[key] = value;
            }
        }

        return { meta, body: body.trim() };
    }

    /**
     * Extract tier content from markdown
     * Tier markers: <!-- tier:2 --> and <!-- tier:3 -->
     */
    private extractTierContent(body: string): {
        overview: string;
        instructions?: string;
        resources?: string;
    } {
        const tier2Match = body.match(
            /<!--\s*tier:2\s*-->([\s\S]*?)(?=<!--\s*tier:3\s*-->|$)/,
        );
        const tier3Match = body.match(/<!--\s*tier:3\s*-->([\s\S]*)$/);

        // Everything before tier:2 marker is overview
        const overviewEnd = body.indexOf("<!-- tier:2 -->");
        const overview =
            overviewEnd > -1
                ? body.substring(0, overviewEnd).trim()
                : body.trim();

        return {
            overview,
            instructions: tier2Match ? tier2Match[1].trim() : undefined,
            resources: tier3Match ? tier3Match[1].trim() : undefined,
        };
    }

    /**
     * Estimate tokens for content (rough approximation)
     * ~1 token per 4 characters
     */
    private estimateTokens(content: string): number {
        return Math.ceil(content.length / 4);
    }

    /**
     * Load skill metadata only (Tier 1)
     */
    async loadSkillMetadata(skillPath: string): Promise<SkillMetadata | null> {
        if (!existsSync(skillPath)) {
            return null;
        }

        try {
            const content = await readFile(skillPath, "utf-8");
            const { meta } = this.parseFrontmatter(content);

            return {
                name: meta.name || "unknown",
                description: meta.description || "",
                tier: meta.tier || 1,
                capabilities: meta.capabilities || [],
                path: skillPath,
            };
        } catch (error) {
            console.error(
                `Failed to load skill metadata from ${skillPath}:`,
                error,
            );
            return null;
        }
    }

    /**
     * Load skill with specified tiers
     */
    async loadSkill(
        skillPath: string,
        tiers: SkillTier[] = [1],
    ): Promise<LoadedSkill | null> {
        // Check cache
        const cacheKey = `${skillPath}:${tiers.join(",")}`;
        if (this.loadedCache.has(cacheKey)) {
            return this.loadedCache.get(cacheKey)!;
        }

        if (!existsSync(skillPath)) {
            return null;
        }

        try {
            const content = await readFile(skillPath, "utf-8");
            const { meta, body } = this.parseFrontmatter(content);
            const tierContent = this.extractTierContent(body);

            const metadata: SkillMetadata = {
                name: meta.name || "unknown",
                description: meta.description || "",
                tier: meta.tier || 1,
                capabilities: meta.capabilities || [],
                path: skillPath,
            };

            // Build content based on requested tiers
            const contentParts: string[] = [];
            let tokenEstimate = 0;

            if (tiers.includes(1)) {
                contentParts.push(tierContent.overview);
                tokenEstimate += this.estimateTokens(tierContent.overview);
            }

            if (tiers.includes(2) && tierContent.instructions) {
                contentParts.push(tierContent.instructions);
                tokenEstimate += this.estimateTokens(tierContent.instructions);
            }

            if (tiers.includes(3) && tierContent.resources) {
                contentParts.push(tierContent.resources);
                tokenEstimate += this.estimateTokens(tierContent.resources);
            }

            const loaded: LoadedSkill = {
                metadata,
                loadedTiers: tiers,
                content: contentParts.join("\n\n"),
                tokenEstimate,
            };

            // Cache the result
            this.loadedCache.set(cacheKey, loaded);

            return loaded;
        } catch (error) {
            console.error(`Failed to load skill from ${skillPath}:`, error);
            return null;
        }
    }

    /**
     * Load all skills in a directory with specified tiers
     */
    async loadSkillsInDirectory(
        dir: string,
        tiers: SkillTier[] = [1],
    ): Promise<LoadedSkill[]> {
        if (!existsSync(dir)) {
            return [];
        }

        const skills: LoadedSkill[] = [];

        try {
            const entries = await readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = join(dir, entry.name);

                if (entry.isDirectory()) {
                    // Look for SKILL.md in subdirectories
                    const skillPath = join(fullPath, "SKILL.md");
                    if (existsSync(skillPath)) {
                        const skill = await this.loadSkill(skillPath, tiers);
                        if (skill) skills.push(skill);
                    }
                } else if (entry.name.endsWith(".md")) {
                    // Load markdown files directly
                    const skill = await this.loadSkill(fullPath, tiers);
                    if (skill) skills.push(skill);
                }
            }
        } catch (error) {
            console.error(`Failed to load skills from ${dir}:`, error);
        }

        return skills;
    }

    /**
     * Load skills by capability
     */
    async loadSkillsByCapability(
        dir: string,
        capability: string,
        tiers: SkillTier[] = [1],
    ): Promise<LoadedSkill[]> {
        const allSkills = await this.loadSkillsInDirectory(dir, [1]); // Load metadata first

        const matching: LoadedSkill[] = [];

        for (const skill of allSkills) {
            if (skill.metadata.capabilities.includes(capability)) {
                // Now load full tiers for matching skills
                const fullSkill = await this.loadSkill(
                    skill.metadata.path,
                    tiers,
                );
                if (fullSkill) matching.push(fullSkill);
            }
        }

        return matching;
    }

    /**
     * Estimate token savings from progressive disclosure
     */
    estimateTokenSavings(skills: LoadedSkill[]): {
        tier1Only: number;
        allTiers: number;
        savings: number;
        savingsPercent: number;
    } {
        const tier1Only = skills.reduce((sum, s) => {
            const t1Skill = { ...s, loadedTiers: [1] as SkillTier[] };
            return sum + this.estimateTokens(s.metadata.description);
        }, 0);

        const allTiers = skills.reduce((sum, s) => sum + s.tokenEstimate, 0);
        const savings = allTiers - tier1Only;
        const savingsPercent = Math.round((savings / allTiers) * 100);

        return {
            tier1Only,
            allTiers,
            savings,
            savingsPercent,
        };
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.loadedCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        entries: string[];
    } {
        return {
            size: this.loadedCache.size,
            entries: Array.from(this.loadedCache.keys()),
        };
    }
}

/**
 * Helper function to create a skill loader for the default skills directory
 */
export function createSkillLoader(skillsDir?: string): ProgressiveSkillLoader {
    return new ProgressiveSkillLoader(skillsDir || "./skills");
}

/**
 * Recommended tier loading strategies
 */
export const TIER_STRATEGIES = {
    /** Minimal context - just skill names and descriptions */
    minimal: [1] as SkillTier[],

    /** Standard context - metadata + instructions */
    standard: [1, 2] as SkillTier[],

    /** Full context - everything */
    full: [1, 2, 3] as SkillTier[],

    /** On-demand - load tier 3 only when specifically requested */
    onDemand: [1, 2] as SkillTier[],
};
