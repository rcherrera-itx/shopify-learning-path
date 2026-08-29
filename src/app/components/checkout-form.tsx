"use client";

import { useActionState } from "react";
import { type CheckoutState, proceedToCheckout } from "../actions/cart";

const initialState: CheckoutState = {
    status: "idle",
    message: "",
}

export function CheckoutForm() {
    const [state, formAction, isPending] = useActionState(
        proceedToCheckout,
        initialState
    );

    return (
        <form action={formAction}>
            <button type="submit" disabled={isPending}>
                {isPending ? "Redirecting to checkout..." : "Proceed to checkout"}
            </button>

            {state.message ? (
                <p role="alert" aria-live="polite">{state.message}</p>
            ) : null}
        </form>
    );
}