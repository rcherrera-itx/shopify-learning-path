function requirEnvirontmentVariable(name: string) {
    const value = process.env[name];

    if(!value) {
        throw new Error(`Missing required environment variable ${name}`);
    }

    return value;
}

export const shopifyConfig = {
    storeDomain: requirEnvirontmentVariable('SHOPIFY_STORE_DOMAIN'),
    apiVersion: requirEnvirontmentVariable('SHOPIFY_STOREFRONT_API_VERSION'),
    privateAccessToken: requirEnvirontmentVariable('SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN')
}