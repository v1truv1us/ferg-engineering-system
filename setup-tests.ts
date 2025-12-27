#!/usr/bin/env bun

/**
 * Test setup script for ai-eng-system
 *
 * Ensures testing environment is properly configured:
 * - Creates test directories
 * - Sets up test data
 * - Validates test dependencies
 * - Configures test environment
 */

import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = __dirname;

async function ensureDirectory(path: string): Promise<void> {
    try {
        await access(path);
    } catch {
        await mkdir(path, { recursive: true });
        console.log(`✅ Created directory: ${path}`);
    }
}

async function createTestDirectories(): Promise<void> {
    console.log("📁 Creating test directories...");

    const directories = [
        "tests",
        "tmp",
        "test-data",
        "test-data/commands",
        "test-data/agents",
        "test-data/skills",
        "test-data/complex",
    ];

    for (const dir of directories) {
        await ensureDirectory(join(ROOT, dir));
    }
}

async function createSampleTestData(): Promise<void> {
    console.log("📝 Creating sample test data...");

    // Sample command
    const sampleCommand = `---
name: sample-command
description: A sample command for testing
agent: build
subtask: true
---

# Sample Command

This is a sample command used for testing purposes.

## Usage

Use this command to verify test functionality.

## Process

1. Step one
2. Step two
3. Step three
`;

    await writeFile(
        join(ROOT, "test-data/commands/sample-command.md"),
        sampleCommand,
    );

    // Sample agent
    const sampleAgent = `---
name: sample-agent
description: A sample agent for testing
mode: subagent
temperature: 0.1
tools:
  read: true
  write: true
---

# Sample Agent

This is a sample agent used for testing purposes.

## Capabilities

- Testing capability 1
- Testing capability 2

## Behavior

- Test behavior 1
- Test behavior 2
`;

    await writeFile(
        join(ROOT, "test-data/agents/sample-agent.md"),
        sampleAgent,
    );

    // Complex test case
    const complexCommand = `---
name: complex-command
description: A complex command with extensive metadata
agent: build
subtask: true
model: sonnet
temperature: 0.3
tools:
  read: true
  write: true
  bash: true
  grep: true
  glob: true
  list: true
permission:
  network: true
  filesystem: read-write
  environment: read
tags:
  - complex
  - testing
  - benchmark
  - performance
  - integration
---

# Complex Command

This command has extensive frontmatter and complex content for testing.

## Features

### Advanced Features

- Feature 1 with detailed description
- Feature 2 with configuration options
- Feature 3 with integration examples

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| option1 | string | "default" | First option |
| option2 | number | 42 | Second option |
| option3 | boolean | true | Third option |

## Code Examples

\`\`\`typescript
const example = {
  name: "complex-command",
  options: {
    option1: "custom",
    option2: 100,
    option3: false
  }
}
\`\`\`

## Integration

This command integrates with:

1. **Build System**: For compilation and bundling
2. **Test Runner**: For automated testing
3. **Plugin System**: For extensibility

## Performance Considerations

- Memory usage: < 50MB
- Execution time: < 5s
- Scalability: Handles 1000+ items

## Error Handling

The command includes comprehensive error handling:

- Validation errors
- Runtime errors
- Network errors
- File system errors

## Testing

Test cases include:

- Unit tests for individual functions
- Integration tests for workflows
- Performance tests for scalability
- Edge case testing for robustness
`;

    await writeFile(
        join(ROOT, "test-data/commands/complex-command.md"),
        complexCommand,
    );

    console.log("✅ Sample test data created");
}

async function validateTestDependencies(): Promise<void> {
    console.log("🔍 Validating test dependencies...");

    try {
        // Check if bun test is available
        const process = await import("node:child_process");
        await new Promise((resolve, reject) => {
            process.exec("bun --version", (error, stdout) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });
        console.log("✅ Bun is available");
    } catch (error) {
        console.error("❌ Bun is not available or not in PATH");
        process.exit(1);
    }

    // Check if test files exist
    const testFiles = [
        "tests/unit.test.ts",
        "tests/integration.test.ts",
        "tests/performance.test.ts",
        "tests/build.test.ts",
    ];

    for (const file of testFiles) {
        try {
            await access(join(ROOT, file));
            console.log(`✅ Test file exists: ${file}`);
        } catch {
            console.log(`⚠️  Test file missing: ${file}`);
        }
    }
}

async function createTestConfig(): Promise<void> {
    console.log("⚙️  Creating test configuration...");

    const testConfig = {
        timeout: {
            unit: 30000,
            integration: 120000,
            performance: 60000,
            build: 60000,
        },
        thresholds: {
            performance: {
                frontmatterParse: 0.1, // ms
                fileOperation: 1000, // ms for 1000 files
                buildTime: 15000, // ms for large project
            },
            memory: {
                maxIncrease: 50 * 1024 * 1024, // 50MB
                leakThreshold: 10 * 1024 * 1024, // 10MB
            },
        },
        coverage: {
            target: 80,
            exclude: ["tests/", "tmp/", "test-data/", "dist/", "node_modules/"],
        },
    };

    await writeFile(
        join(ROOT, "test-config.json"),
        JSON.stringify(testConfig, null, 2),
    );

    console.log("✅ Test configuration created");
}

async function setupGitIgnore(): Promise<void> {
    console.log("🚫 Setting up git ignore for test artifacts...");

    const gitIgnorePath = join(ROOT, ".gitignore");
    let gitIgnoreContent = "";

    try {
        const fs = await import("node:fs/promises");
        gitIgnoreContent = await fs.readFile(gitIgnorePath, "utf-8");
    } catch {
        // File doesn't exist, will be created
    }

    const testIgnores = [
        "# Test artifacts",
        "test-report.md",
        "coverage/",
        ".nyc_output/",
        "tmp/",
        "test-data/",
        ".test-results/",
    ];

    for (const ignore of testIgnores) {
        if (!gitIgnoreContent.includes(ignore)) {
            gitIgnoreContent += `\n${ignore}\n`;
        }
    }

    await writeFile(gitIgnorePath, gitIgnoreContent);
    console.log("✅ Git ignore updated");
}

async function runQuickTest(): Promise<void> {
    console.log("🧪 Running quick validation test...");

    try {
        // Test basic functionality
        const { execSync } = await import("node:child_process");
        const result = execSync("bun test --timeout 5000 tests/unit.test.ts", {
            encoding: "utf-8",
            stdio: "pipe",
        });

        if (result.includes("pass")) {
            console.log("✅ Quick validation test passed");
        } else {
            console.log("⚠️  Quick validation test had issues");
        }
    } catch (error) {
        console.log("❌ Quick validation test failed");
        console.log("   This is expected if test files are not yet complete");
    }
}

async function main(): Promise<void> {
    console.log("🚀 Setting up test environment for ai-eng-system\n");

    try {
        await createTestDirectories();
        await createSampleTestData();
        await validateTestDependencies();
        await createTestConfig();
        await setupGitIgnore();
        await runQuickTest();

        console.log("\n🎉 Test environment setup complete!");
        console.log("\nNext steps:");
        console.log("  1. Run tests: bun test");
        console.log("  2. Use test runner: bun run test:runner");
        console.log("  3. Check coverage: bun run test:coverage");
        console.log("  4. Read testing guide: cat TESTING.md");
    } catch (error) {
        console.error("\n❌ Test setup failed:", error);
        process.exit(1);
    }
}

// Run setup if called directly
if (import.meta.main) {
    main();
}
