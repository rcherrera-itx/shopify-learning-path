import { storefrontClient } from '../shopify/client.js';

const VERSION_PROBE_QUERY = `#graphql
    query ApiVersionProbe {
        shop {
            name
        }
    }
`;

type VersionProbeResponse = {
    data?: {
        shop: {
            name: string;
        };
    };
    errors?: Array<{
        message: string;
    }>;
};

const requestedVersion = '2025-07';

const response = await storefrontClient.fetch(VERSION_PROBE_QUERY, {
    apiVersion: requestedVersion,
});

const payload = (await response.json()) as VersionProbeResponse;
const resolvedVersion = response.headers.get("x-shopify-api-version");

console.log(`HTTP Status: ${response.status}`);
console.log(`Requested API version: ${requestedVersion}`);
console.log(`Resolved API version: ${resolvedVersion ?? "not reported"}`);

if (!response.ok || payload.errors || !payload.data) {
    console.error(
        JSON.stringify(payload.errors ?? payload, null, 2),
    );

    process.exitCode = 1;
} else {
    console.log(`Shop: ${payload.data.shop.name}`);
}