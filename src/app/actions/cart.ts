"use server"
import { cookies } from "next/headers";
import { getBuyerIpHeaders } from "@/shopify/buyer-ip";
import { storefrontClient } from "@/shopify/client";
import { CART_COOKIE_MAX_AGE, CART_COOKIE_NAME } from '@/shopify/cart-cookie';
import { revalidatePath } from "next/cache";


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
                message: "Shopify did not return the created cart."
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
                `Total: ${cost.totalAmount.amount} ` +
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

const CART_LINES_UPDATE_MUTATION = `#graphql
    mutation CartLinesUpdate(
        $cartId: ID!
        $lines: [CartLineUpdateInput!]!
    ) {
        cartLinesUpdate(
            cartId: $cartId,
            lines: $lines
        ) {
            cart {
                totalQuantity
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

type CartLinesUpdateData = {
    cartLinesUpdate: {
        cart: {
            totalQuantity: number;
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

export type UpdateCartLineState = {
    status: "idle" | "success" | "error";
    message: string;
}

export async function updateCartLineAction(
    _previousState: UpdateCartLineState,
    formData: FormData
): Promise<UpdateCartLineState> {
    const cartLineId = formData.get('cartLineId');
    const requestedQuantity = formData.get('quantity');

    const quantity = typeof requestedQuantity === "string" ? Number(requestedQuantity) : Number.NaN;

    if (
        typeof cartLineId !== "string" ||
        !cartLineId.startsWith("gid://shopify/CartLine/")
    ) {
        return {
            status: "error",
            message: "The cart line is invalid."
        }
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
        return {
            status: "error",
            message: "Quantity must be a positive whole number."
        }
    }

    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!cartId) {
        return {
            status: "error",
            message: "The cart session is missing."
        }
    }

    try {
        const buyerIpHeaders = await getBuyerIpHeaders();

        const { data, errors } = await storefrontClient.request<CartLinesUpdateData>(
            CART_LINES_UPDATE_MUTATION,
            {
                variables: {
                    cartId,
                    lines: [
                        {
                            id: cartLineId,
                            quantity
                        },
                    ],
                },
                headers: buyerIpHeaders,
            },
        );

        if (errors) {
            const graphQlMessages = errors.graphQLErrors?.map((error) => error.message).join(" | ");
            console.error(
                "[CART_LINE_UPDATE][API]",
                graphQlMessages ?? errors.message ?? "Storefront API request failed."
            );

            return {
                status: "error",
                message: "Shopify could not update the cart."
            };
        }

        const payload = data?.cartLinesUpdate;

        if (!payload) {
            return {
                status: "error",
                message: "Shopify returned an empty update response."
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
                message: "Shopify did not return the updated cart."
            };
        }

        revalidatePath("/cart");

        return {
            status: "success",
            message: `Quantity updated. Cart now contains  ` +
                `${payload.cart.totalQuantity} item(s).`,
        };
    } catch (error) {
        console.error(
            "[CART_LINE_UPDATE][EXCEPTION]",
            error instanceof Error ? error.message : "Unknown error."
        );

        return {
            status: "error",
            message: "An unexpected error ocurred while updating the cart."
        };
    }
};