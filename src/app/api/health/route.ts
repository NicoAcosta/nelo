export async function GET() {
  return Response.json({ ok: true, project: "nelo", timestamp: new Date().toISOString() });
}
