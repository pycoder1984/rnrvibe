import { NextRequest, NextResponse } from "next/server";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

function isLocal(req: NextRequest): boolean {
  if (req.headers.get("cf-connecting-ip")) return false;
  const host = req.headers.get("host") || "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

type CpuTimes = { idle: number; total: number };

function sampleCpu(): CpuTimes {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const [k, v] of Object.entries(cpu.times)) {
      total += v as number;
      if (k === "idle") idle += v as number;
    }
  }
  return { idle, total };
}

async function getCpuUsage(sampleMs: number): Promise<number> {
  const a = sampleCpu();
  await new Promise((r) => setTimeout(r, sampleMs));
  const b = sampleCpu();
  const idleDelta = b.idle - a.idle;
  const totalDelta = b.total - a.total;
  if (totalDelta <= 0) return 0;
  return Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100));
}

type GpuInfo = {
  name: string;
  memoryTotalMb: number;
  memoryUsedMb: number;
  memoryFreeMb: number;
  utilization: number;
  temperature: number;
};

async function getGpu(): Promise<GpuInfo | null> {
  try {
    const { stdout } = await execAsync(
      "nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu --format=csv,noheader,nounits",
      { timeout: 2000 }
    );
    const line = stdout.trim().split("\n")[0];
    if (!line) return null;
    const parts = line.split(",").map((s) => s.trim());
    return {
      name: parts[0] || "GPU",
      memoryTotalMb: Number(parts[1]) || 0,
      memoryUsedMb: Number(parts[2]) || 0,
      memoryFreeMb: Number(parts[3]) || 0,
      utilization: Number(parts[4]) || 0,
      temperature: Number(parts[5]) || 0,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isLocal(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [cpuUsage, gpu] = await Promise.all([getCpuUsage(200), getGpu()]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return NextResponse.json({
    cpu: {
      usage: cpuUsage,
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "CPU",
      loadavg: os.loadavg(),
    },
    memory: {
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem,
      usagePercent: (usedMem / totalMem) * 100,
    },
    gpu,
    timestamp: Date.now(),
  });
}
