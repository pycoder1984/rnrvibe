import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join(process.cwd(), "data", "subscribers.json");

function ensureDataDir() {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(SUBSCRIBERS_FILE)) {
    fs.writeFileSync(SUBSCRIBERS_FILE, "[]");
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    ensureDataDir();

    const subscribers: string[] = JSON.parse(
      fs.readFileSync(SUBSCRIBERS_FILE, "utf-8")
    );

    if (subscribers.includes(email.toLowerCase())) {
      return NextResponse.json({ message: "Already subscribed" });
    }

    subscribers.push(email.toLowerCase());
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));

    return NextResponse.json({ message: "Subscribed" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
