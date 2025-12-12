#!/usr/bin/env node

/**
 * Swarms Integration Setup Script
 *
 * Sets up the Swarms framework integration for the Ferg Engineering System.
 * Can run in local mode (embedded) or remote mode (separate server).
 */

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SETUP_MODE = process.env.SWARMS_MODE || 'local'; // 'local' or 'remote'
const PYTHON_CMD = process.env.PYTHON_CMD || 'python3';

async function main() {
  console.log('🚀 Setting up Swarms Integration for Ferg Engineering System');
  console.log(`📦 Mode: ${SETUP_MODE}`);

  if (SETUP_MODE === 'local') {
    await setupLocalMode();
  } else {
    await setupRemoteMode();
  }

  console.log('✅ Swarms integration setup complete!');
  console.log('\n📚 Usage:');
  console.log('  import { createSwarmsClient } from "./src/local-swarms-executor";');
  console.log('  const client = createSwarmsClient({ mode: "local" });');
}

async function setupLocalMode() {
  console.log('\n🔧 Setting up Local Mode (Embedded Execution)');

  // Check if Python is available
  try {
    execSync(`${PYTHON_CMD} --version`, { stdio: 'pipe' });
    console.log('✅ Python available');
  } catch (error) {
    console.error('❌ Python not found. Please install Python 3.8+');
    process.exit(1);
  }

  // Install swarms via pip
  console.log('📦 Installing Swarms framework...');
  try {
    execSync(`${PYTHON_CMD} -m pip install swarms`, { stdio: 'inherit' });
    console.log('✅ Swarms installed');
  } catch (error) {
    console.warn('⚠️  Swarms installation failed, but local executor will work with fallback mode');
  }

  // Create requirements.txt for documentation
  const requirements = [
    'swarms>=0.1.0',
    'openai>=1.0.0',
    'anthropic>=0.30.0'
  ];

  writeFileSync('requirements-swarms.txt', requirements.join('\n'));
  console.log('📄 Created requirements-swarms.txt');
}

async function setupRemoteMode() {
  console.log('\n🌐 Setting up Remote Mode (Separate Server)');

  // Create Docker setup for remote server
  const dockerfile = `
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements-swarms.txt .
RUN pip install --no-cache-dir -r requirements-swarms.txt

# Copy swarms server code
COPY swarms-server.py .

EXPOSE 8000

CMD ["python", "swarms-server.py"]
`;

  const dockerCompose = `
version: '3.8'

services:
  swarms-server:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
    volumes:
      - ./swarms-data:/app/data
    restart: unless-stopped
`;

  const serverCode = `
#!/usr/bin/env python3
"""
Swarms API Server for Ferg Engineering System
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os

from swarms import SwarmRouter, Agent

app = FastAPI(title="Swarms API", version="1.0.0")

# In-memory storage (replace with proper DB in production)
swarms_db = {}
agents_db = {}

class SwarmConfig(BaseModel):
    name: str
    description: Optional[str] = None
    agents: List[str]
    swarm_type: str
    flow: Optional[str] = None
    max_loops: Optional[int] = None

class SwarmResponse(BaseModel):
    id: str
    name: str
    agents: List[str]
    swarm_type: str
    status: str
    created_at: str

class TaskRequest(BaseModel):
    task: str
    timeout: Optional[int] = None
    context: Optional[Dict[str, Any]] = None

class TaskResponse(BaseModel):
    task_id: str
    swarm_id: str
    status: str
    output: str
    execution_time: float
    agent_used: Optional[str] = None
    error: Optional[str] = None

@app.post("/swarms", response_model=SwarmResponse)
async def create_swarm(config: SwarmConfig):
    """Create a new swarm"""
    swarm_id = f"swarm_{len(swarms_db) + 1}"

    # Create actual swarm instance
    agents = []
    for agent_name in config.agents:
        # Create basic agent (extend with proper agent classes)
        agent = Agent(
            agent_name=agent_name,
            system_prompt=f"You are {agent_name}, an expert assistant.",
            model_name="gpt-4o-mini"
        )
        agents.append(agent)

    # Create swarm router
    swarm_router = SwarmRouter(
        name=config.name,
        description=config.description,
        agents=agents,
        swarm_type=config.swarm_type
    )

    swarm_data = {
        "id": swarm_id,
        "name": config.name,
        "agents": config.agents,
        "swarm_type": config.swarm_type,
        "status": "created",
        "created_at": "2025-01-01T00:00:00Z",
        "router": swarm_router
    }

    swarms_db[swarm_id] = swarm_data

    return SwarmResponse(**{k: v for k, v in swarm_data.items() if k != "router"})

@app.get("/swarms", response_model=List[SwarmResponse])
async def list_swarms():
    """List all swarms"""
    return [
        SwarmResponse(**{k: v for k, v in swarm.items() if k != "router"})
        for swarm in swarms_db.values()
    ]

@app.post("/swarms/{swarm_id}/run", response_model=TaskResponse)
async def run_task(swarm_id: str, request: TaskRequest):
    """Run a task on a swarm"""
    if swarm_id not in swarms_db:
        raise HTTPException(status_code=404, detail="Swarm not found")

    swarm = swarms_db[swarm_id]
    router = swarm["router"]

    try:
        # Execute task
        result = router.run(request.task)

        return TaskResponse(
            task_id=f"task_{len(swarms_db) * 100 + 1}",
            swarm_id=swarm_id,
            status="success",
            output=str(result),
            execution_time=1.0,  # Placeholder
            agent_used=request.context.get("preferred_agent") if request.context else None
        )
    except Exception as e:
        return TaskResponse(
            task_id=f"task_{len(swarms_db) * 100 + 1}",
            swarm_id=swarm_id,
            status="failed",
            output="",
            execution_time=0.0,
            error=str(e)
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agents_available": len(agents_db),
        "active_swarms": len(swarms_db),
        "uptime_seconds": 0  # Placeholder
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
`;

  writeFileSync('Dockerfile.swarms', dockerfile);
  writeFileSync('docker-compose.swarms.yml', dockerCompose);
  writeFileSync('swarms-server.py', serverCode);

  console.log('📄 Created Docker setup files:');
  console.log('  - Dockerfile.swarms');
  console.log('  - docker-compose.swarms.yml');
  console.log('  - swarms-server.py');

  console.log('\n🚀 To start the remote server:');
  console.log('  docker-compose -f docker-compose.swarms.yml up -d');
}

if (import.meta.main) {
  main().catch(console.error);
}