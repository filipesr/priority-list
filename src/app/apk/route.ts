import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const filePath = join(process.cwd(), "public", "app-release.apk");

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="priority-list.apk"',
      },
    });
  } catch {
    return NextResponse.json({ error: "APK not found" }, { status: 404 });
  }
}
