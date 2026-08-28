"use server"

import { storefrontClient } from "@/shopify/client";
import { headers } from "next/headers";

const CART_CREATE_MUTATION = `#graphql
    mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
            cart {
                id
                totalQuantity
                checkoutUrl
                cost {
                    totalAmount {
                        amount
                        currencyCode
                    }
                }
            }
            useErrors {
                code
                field
                message
            }
        }    
    }
`;

type CartCreateData = {
    cartCreate: {
        cart: {
            id: string;
            totalQuantity: number;
            checkoutUrl: string;
            cost: {
                totalAmount: {
                    amount: string;
                    currencyCode: string;
                };
            };
        } | null;
        useErrors: Array<{
            code: string | null;
            field: string[] | null;
            message: string;
        }>;
    };
};

export type CreateCartState = {
    status: "idle" | "success" | "error";
    message: string;
}

function getBuyerIp(requestHeaders: Headers): string | null {
    const forwardedFor = requestHeaders.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() || null;
    }

    return requestHeaders.get("x-real-ip");
}

export async function createCartAction(
    _previousState: CreateCartState,
    formData: FormData
): Promise<CreateCartState> {
    const merchandiseId = formData.get("merchandiseId");

    if (
        typeof merchandiseId !== "string" ||
        !merchandiseId.startsWith("gid://shopify/ProductVariant/")
    ) {
        return {
            status: "error",
            message: "Select a valid product variant."
        }
    }

    try {
        const requestHeaders = await headers();
        const buyerIp = getBuyerIp(requestHeaders);

        const { data, errors } = await storefrontClient.request<CartCreateData>(
            CART_CREATE_MUTATION,
            {
                variables: {
                    input: {
                        lines: [
                            {
                                merchandiseId,
                                quantity: 1
                            },
                        ],
                    },
                },
                ...(buyerIp ? {
                    headers: {
                        "Shopify-Storefront-Buyer-IP": buyerIp,
                    },
                } : {}),
            },
        );

        if (errors) {
            const graphQlMessages = errors.graphQLErrors?.map((error) => error.message).join(" | ");
            console.error(
                "[CART_CREATE][API]",
                graphQlMessages ?? errors.message ?? "Storefront API request failed."
            );

            return {
                status: "error",
                message: "Shopify could not create the cart."
            };
        }

        const payload = data?.cartCreate;

        if (!payload) {
            return {
                status: "error",
                message: "Shopify returned an empty cart response."
            };
        }

        if (payload.useErrors.length > 0) {
            return {
                status: "error",
                message: payload.useErrors.map((error) => error.message).join(" ")
            };
        }

        if (!payload.cart) {
            return {
                status: "error",
                message: "Shopify did not returned the created cart."
            };
        }

        const { totalQuantity, checkoutUrl, cost } = payload.cart;

        if (!checkoutUrl) {
            return {
                status: "error",
                message: "The cart does not contain a checkout URL."
            };
        }

        return {
            status: "success",
            message: `Cart created with ${totalQuantity} item. ` +
                `Total: ${cost.totalAmount.amount}. ` +
                `${cost.totalAmount.currencyCode}` +
                `Checkout URL received.`,
        };
    } catch (error) {
        console.error(
            "[CART_CREATE][EXCEPTION]",
            error instanceof Error ? error.message : "Unknown error."
        );

        return {
            status: "error",
            message: "An unexpected error ocurred while creating the cart."
        };
    }
}