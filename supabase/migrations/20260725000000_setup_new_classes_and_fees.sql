ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_assigned_class_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_assigned_class_check CHECK (assigned_class IS NULL OR assigned_class IN ('pre-kg', 'kg', 'yle', 'primary1', 'primary2', 'primary3', 'primary4', 'primary5', 'primary6', 'grade1', 'grade2', 'year5', 'year8'));

ALTER TABLE enrollment_submissions DROP CONSTRAINT IF EXISTS enrollment_submissions_assigned_class_check;
ALTER TABLE enrollment_submissions ADD CONSTRAINT enrollment_submissions_assigned_class_check CHECK (assigned_class IN ('pre-kg', 'kg', 'yle', 'primary1', 'primary2', 'primary3', 'primary4', 'primary5', 'primary6', 'grade1', 'grade2', 'year5', 'year8'));
