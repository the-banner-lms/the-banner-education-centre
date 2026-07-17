UPDATE public.monthly_tuition_fees AS fee
SET
  base_amount = 0,
  yle_amount = fee.amount
FROM public.profiles AS profile
WHERE profile.id = fee.student_id
  AND profile.assigned_class = 'yle'
  AND (fee.base_amount <> 0 OR fee.yle_amount <> fee.amount);

COMMENT ON COLUMN public.monthly_tuition_fees.yle_amount IS
'YLE tuition portion. For a standalone YLE student this equals the full invoice amount.';
