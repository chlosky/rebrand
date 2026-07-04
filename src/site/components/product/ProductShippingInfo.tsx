import { Link } from "react-router-dom";
import { PRODUCT_SHIPPING } from "@/site/lib/productShipping";

export function ProductShippingInfo() {
  return (
    <section
      className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4"
      aria-labelledby="board-shipping-heading"
    >
      <h2 id="board-shipping-heading" className="text-sm font-semibold text-neutral-900">
        Shipping
      </h2>
      <dl className="mt-3 space-y-2 text-sm text-neutral-600">
        <div className="flex justify-between gap-4">
          <dt>Shipping cost (US)</dt>
          <dd className="text-right font-medium text-neutral-900">{PRODUCT_SHIPPING.costLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Ships to</dt>
          <dd className="text-right font-medium text-neutral-900">{PRODUCT_SHIPPING.destination}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Processing time</dt>
          <dd className="text-right font-medium text-neutral-900">{PRODUCT_SHIPPING.processingTime}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Estimated delivery</dt>
          <dd className="text-right font-medium text-neutral-900">{PRODUCT_SHIPPING.deliveryTime}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">{PRODUCT_SHIPPING.costNote}</p>
      <p className="mt-2 text-xs">
        <Link to={PRODUCT_SHIPPING.policyPath} className="font-medium text-neutral-900 underline">
          Full shipping policy
        </Link>
      </p>
    </section>
  );
}
