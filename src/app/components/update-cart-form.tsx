"use client";

import { useActionState, useId } from "react";
import Link from "next/link";

import {
    updateCartLineAction,
    type UpdateCartLineState,
} from "@/app/actions/cart";

type UpdateCartLineFormProps = {
    cartLineId: string;
    quantity: number;
};

const initialState: UpdateCartLineState = {
    status: "idle",
    message: "",
};

export function UpdateCartLineForm({
    cartLineId,
    quantity
}: UpdateCartLineFormProps) {

    const quantityInputId = useId();

    const [state, formAction, isPending] = useActionState(
        updateCartLineAction,
        initialState,
    );

    return (
        <form action={formAction}>
            <input type="hidden" name="cartLineId" value={cartLineId} />

            <label htmlFor={quantityInputId}>Quantity</label>

            <input id={quantityInputId} type="number" name="quantity" min="1" step="1" defaultValue={quantity} required disabled={isPending} />

            <button type="submit" disabled={isPending}>
                {isPending ? "Updating cart..." : "Update cart"}
            </button>

            {state.message ? (
                <p
                    role={state.status === "error" ? "alert" : "status"}
                    aria-live="polite"
                >{state.message}</p>
            ) : null}
        </form>
    );
}