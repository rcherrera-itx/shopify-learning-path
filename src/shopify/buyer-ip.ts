import "server-only";

import { headers } from "next/headers";

export async function getBuyerIpHeaders(): Promise<
    Record<string, string>
> {
    const requestHeader = await headers();
    const forwardedFor = requestHeader.get("x-forwarded-for");

    const buyerIp = forwardedFor?.split(",")[0]?.trim() || requestHeader.get("x-real-ip");

    return buyerIp ? { "Shopify-Storefront-Buyer-IP": buyerIp } : {};
}