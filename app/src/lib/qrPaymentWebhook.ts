/**
 * Utility function to notify the webhook about QR payment completion
 */
export async function notifyPaymentWebhook(
  sessionId: string,
  txHash: string,
  buyerAddress: string,
  paymentMethod: "USDC" | "USDT" | "AVAX",
  amount?: string
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
    return { success: false, error: "Missing Supabase URL" };
  }

  const webhookUrl = `${supabaseUrl}/functions/v1/qr-payment-webhook`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type: "payment_received",
        data: {
          sessionId,
          txHash,
          buyerAddress,
          paymentMethod,
          amount,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Webhook error:", errorData);
      return {
        success: false,
        error: errorData.error || `Webhook returned status ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true };
  } catch (error) {
    console.error("Error calling webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
