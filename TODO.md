# TODO - eSewa Order Item Size/Description Fix

## Step 1: Identify root cause
- [x] Confirm ProductModal stores `size` and product description correctly into cart state
- [x] Confirm Cart.jsx strips size/description before calling `/api/esewa/initiate`

## Step 2: Implement client-side fix
- [x] Update `client/src/pages/Cart.jsx` `initiatePayment()` payload to include `size`, `description`, `image`, and `name` inside `items`.
- [x] Add debug logging before calling `/esewa/initiate` to verify payload contents.


## Step 3: Server-side hardening
- [x] Add debug log in `server/controllers/esewaController.js` right before creating the payment record to confirm received `req.body.items`.
- [x] Ensure orderItems mapping uses `payment.items` fields for `size` and `description` (fallbacks should remain).


## Step 4: UI confirmation
- [x] Confirm user dashboard renders `{item.size || '-'}` and description
- [x] Confirm admin order details modal renders size + description



## Step 5: Verification in DB
- [ ] After order creation, verify MongoDB document contains `items[].size` and `items[].description`.
- [ ] Re-test complete flow: ProductModal → Cart → eSewa initiate → eSewa verify → Order creation → My Orders + Admin modal


