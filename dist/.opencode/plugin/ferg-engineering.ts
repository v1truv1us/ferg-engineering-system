import { definePlugin, file, agent, command } from "@opencode-ai/plugin"

export default definePlugin({
  name: "ferg-engineering",
  version: "2.0.0",

  async init(config) {
    console.log("🔧 Ferg Engineering System loaded")
  },
})
