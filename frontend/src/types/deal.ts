export type Deal = {
  id: string;
  title: string;
  stage: string;
  estimated_value: string;
  final_value: string | null;
  probability: number;
  expected_close_date: string | null;
  lost_reason: string | null;
  notes: string | null;
  client: { id: string; name: string };
  property: { id: string; title: string };
  broker: { id: string; full_name: string };
  history: {
    id: string;
    from_stage: string | null;
    to_stage: string;
    notes: string | null;
    created_at: string;
    changed_by: { full_name: string };
  }[];
  created_at: string;
};
