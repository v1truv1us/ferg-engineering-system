#!/usr/bin/env python3
"""
Setup script for Ferg Engineering System Validation
Creates Python virtual environment and installs dependencies.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return success status."""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Command failed: {cmd}")
            print(f"Error: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"❌ Exception running command: {e}")
        return False

def main():
    """Main setup function."""
    print("🚀 Setting up Ferg Engineering System Validation Environment")
    print("=" * 60)

    # Check Python version
    python_version = sys.version_info
    if python_version < (3, 8):
        print(f"❌ Python {python_version.major}.{python_version.minor} is not supported. Please use Python 3.8+")
        sys.exit(1)

    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.minor} detected")

    # Check if we're in the right directory
    if not Path("benchmarks").exists():
        print("❌ Please run this script from the project root directory")
        sys.exit(1)

    # Create virtual environment
    print("📦 Creating Python virtual environment...")
    if not run_command("python3 -m venv benchmarks/venv"):
        sys.exit(1)

    # Activate virtual environment and install dependencies
    venv_python = "benchmarks/venv/bin/python"
    venv_pip = "benchmarks/venv/bin/pip"

    print("📦 Installing dependencies...")
    if not run_command(f"{venv_pip} install --upgrade pip"):
        sys.exit(1)

    if not run_command(f"{venv_pip} install -r benchmarks/requirements.txt"):
        sys.exit(1)

    # Create config from example
    config_example = Path("benchmarks/config.example.json")
    config_file = Path("benchmarks/config.json")

    if config_file.exists():
        print("⚠️  Config file already exists, skipping creation")
    else:
        print("📋 Creating config file from example...")
        import shutil
        shutil.copy(config_example, config_file)
        print("✅ Created benchmarks/config.json")
        print("⚠️  Please edit this file with your API keys before running validation")

    # Create .env file from example
    env_example = Path("benchmarks/.env.example")
    env_file = Path("benchmarks/.env")

    if env_file.exists():
        print("⚠️  .env file already exists, skipping creation")
    else:
        print("🔐 Creating .env file from example...")
        import shutil
        shutil.copy(env_example, env_file)
        print("✅ Created benchmarks/.env")
        print("⚠️  Please add your API keys to this file")

    # Test installation
    print("🧪 Testing installation...")
    test_cmd = f"{venv_python} -c \"import scipy, numpy, requests; print('✅ All dependencies installed successfully')\""
    if not run_command(test_cmd):
        sys.exit(1)

    print("\n🎉 Setup complete!")
    print("\nNext steps:")
    print("1. Edit benchmarks/config.json with your API configuration")
    print("2. Add your API keys to benchmarks/.env")
    print("3. Run dry-run validation: python benchmarks/run_validation.py --dry-run")
    print("4. Run full validation: python benchmarks/run_validation.py")

    print("\nTo activate the virtual environment:")
    print("source benchmarks/venv/bin/activate")

if __name__ == "__main__":
    main()