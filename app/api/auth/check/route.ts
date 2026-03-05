import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function makeToken(email: string, secret: string): string {
  return createHash("sha256")
    .update(`${email}:${secret}`)
    .digest("hex");
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("studio-auth")?.value;
  const email = req.cookies.get("studio-email")?.value;

  if (!token || !email) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const authSecret = process.env.AUTH_SECRET || "default-secret";
  const expectedToken = makeToken(email.toLowerCase(), authSecret);

  if (token !== expectedToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, email });
}
