import { FastifyReply, FastifyRequest } from "fastify";
import { inArray, and, eq } from "drizzle-orm";
import { clickhouse } from "../../db/clickhouse/clickhouse.js";
import { db } from "../../db/postgres/postgres.js";
import { userProfiles } from "../../db/postgres/schema.js";
import { getFilterStatement, getTimeStatement, processResults } from "./utils.js";
import { FilterParams } from "@rybbit/shared";

export type GetUsersResponse = {
  user_id: string;
  anonymous_id: string;
  is_identified: boolean;
  traits: Record<string, unknown> | null;
  country: string;
  region: string;
  city: string;
  language: string;
  browser: string;
  operating_system: string;
  device_type: string;
  pageviews: number;
  events: number;
  sessions: number;
  hostname: string;
  last_seen: string;
  first_seen: string;
}[];

export interface GetUsersRequest {
  Params: {
    site: string;
  };
  Querystring: FilterParams<{
    page?: string;
    page_size?: string;
    sort_by?: string;
    sort_order?: string;
    identified_only?: string;
  }>;
}

export async function getUsers(req: FastifyRequest<GetUsersRequest>, res: FastifyReply) {
  const {
    filters,
    page = "1",
    page_size: pageSize = "20",
    sort_by: sortBy = "last_seen",
    sort_order: sortOrder = "desc",
    identified_only: identifiedOnly = "false",
  } = req.query;
  const site = req.params.site;
  const filterIdentified = identifiedOnly === "true";

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  // Validate sort parameters
  const validSortFields = ["first_seen", "last_seen", "pageviews", "sessions", "events"];
  const actualSortBy = validSortFields.includes(sortBy) ? sortBy : "last_seen";
  const actualSortOrder = sortOrder === "asc" ? "ASC" : "DESC";

  // Generate filter statement and time statement
  const timeStatement = getTimeStatement(req.query);
  const filterStatement = getFilterStatement(filters, Number(site), timeStatement);

  const query = `
WITH AggregatedUsers AS (
    SELECT
        user_id,
        argMax(anonymous_id, timestamp) AS anonymous_id,
        argMax(country, timestamp) AS country,
        argMax(region, timestamp) AS region,
        argMax(city, timestamp) AS city,
        argMax(language, timestamp) AS language,
        argMax(browser, timestamp) AS browser,
        argMax(browser_version, timestamp) AS browser_version,
        argMax(operating_system, timestamp) AS operating_system,
        argMax(operating_system_version, timestamp) AS operating_system_version,
        argMax(device_type, timestamp) AS device_type,
        argMax(screen_width, timestamp) AS screen_width,
        argMax(screen_height, timestamp) AS screen_height,
        argMin(referrer, timestamp) AS referrer,
        argMax(channel, timestamp) AS channel,
        argMin(hostname, timestamp) AS hostname,
        countIf(type = 'pageview') AS pageviews,
        countIf(type = 'custom_event') AS events,
        count(distinct session_id) AS sessions,
        max(timestamp) AS last_seen,
        min(timestamp) AS first_seen
    FROM events
    WHERE
        site_id = {siteId:Int32}
        ${timeStatement}
    GROUP BY
        user_id
)
SELECT
    *,
    if(user_id != anonymous_id AND anonymous_id != '', true, false) AS is_identified
FROM AggregatedUsers
WHERE 1 = 1 ${filterStatement}
${filterIdentified ? "AND user_id != anonymous_id AND anonymous_id != ''" : ""}
ORDER BY ${actualSortBy} ${actualSortOrder}
LIMIT {limit:Int32} OFFSET {offset:Int32}
  `;

  // Query to get total count
  const countQuery = filterIdentified
    ? `
WITH UserAnon AS (
    SELECT
        user_id,
        argMax(anonymous_id, timestamp) AS anonymous_id
    FROM events
    WHERE
        site_id = {siteId:Int32}
        ${timeStatement}
    GROUP BY user_id
)
SELECT count(*) AS total_count
FROM UserAnon
WHERE user_id != anonymous_id AND anonymous_id != ''
${filterStatement}
`
    : `
SELECT
    count(DISTINCT user_id) AS total_count
FROM events
WHERE
    site_id = {siteId:Int32}
    ${filterStatement}
    ${timeStatement}
  `;

  try {
    // Execute both queries in parallel
    const [result, countResult] = await Promise.all([
      clickhouse.query({
        query,
        format: "JSONEachRow",
        query_params: {
          siteId: Number(site),
          limit: pageSizeNum,
          offset,
        },
      }),
      clickhouse.query({
        query: countQuery,
        format: "JSONEachRow",
        query_params: {
          siteId: Number(site),
        },
      }),
    ]);

    const data = await processResults<Omit<GetUsersResponse[number], "traits">>(result);
    const countData = await processResults<{ total_count: number }>(countResult);
    const totalCount = countData[0]?.total_count || 0;

    // Get traits for identified users from Postgres
    const identifiedUserIds = data.filter((u) => u.is_identified).map((u) => u.user_id);

    let traitsMap: Map<string, Record<string, unknown>> = new Map();
    if (identifiedUserIds.length > 0) {
      const profiles = await db
        .select({
          userId: userProfiles.userId,
          traits: userProfiles.traits,
        })
        .from(userProfiles)
        .where(and(eq(userProfiles.siteId, Number(site)), inArray(userProfiles.userId, identifiedUserIds)));

      traitsMap = new Map(profiles.map((p) => [p.userId, (p.traits as Record<string, unknown>) || {}]));
    }

    // Merge traits into user data
    const dataWithTraits = data.map((user) => ({
      ...user,
      traits: traitsMap.get(user.user_id) || null,
    }));

    return res.send({
      data: dataWithTraits,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).send({ error: "Failed to fetch users" });
  }
}
