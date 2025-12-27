// src/index.ts
import fs from "node:fs";
import path from "node:path";
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}
function installToProject(pluginDir, projectDir) {
  const isDistDir = fs.existsSync(path.join(pluginDir, ".opencode"));
  const distDir = isDistDir ? pluginDir : path.join(pluginDir, "dist");
  const distOpenCodeDir = path.join(distDir, ".opencode");
  const distSkillsDir = path.join(distDir, "skills");
  const targetOpenCodeDir = path.join(projectDir, ".opencode");
  const NAMESPACE_PREFIX = "ai-eng";
  const commandsSrc = path.join(distOpenCodeDir, "command", NAMESPACE_PREFIX);
  if (fs.existsSync(commandsSrc)) {
    const commandsDest = path.join(targetOpenCodeDir, "command", NAMESPACE_PREFIX);
    copyRecursive(commandsSrc, commandsDest);
  }
  const agentsSrc = path.join(distOpenCodeDir, "agent", NAMESPACE_PREFIX);
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetOpenCodeDir, "agent", NAMESPACE_PREFIX);
    copyRecursive(agentsSrc, agentsDest);
  }
  const distSkillDir = path.join(distDir, ".opencode", "skill");
  if (fs.existsSync(distSkillDir)) {
    const skillDest = path.join(targetOpenCodeDir, "skill");
    copyRecursive(distSkillDir, skillDest);
  }
}
var AiEngSystem = async ({ directory }) => {
  const pluginDir = path.dirname(new URL(import.meta.url).pathname);
  try {
    installToProject(pluginDir, directory);
  } catch (error) {
    console.error(`[ai-eng-system] Installation warning: ${error instanceof Error ? error.message : String(error)}`);
  }
  return {};
};
export {
  AiEngSystem
};
