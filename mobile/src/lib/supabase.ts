import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gwzldxhwusvhqrilccdc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3emxkeGh3dXN2aHFyaWxjY2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODQ2MTUsImV4cCI6MjA4ODQ2MDYxNX0.5rjcpRt_H8rkKpF8-6fN-bcUproUVIMx57i9u-TADwg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Wait for the Supabase auth client to finish restoring the session from
 * AsyncStorage. In the main app this happens before any UI renders, but in
 * a headless widget context the task handler can fire before init completes.
 */
export function waitForAuthReady() {
  return new Promise<void>((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "INITIAL_SESSION") {
          subscription.unsubscribe();
          resolve();
        }
      },
    );
  });
}
