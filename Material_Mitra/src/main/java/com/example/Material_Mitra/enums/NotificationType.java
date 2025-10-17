package com.example.Material_Mitra.enums;

public enum NotificationType {
    NEW_APPLICATION("New Application"),
    APPLICATION_UPDATE("Application Update"),
    INTERVIEW_SCHEDULED("Interview Scheduled"),
    INTERVIEW_COMPLETED("Interview Completed"),
    JOB_POSTED("Job Posted"),
    JOB_UPDATED("Job Updated"),
    SYSTEM_ALERT("System Alert"),
    GENERAL("General");
    
    private final String displayName;
    
    NotificationType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
