function requireEnvironmentVariable(name: string): string {
    const value = process.env[name];

    if(!value) {
        throw new Error(`Missing required environment variable ${name}`);
    }

    return value;
}

export const shopifyConfig = {
    storeDomain: requireEnvironmentVariable('SHOPIFY_STORE_DOMAIN'),
    apiVersion: requireEnvironmentVariable('SHOPIFY_STOREFRONT_API_VERSION'),
    privateAccessToken: requireEnvironmentVariable('SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN')
} as const;