export default function OrderSummary({ subtotal, discount = 0, deliveryFee = 0, currency = '₹', itemCount = 0 }) {
  const total = subtotal - discount + deliveryFee;

  return (
    <div className="order-summary">
      <div className="row">
        <span>Subtotal{itemCount > 0 ? ` (${itemCount} items)` : ''}</span>
        <span>{currency}{subtotal.toFixed(2)}</span>
      </div>
      <div className="row">
        <span>Delivery Fee</span>
        <span>{deliveryFee > 0 ? `${currency}${deliveryFee.toFixed(2)}` : 'FREE'}</span>
      </div>
      {discount > 0 && (
        <div className="row discount">
          <span>Discount</span>
          <span>-{currency}{discount.toFixed(2)}</span>
        </div>
      )}
      <div className="row total">
        <span>Total</span>
        <span className="total-amount">{currency}{total.toFixed(2)}</span>
      </div>

      <style jsx>{`
        .order-summary {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          padding: var(--space-2) 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: var(--color-text-variant);
          font-weight: 400;
        }
        .row.discount {
          color: var(--color-text-variant);
          font-weight: 400;
        }
        .row.total {
          margin-top: var(--space-1);
          padding-top: var(--space-2);
          border-top: 1px dashed var(--color-outline-variant);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--color-text);
        }
        .total-amount {
          color: var(--color-primary);
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
}
