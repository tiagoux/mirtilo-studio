import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function makeToken(email: string, secret: string): string {
  return createHash("sha256")
    .update(`${email}:${secret}`)
    .digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const authUsers = process.env.AUTH_USERS || "";
    const authSecret = process.env.AUTH_SECRET || "default-secret";

    // Parse users: "email1:pass1,email2:pass2"
    const users = authUsers.split(",").map((u) => {
      const [e, p] = u.split(":");
      return { email: e?.trim(), password: p?.trim() };
    });

    const matched = users.find(
      (u) =>
        u.email?.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!matched) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    // Create a simple token
    const token = makeToken(email.toLowerCase(), authSecret);

    const response = NextResponse.json({ success: true, email: matched.email });

    // Set HttpOnly cookie
    response.cookies.set("studio-auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set("studio-email", email.toLowerCase(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
