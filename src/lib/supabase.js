import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://kmxpachollvsiytppvyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteHBhY2hvbGx2c2l5dHBwdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTk0MTYsImV4cCI6MjA5NDIzNTQxNn0.w6tVaItGQi-tuWuoqRqcRl6Z7gIpBIFIcji6szRTXI4"
);
