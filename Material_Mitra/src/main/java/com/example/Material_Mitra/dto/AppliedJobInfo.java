package com.example.Material_Mitra.dto;

public class AppliedJobInfo {
    private String jobName;
    private String clientName;
    
    public AppliedJobInfo() {}
    
    public AppliedJobInfo(String jobName, String clientName) {
        this.jobName = jobName;
        this.clientName = clientName;
    }
    
    public String getJobName() { 
        return jobName; 
    }
    
    public void setJobName(String jobName) { 
        this.jobName = jobName; 
    }
    
    public String getClientName() { 
        return clientName; 
    }
    
    public void setClientName(String clientName) { 
        this.clientName = clientName; 
    }
}
