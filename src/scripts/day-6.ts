import { storefrontClient } from '../shopify/client.js';

const PRODUCTS_QUERY = `#graphql
    query Products($first: Int!) {
        products(first: $first, sortKey: TITLE){
            nodes {
                id
                title
                handle
                vendor
                availableForSale
                priceRange {
                    minVariantPrice {
                        amount
                        currencyCode
                    }
                }
                variants(first: 10) {
                    nodes {
                        id
                        title
                        sku
                        availableForSale
                        price {
                            amount
                            currencyCode
                        }
                        selectedOptions {
                            name
                            value
                        }
                    }
                }
            }
        }
    }
`;

type GraphQlError = {
    message: string;
};

type ProductsResponse = {
    data?: {
        products: {
            nodes: unknown[];
        };
    };
    errors?: GraphQlError[];
}

const response = await storefrontClient.fetch(PRODUCTS_QUERY, {
    variables: { first: 10 },
});

const payload = (await response.json()) as ProductsResponse;
const resolvedApiVersion = response.headers.get(
    "x-shopify-api-version"
);

console.log(`Requested API version: ${storefrontClient.config.apiVersion}`);
console.log(`Resolved API version: ${resolvedApiVersion ?? "not reported"}`);

if (!response.ok || payload.errors || !payload.data) {
    console.error(JSON.stringify(payload.errors ?? payload, null, 2));
    process.exitCode = 1;
} else {
    console.dir(payload.data.products.nodes, { depth: null });
}