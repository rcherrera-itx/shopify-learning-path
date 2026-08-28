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

const PRODUCT_BY_HANDLE_QUERY = `#graphql
    query ProductByHandle($handle: String!) {
        product(handle: $handle) {
            id
            title
            handle
            description
            availableForSale
            variants(first: 10){
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

type ProductByHandleData = {
    product: {
        id: string;
        title: string;
        handle: string;
        description: string;
        availableForSale: boolean;
        variants: {
            nodes: Array<{
                id: string;
                title: string;
                sku: string | null;
                availableForSale: boolean;
                price: {
                    amount: string;
                    currencyCode: string;
                };
                selectedOptions: Array<{
                    name: string;
                    value: string;
                }>;
            }>;
        };
    } | null;
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

const { data: productData, errors: productErrors } =
    await storefrontClient.request<ProductByHandleData>(
        PRODUCT_BY_HANDLE_QUERY,
        {
            variables: {
                handle: "composable-commerce-t-shirt"
            },
        },
    );

if (productErrors || !productData?.product) {
    console.error(
        JSON.stringify(
            productErrors ?? { message: "Product not found." },
            null,
            2,
        ),
    );

    process.exitCode = 1;
} else {
    console.log("\nProduct by handle:");
    console.dir(productData.product, { depth: null });
}