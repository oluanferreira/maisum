type EssentialEventPayload = {
  eventName: "experience_validated";
  source?: string;
  pathname?: string;
  restaurantId?: string | null;
  couponId?: string | null;
  metadata?: Record<string, unknown>;
};

type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => unknown;
};

export async function trackRestaurantEvent(
  supabase: RpcClient,
  payload: EssentialEventPayload
): Promise<void> {
  try {
    await supabase.rpc("track_funnel_event", {
      p_event_name: payload.eventName,
      p_source: payload.source ?? "restaurant_web",
      p_pathname: payload.pathname ?? null,
      p_restaurant_id: payload.restaurantId ?? null,
      p_dish_id: null,
      p_coupon_id: payload.couponId ?? null,
      p_anonymous_id: null,
      p_metadata: payload.metadata ?? {},
    });
  } catch {
    // Analytics must never block restaurant validation.
  }
}
