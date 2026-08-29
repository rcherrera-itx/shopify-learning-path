import { Suspense } from "react";
import Link from "next/link";

import { getProductByHandle } from "@/shopify/queries/product";
import { AddToCartForm } from "./components/add-to-cart-form";


async function ProductDetail() {
    const product = await getProductByHandle('composable-commerce-t-shirt');

    const defaultVariantId = product.variants.nodes.find(
        (variant) => variant.availableForSale,
    )?.id;

    return (
        <article>
            <header>
                <p>Product loaded from Shopify</p>
                <h2>{product.title}</h2>
                <p>{product.description}</p>
            </header>

            <dl>
                <div>
                    <dt>Handle</dt>
                    <dd>{product.handle}</dd>
                </div>
                <div>
                    <dt>Available for sale</dt>
                    <dd>{product.availableForSale}</dd>
                </div>
            </dl>

            <AddToCartForm variants={product.variants.nodes} />
            <Link href="/cart">View cart</Link>
        </article>
    );
};

export default function HomePage() {
    return (
        <main>
            <p>Shopify Learning Path</p>
            <h1>Day 7: Cart and checkout</h1>
            <Suspense fallback={<p>Loading...</p>}>
                <ProductDetail />
            </Suspense>
        </main>
    );
};