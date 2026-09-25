import { NextResponse } from "next/server";
import { authorize, handleError, jsonError } from "@/lib/api";
import { getDashboard } from "@/lib/attendance/service";

export async function GET() {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  try {
    const dashboard = await getDashboard();
    return dashboard ? NextResponse.json(dashboard) : jsonError("No current batch is set", 409);
  } catch (error) {
    return handleError(error);
  }
}
