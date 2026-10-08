-- ==============================================================================
-- Migration: 014_system_architecture_hardening.sql
-- Description: System architecture hardening, atomic teacher payouts,
--              flexible revenue ledger adjustments, and performance indexing.
-- ==============================================================================

-- 1. Allow nullable payment references on non-sale ledger entries (e.g. payouts / admin adjustments)
ALTER TABLE public.revenue_ledger 
    ALTER COLUMN payment_id DROP NOT NULL,
    ALTER COLUMN payment_intent_id DROP NOT NULL;

-- 2. Performance indexes for high-concurrency lookup & telemetry
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_account_direction_amount
ON public.revenue_ledger (account_type, account_id, direction, amount_cents);

CREATE INDEX IF NOT EXISTS idx_teacher_payouts_teacher_status_amount
ON public.teacher_payouts (teacher_id, status, amount_cents);

-- 3. Atomic Stored Procedure: Request Teacher Payout with row locks
CREATE OR REPLACE FUNCTION public.request_teacher_payout(
    p_teacher_id UUID,
    p_amount_cents INTEGER,
    p_payout_method TEXT,
    p_payout_details TEXT,
    p_currency TEXT DEFAULT 'INR'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_earned_cents BIGINT := 0;
    v_total_debited_cents BIGINT := 0;
    v_net_ledger_cents BIGINT := 0;
    v_inflight_cents BIGINT := 0;
    v_available_cents BIGINT := 0;
    v_payout_id UUID;
BEGIN
    IF p_amount_cents <= 0 THEN
        RAISE EXCEPTION 'Payout amount must be positive' USING ERRCODE = 'P0001';
    END IF;

    IF p_payout_method NOT IN ('upi', 'bank') THEN
        RAISE EXCEPTION 'Invalid payout method. Supported: upi, bank' USING ERRCODE = 'P0001';
    END IF;

    -- Lock teacher profile row to serialize concurrent payout requests
    PERFORM 1 FROM public.profiles WHERE id = p_teacher_id FOR UPDATE;

    -- Calculate total credits
    SELECT COALESCE(SUM(amount_cents), 0)
    INTO v_total_earned_cents
    FROM public.revenue_ledger
    WHERE account_type = 'teacher'
      AND account_id = p_teacher_id
      AND direction = 'credit';

    -- Calculate total debits
    SELECT COALESCE(SUM(amount_cents), 0)
    INTO v_total_debited_cents
    FROM public.revenue_ledger
    WHERE account_type = 'teacher'
      AND account_id = p_teacher_id
      AND direction = 'debit';

    v_net_ledger_cents := v_total_earned_cents - v_total_debited_cents;

    -- Calculate in-flight (pending / approved) payouts
    SELECT COALESCE(SUM(amount_cents), 0)
    INTO v_inflight_cents
    FROM public.teacher_payouts
    WHERE teacher_id = p_teacher_id
      AND status IN ('pending', 'approved');

    v_available_cents := GREATEST(0, v_net_ledger_cents - v_inflight_cents);

    IF p_amount_cents > v_available_cents THEN
        RAISE EXCEPTION 'Requested amount (%) exceeds available balance (%)',
            p_amount_cents, v_available_cents
            USING ERRCODE = 'P0002';
    END IF;

    -- Insert payout record
    INSERT INTO public.teacher_payouts (
        teacher_id,
        amount_cents,
        currency,
        payout_method,
        payout_details,
        status,
        created_at
    ) VALUES (
        p_teacher_id,
        p_amount_cents,
        p_currency,
        p_payout_method,
        p_payout_details,
        'pending',
        now()
    )
    RETURNING id INTO v_payout_id;

    RETURN jsonb_build_object(
        'success', true,
        'payout_id', v_payout_id,
        'amount_cents', p_amount_cents,
        'remaining_available_cents', v_available_cents - p_amount_cents,
        'status', 'pending'
    );
END;
$$;
