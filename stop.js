#!/usr/bin/env node
/**
 * Atelier Runway & Wardrobe Management System
 * Graceful Server Shutdown Utility
 * 
 * Invoked via: npm stop
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PID_FILE = path.join(__dirname, '.server.pid');
const PORT = parseInt(process.env.PORT, 10) || 3000;

function findPidByPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano').toString();
      const lines = out.split('\n');
      for (const line of lines) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (pid && !isNaN(pid)) return pid;
        }
      }
    } else {
      const out = execSync(`lsof -t -i:${port}`).toString().trim();
      const pid = parseInt(out.split('\n')[0], 10);
      if (pid && !isNaN(pid)) return pid;
    }
  } catch (e) {
    // Port not found or command unavailable
  }
  return null;
}

function stopProcess(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    return true;
  } catch (e) {
    try {
      process.kill(pid);
      return true;
    } catch (err) {
      return false;
    }
  }
}

let targetPid = null;

// 1. Try reading from .server.pid
if (fs.existsSync(PID_FILE)) {
  try {
    const rawPid = fs.readFileSync(PID_FILE, 'utf-8').trim();
    targetPid = parseInt(rawPid, 10);
  } catch (e) {}
}

// 2. If PID file didn't exist or process isn't running, check port
if (!targetPid) {
  targetPid = findPidByPort(PORT);
}

if (!targetPid) {
  console.log(`[Server Stop] No running Fashion Show Manager server detected on port ${PORT}.`);
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  process.exit(0);
}

console.log(`[Server Stop] Stopping Fashion Show Manager server (PID: ${targetPid})...`);
const stopped = stopProcess(targetPid);

if (fs.existsSync(PID_FILE)) {
  try { fs.unlinkSync(PID_FILE); } catch (e) {}
}

if (stopped) {
  console.log(`✓ Fashion Show Manager server (PID: ${targetPid}) stopped successfully.`);
} else {
  console.log(`Notice: Process ${targetPid} was already terminated or could not be reached.`);
}

process.exit(0);
