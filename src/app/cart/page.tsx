import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { CART_COOKIE_NAME } from "@/shopify/cart-cookie";
import { getCart } from "@/shopify/queries/cart";
import { UpdateCartLineForm } from "../components/update-cart-form";
import { CheckoutForm } from "../components/checkout-form";

function formatCurrency(amount: string, currencyCode: string): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode
    }).format(Number(amount));
}

async function CartDetails() {
    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!cartId) {
        return (
            <>
                <p>Your cart is empty.</p>
                <Link href="/" >Return to product.</Link>
            </>
        );
    }

    const cart = await getCart(cartId);

    if (!cart) {
        return (
            <>
                <p>Your cart is unavailable or expired.</p>
                <Link href="/" >Return to product.</Link>
            </>
        );
    }

    return (
        <>
            <p>Total items: {cart.totalQuantity}</p>
            <ul>
                {cart.lines.nodes.map((line) => (
                    <li key={line.id}>
                        <p>
                            {line.merchandise.product.title}
                            {" - "}
                            {line.merchandise.title}
                        </p>

                        <UpdateCartLineForm cartLineId={line.id} quantity={line.quantity} />

                        <p>
                            Unit price:{" "}
                            {formatCurrency(
                                line.merchandise.price.amount,
                                line.merchandise.price.currencyCode
                            )}
                        </p>
                    </li>
                ))}
            </ul>

            <p>
                Total: {" "}
                {formatCurrency(
                    cart.cost.totalAmount.amount,
                    cart.cost.totalAmount.currencyCode
                )}
            </p>

            <CheckoutForm />
            <Link href="/">Return to product</Link>
        </>
    );
}

export default function CartPage() {
    return (
        <main>
            <p>Shopify Learning Path</p>
            <h1>Cart</h1>

            <Suspense fallback={<p>Loading...</p>}>
                <CartDetails />
            </Suspense>
        </main>
    );
}