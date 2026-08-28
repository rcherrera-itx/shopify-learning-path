"use server"
import { cookies } from "next/headers";
import { getBuyerIpHeaders } from "@/shopify/buyer-ip";
import { storefrontClient } from "@/shopify/client";
import { CART_COOKIE_MAX_AGE, CART_COOKIE_NAME } from '@/shopify/cart-cookie';


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
            userErrors {
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
        userErrors: Array<{
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
        const buyerIpheaders = await getBuyerIpHeaders();

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
                headers: buyerIpheaders
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

        if (payload.userErrors.length > 0) {
            return {
                status: "error",
                message: payload.userErrors.map((error) => error.message).join(" ")
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

        const cookieStore = await cookies();

        cookieStore.set(
            CART_COOKIE_NAME,
            payload.cart.id,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: CART_COOKIE_MAX_AGE
            }
        );

        return {
            status: "success",
            message: `Cart created with ${totalQuantity} item. ` +
                `Total: ${cost.totalAmount.amount}` +
                `${cost.totalAmount.currencyCode}. ` +
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