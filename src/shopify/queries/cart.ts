import "server-only";
import { getBuyerIpHeaders } from "../buyer-ip";
import { storefrontClient } from "../client";

const CART_QUERY = `#graphql
    query Cart($id: ID!) {
        cart(id: $id) {
            id
            totalQuantity,
            cost {
                subtotalAmount {
                    amount
                    currencyCode
                }
                totalAmount {
                    amount
                    currencyCode
                }
            }
            lines(first: 100) {
                nodes {
                    id
                    quantity
                    merchandise {
                        ... on ProductVariant {
                            id
                            title
                            price {
                                amount
                                currencyCode
                            }
                            product {
                                title
                                handle
                            }
                        }
                    }
                }
            }
        }
    }
`;

export type StorefrontCart = {
    id: string;
    totalQuantity: number;
    cost: {
        subtotalAmount: {
            amount: string;
            currencyCode: string;
        };
        totalAmount: {
            amount: string;
            currencyCode: string;
        };
    };
    lines: {
        nodes: Array<{
            id: string;
            quantity: number;
            merchandise: {
                id: string;
                title: string;
                price: {
                    amount: string;
                    currencyCode: string;
                };
                product: {
                    title: string;
                    handle: string;
                };
            };
        }>;
    };
};

type CartQueryData = {
    cart: StorefrontCart | null;
};

export async function getCart(
    cartId: string,
): Promise<StorefrontCart | null> {
    const buyerIpHeaders = await getBuyerIpHeaders();

    const { data, errors } = await storefrontClient.request<CartQueryData>(
        CART_QUERY,
        {
            variables: {
                id: cartId,
            },
            headers: buyerIpHeaders,
        },
    );

    if (errors) {
        const messages = errors.graphQLErrors?.map((error) => error.message).join(" | ");
        throw new Error(
            messages ?? errors.message ?? "Shopify cart query failed."
        );
    }

    return data?.cart ?? null;
}


const CART_CHECKOUT_URL_QUERY = `#graphql
    query CartCheckoutUrl($id: ID!) {
        cart(id: $id) {
            checkoutUrl
        }
    }
`;

type CartCheckoutUrlData = {
    cart: {
        checkoutUrl: string;
    } | null;
};

export async function getCheckoutUrl(
    cartId: string,
): Promise<string | null> {
    const buyerIpHeaders = await getBuyerIpHeaders();

    const { data, errors } = await storefrontClient.request<CartCheckoutUrlData>(
        CART_CHECKOUT_URL_QUERY,
        {
            variables: {
                id: cartId,
            },
            headers: buyerIpHeaders,
        },
    );

    if (errors) {
        const messages = errors.graphQLErrors?.map((error) => error.message).join(" | ");
        throw new Error(
            messages ?? errors.message ?? "Shopify cart query failed."
        );
    }

    return data?.cart?.checkoutUrl ?? null;
}