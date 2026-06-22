import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const EsewaCheckout = ({ orderDetails }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);

  // eSewa UAT/RC Endpoint
  const ESEWA_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

  const initiatePayment = async () => {
    setLoading(true);
    try {
      // 1. Call your backend to get the signature and unique transaction ID
      // Your backend should use its Secret Key to generate the HMAC-SHA256 signature
      const response = await axios.post(
        '/api/payments/initiate-esewa',
        {
          amount: orderDetails.totalAmount,
          productId: orderDetails.productId
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const data = response.data.data;
      
      // 2. Set the data needed for the eSewa form
      setPaymentData({
        amount: data.amount,
        tax_amount: "0",
        total_amount: data.amount,
        transaction_uuid: data.transaction_uuid,
        product_code: "EPAYTEST", // Use 'EPAYTEST' for UAT
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${window.location.origin}/payment-success`,
        failure_url: `${window.location.origin}/payment-failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: data.signature
      });
    } catch (err) {
      console.error("Payment initiation failed", err);
      toast.error("Could not initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Auto-submit form when paymentData is populated
  useEffect(() => {
    if (paymentData) {
      document.getElementById('esewa-form').submit();
    }
  }, [paymentData]);

  return (
    <div className="esewa-integration">
      <button 
        onClick={initiatePayment} 
        className="btn-primary" 
        disabled={loading}
      >
        {loading ? "Processing..." : "Proceed to Payment (eSewa)"}
      </button>

      {/* Hidden Form for eSewa Redirection */}
      {paymentData && (
        <form id="esewa-form" action={ESEWA_URL} method="POST" style={{ display: 'none' }}>
          {Object.entries(paymentData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
};

export default EsewaCheckout;