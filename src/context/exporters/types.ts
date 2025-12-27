/**
 * Context envelope exporters.
 *
 * Exporters take a CommandContextEnvelope and optionally write it somewhere
 * (e.g. markdown file, Obsidian vault).
 */

import type { CommandContextEnvelope } from "../types";

export interface ContextExporter {
    exportEnvelope(envelope: CommandContextEnvelope): Promise<void>;
}
