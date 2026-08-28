import { getProductByHandle } from "@/shopify/queries/product";
import { Suspense } from "react";

function formatCurrency(amount: string, currencyCode: string): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode
    }).format(Number(amount));
}

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

            <fieldset>
                <legend>Choose a variant</legend>

                {product.variants.nodes.map((variant) => {
                    const options = variant.selectedOptions
                        .map(({ name, value }) => `${name}: ${value}`)
                        .join(", ");

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