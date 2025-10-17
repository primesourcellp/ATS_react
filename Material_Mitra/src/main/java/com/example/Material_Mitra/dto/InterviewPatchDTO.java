package com.example.Material_Mitra.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class InterviewPatchDTO {
    private LocalDate interviewDate;
    private LocalTime interviewTime;
    private LocalTime endTime;
    private Long applicationId; // Optional
    
    
	public LocalDate getInterviewDate() {
		return interviewDate;
	}
	public void setInterviewDate(LocalDate interviewDate) {
		this.interviewDate = interviewDate;
	}
	public LocalTime getInterviewTime() {
		return interviewTime;
	}
	public void setInterviewTime(LocalTime interviewTime) {
		this.interviewTime = interviewTime;
	}
	public LocalTime getEndTime() {
		return endTime;
	}
	public void setEndTime(LocalTime endTime) {
		this.endTime = endTime;
	}
	public Long getApplicationId() {
		return applicationId;
	}
	public void setApplicationId(Long applicationId) {
		this.applicationId = applicationId;
	}

    // Getters and setters
    
    
    
    
}
