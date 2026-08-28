"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
    createCartAction,
    type CreateCartState,
} from "@/app/actions/cart";

type CartVariant = {
    id: string;
    title: string;
    availableForSale: boolean;
    price: {
        amount: string;
        currencyCode: string;
    };
    selectedOptions: Array<{
        name: string;
        value: string;
    }>;
};

type CreateCartFormProps = {
    variants: CartVariant[];
};

const initialState: CreateCartState = {
    status: "idle",
    message: "",
};

function formatCurrency(amount: string, currencyCode: string): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
    }).format(Number(amount));
}

export function CreateCartForm({
    variants,
}: CreateCartFormProps) {
    const [state, formAction, isPending] = useActionState(
        createCartAction,
        initialState,
    );

    const defaultVariantId = variants.find(
        (variant) => variant.availableForSale,
    )?.id;

    return (
        <form action={formAction}>
            <fieldset disabled={isPending}>
                <legend>Choose a variant</legend>

                {variants.map((variant) => {
                    const options = variant.selectedOptions.map(
                        ({ name, value }) => `${name} - ${value}`,
                    ).join(", ");

                    return (
                        <label key={variant.id}>
                            <input type="radio" name="merchandiseId" value={variant.id} defaultChecked={variant.id === defaultVariantId} disabled={!variant.availableForSale} />
                            <span>
                                {options || variant.title}
                                {" - "}
                                {formatCurrency(variant.price.amount, variant.price.currencyCode)}
                                {" - "}
                                {variant.availableForSale ? "Available" : "Not Available"}
                            </span>
                        </label>
                    );
                })}
            </fieldset>

            <button type="submit" disabled={isPending || !defaultVariantId}>
                {isPending ? "Creating cart..." : "Create cart"}
            </button>

            {state.message ? (
                <p
                    role={state.status === "error" ? "alert" : "status"}
                    aria-live="polite"
                >{state.message}</p>
            ) : null}

            {state.status === "success" ? (
                <Link href="/cart">View cart</Link>
            ) : null}
        </form>
    );
}