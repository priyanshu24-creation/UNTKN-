import "./src/lib/error-capture";

import { consumeLastCapturedError } from "./src/lib/error-capture";
import { renderErrorPage } from "./src/lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const realError =
    consumeLastCapturedError() ??
    new Error(`h3 swallowed SSR error: ${body}`);

  console.error("REAL SSR ERROR:", realError);

  return new Response(
    `REAL SSR ERROR:\n\n${
      realError instanceof Error
        ? `${realError.name}: ${realError.message}\n\n${realError.stack ?? ""}`
        : String(realError)
    }`,
    {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
  );
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error("REAL SERVER ERROR:", error);
      return new Response(
        "REAL SERVER ERROR:\n\n" +
        (error instanceof Error
          ? `${error.name}: ${error.message}\n\n${error.stack ?? ""}`
          : String(error)),
        {
          status: 500,
          headers: { "content-type": "text/plain; charset=utf-8" },
        },
      );
    }
  },
};
