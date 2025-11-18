-- Update the candidate.status column to allow the latest ResultStatus values.
-- This converts the column to VARCHAR so new statuses do not require schema edits again.

ALTER TABLE candidate
    MODIFY COLUMN status VARCHAR(100) NOT NULL;

-- Optional: if you prefer to keep MySQL ENUM, uncomment the block below instead
-- and make sure all enum values are listed exactly as in ResultStatus.java.
/*
ALTER TABLE candidate
    MODIFY COLUMN status ENUM(
        'NEW_CANDIDATE',
        'PENDING',
        'SCHEDULED',
        'INTERVIEWED',
        'PLACED',
        'REJECTED',
        'NOT_INTERESTED',
        'HOLD',
        'HIGH_CTC',
        'DROPPED_BY_CLIENT',
        'SUBMITTED_TO_CLIENT',
        'NO_RESPONSE',
        'IMMEDIATE',
        'REJECTED_BY_CLIENT',
        'CLIENT_SHORTLIST',
        'FIRST_INTERVIEW_SCHEDULED',
        'FIRST_INTERVIEW_FEEDBACK_PENDING',
        'FIRST_INTERVIEW_REJECT',
        'SECOND_INTERVIEW_SCHEDULED',
        'SECOND_INTERVIEW_FEEDBACK_PENDING',
        'SECOND_INTERVIEW_REJECT',
        'THIRD_INTERVIEW_SCHEDULED',
        'THIRD_INTERVIEW_FEEDBACK_PENDING',
        'THIRD_INTERVIEW_REJECT',
        'INTERNEL_REJECT',
        'CLIENT_REJECT',
        'FINAL_SELECT',
        'JOINED',
        'BACKEDOUT'
    ) NOT NULL;
*/

