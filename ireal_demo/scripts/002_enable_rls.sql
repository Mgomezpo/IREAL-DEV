-- Enable Row Level Security on all tables
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for IDEAS
CREATE POLICY "Users can view their own ideas"
  ON ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for PLANS
CREATE POLICY "Users can view their own plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for PLAN_SECTIONS
CREATE POLICY "Users can view sections of their own plans"
  ON plan_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM plans WHERE plans.id = plan_sections.plan_id AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sections to their own plans"
  ON plan_sections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM plans WHERE plans.id = plan_sections.plan_id AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sections of their own plans"
  ON plan_sections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM plans WHERE plans.id = plan_sections.plan_id AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sections of their own plans"
  ON plan_sections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM plans WHERE plans.id = plan_sections.plan_id AND plans.user_id = auth.uid()
  ));

-- RLS Policies for IDEAS_PLANS
CREATE POLICY "Users can view their own ideas-plans relationships"
  ON ideas_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ideas WHERE ideas.id = ideas_plans.idea_id AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own ideas-plans relationships"
  ON ideas_plans FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ideas WHERE ideas.id = ideas_plans.idea_id AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own ideas-plans relationships"
  ON ideas_plans FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM ideas WHERE ideas.id = ideas_plans.idea_id AND ideas.user_id = auth.uid()
  ));

-- RLS Policies for PIECES
CREATE POLICY "Users can view their own pieces"
  ON pieces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pieces"
  ON pieces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pieces"
  ON pieces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pieces"
  ON pieces FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ASSETS
CREATE POLICY "Users can view their own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for CALENDAR_RUNS
CREATE POLICY "Users can view their own calendar runs"
  ON calendar_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar runs"
  ON calendar_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar runs"
  ON calendar_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar runs"
  ON calendar_runs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for CALENDAR_ENTRIES
CREATE POLICY "Users can view their own calendar entries"
  ON calendar_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar entries"
  ON calendar_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar entries"
  ON calendar_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar entries"
  ON calendar_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for PUBLISH_INTENTS
ALTER TABLE publish_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own publish intents"
  ON publish_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own publish intents"
  ON publish_intents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
