package com.example.Material_Mitra.dto;
public class InterviewApplicationDTO {
    private Long interviewId;
    private String interviewDate;
    private String interviewTime;
    private Long applicationId;
    private String candidateName;
    private String jobTitle;
    private String endTime;
    
    // constructors, getters, setters
	public InterviewApplicationDTO() {
		super();
	}

	public InterviewApplicationDTO(Long interviewId, String interviewDate, String interviewTime, Long applicationId,
			String candidateName, String jobTitle,String endTime) {
		super();
		this.interviewId = interviewId;
		this.interviewDate = interviewDate;
		this.interviewTime = interviewTime;
		this.applicationId = applicationId;
		this.candidateName = candidateName;
		this.jobTitle = jobTitle;
		this.endTime = endTime;
	}

	public Long getInterviewId() {
		return interviewId;
	}

	public void setInterviewId(Long interviewId) {
		this.interviewId = interviewId;
	}

	public String getInterviewDate() {
		return interviewDate;
	}

	public void setInterviewDate(String interviewDate) {
		this.interviewDate = interviewDate;
	}

	public String getInterviewTime() {
		return interviewTime;
	}

	public void setInterviewTime(String interviewTime) {
		this.interviewTime = interviewTime;
	}

	public Long getApplicationId() {
		return applicationId;
	}

	public void setApplicationId(Long applicationId) {
		this.applicationId = applicationId;
	}

	public String getCandidateName() {
		return candidateName;
	}

	public void setCandidateName(String candidateName) {
		this.candidateName = candidateName;
	}

	public String getJobTitle() {
		return jobTitle;
	}

	public void setJobTitle(String jobTitle) {
		this.jobTitle = jobTitle;
	}

	public String getEndTime() {
		return endTime;
	}

	public void setEndTime(String endTime) {
		this.endTime = endTime;
	}

  
    
}
