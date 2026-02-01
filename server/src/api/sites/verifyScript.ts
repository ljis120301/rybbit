import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import puppeteer from "puppeteer";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { callOpenRouter } from "../../lib/openrouter.js";

interface VerifyScriptParams {
  Params: {
    siteId: string;
  };
}

export interface VerifyScriptResponse {
  scriptTagFound: boolean;
  scriptExecuted: boolean;
  siteIdMatch: boolean;
  issues: string[];
  aiAnalysis: string | null;
}

export async function verifyScript(
  request: FastifyRequest<VerifyScriptParams>,
  reply: FastifyReply
) {
  const { siteId } = request.params;
  const numericSiteId = Number(siteId);

  try {
    const site = await db.query.sites.findFirst({
      where: isNaN(numericSiteId)
        ? eq(sites.id, siteId)
        : eq(sites.siteId, numericSiteId),
    });

    if (!site) {
      return reply.status(404).send({ error: "Site not found" });
    }

    const domain = site.domain;
    const url = domain.startsWith("http") ? domain : `https://${domain}`;

    const issues: string[] = [];
    let scriptTagFound = false;
    let scriptExecuted = false;
    let siteIdMatch = false;

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Set a reasonable timeout and user agent
      page.setDefaultNavigationTimeout(15000);
      await page.setUserAgent({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });

      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
      } catch (navError: any) {
        issues.push(
          `Could not load ${url}: ${navError.message || "Navigation failed"}`
        );
        return reply.status(200).send({
          scriptTagFound: false,
          scriptExecuted: false,
          siteIdMatch: false,
          issues,
          aiAnalysis: null,
        } satisfies VerifyScriptResponse);
      }

      // Check for script tag in the DOM
      const scriptCheck = await page.evaluate((expectedSiteId: string) => {
        const scripts = document.querySelectorAll("script");
        let found = false;
        let siteIdCorrect = false;
        let foundSiteId: string | null = null;

        for (const script of scripts) {
          const src = script.getAttribute("src") || "";
          if (src.includes("script.js") || src.includes("rybbit")) {
            found = true;
            foundSiteId = script.getAttribute("data-site-id");
            if (foundSiteId === expectedSiteId) {
              siteIdCorrect = true;
            }
            break;
          }
        }

        return { found, siteIdCorrect, foundSiteId };
      }, site.id!);

      scriptTagFound = scriptCheck.found;
      siteIdMatch = scriptCheck.siteIdCorrect;

      if (!scriptTagFound) {
        issues.push(
          "Rybbit script tag not found in the page HTML. Make sure the script is placed in the <head> tag."
        );
      } else if (!siteIdMatch) {
        issues.push(
          `Script tag found but data-site-id is "${scriptCheck.foundSiteId}" instead of "${site.id}".`
        );
      }

      // Wait a moment for the script to execute, then check for the global
      await new Promise((resolve) => setTimeout(resolve, 2000));

      scriptExecuted = await page.evaluate(() => {
        return typeof (window as any).rybbit !== "undefined";
      });

      if (scriptTagFound && !scriptExecuted) {
        issues.push(
          "Script tag is present but the rybbit object was not found on window. The script may be blocked by a Content Security Policy, ad blocker, or the src URL may be incorrect."
        );
      }

      // If there are issues, use AI to analyze the HTML for deeper diagnosis
      let aiAnalysis: string | null = null;
      if (issues.length > 0 && process.env.OPENROUTER_API_KEY) {
        try {
          // Extract the <head> and any rybbit-related script tags from the page
          const htmlContext = await page.evaluate(() => {
            const head = document.head?.innerHTML || "";
            // Also grab any script tags from body that might be relevant
            const bodyScripts = Array.from(
              document.body?.querySelectorAll("script") || []
            )
              .map((s) => s.outerHTML)
              .filter(
                (html) =>
                  html.includes("script.js") ||
                  html.includes("rybbit") ||
                  html.includes("googletagmanager") ||
                  html.includes("gtm")
              )
              .join("\n");

            // Check for CSP headers via meta tags
            const cspMeta = Array.from(
              document.querySelectorAll(
                'meta[http-equiv="Content-Security-Policy"]'
              )
            )
              .map((m) => m.getAttribute("content"))
              .join("\n");

            return { head: head.substring(0, 15000), bodyScripts, cspMeta };
          });
          console.log(htmlContext);

          aiAnalysis = await callOpenRouter(
            [
              {
                role: "system",
                content: `You are a web analytics debugging assistant for Rybbit Analytics. Your job is to analyze HTML from a user's webpage and explain why their Rybbit tracking script may not be working correctly.

The correct Rybbit script installation looks like:
<script src="https://[host]/api/script.js" data-site-id="[site-id]" defer></script>

Common issues you should look for:
- Script tag is malformed (attributes broken, quotes mismatched, tags split or mangled by CMS post-processing)
- Script is inside a <noscript> tag, HTML comment, or template that doesn't render
- Content Security Policy blocking the script domain
- Script src URL is wrong or points to a non-existent endpoint
- data-site-id attribute is missing, empty, or has the wrong value
- Duplicate installations (multiple rybbit scripts, or both direct + GTM)
- CDN/proxy rewriting (e.g. Cloudflare Rocket Loader changing script type)
- Script placed after </body> or </html>
- Other scripts causing errors that halt JS execution before rybbit loads
- GTM container present but may not be configured to fire the rybbit tag

Be concise and actionable. Tell the user exactly what's wrong and how to fix it. Use 2-4 sentences max. If you can identify the specific CMS or platform causing the issue, mention it.`,
              },
              {
                role: "user",
                content: `The expected site ID is "${site.id}".

Detected issues so far: ${issues.join("; ")}

<head> HTML:
${htmlContext.head}

${htmlContext.bodyScripts ? `Relevant <body> scripts:\n${htmlContext.bodyScripts}` : ""}
${htmlContext.cspMeta ? `CSP meta tags:\n${htmlContext.cspMeta}` : ""}`,
              },
            ],
            { temperature: 0.2, maxTokens: 500 }
          );
          console.log(aiAnalysis);
        } catch (aiError) {
          // AI analysis is best-effort, don't fail the whole check
          console.error("AI analysis failed:", aiError);
        }
      }

      return reply.status(200).send({
        scriptTagFound,
        scriptExecuted,
        siteIdMatch,
        issues,
        aiAnalysis,
      } satisfies VerifyScriptResponse);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error("Error verifying script:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
