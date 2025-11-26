package com.example.Material_Mitra.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.dto.InterviewApplicationDTO;
import com.example.Material_Mitra.dto.InterviewDTO;
import com.example.Material_Mitra.dto.InterviewDetailDTO;
import com.example.Material_Mitra.dto.InterviewListDTO;
import com.example.Material_Mitra.dto.InterviewPatchDTO;
import com.example.Material_Mitra.dto.InterviewUpdateDTO;
import com.example.Material_Mitra.entity.Interview;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.service.InterviewService;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    @PostMapping("/schedule/{applicationId}")
    public ResponseEntity<Interview> scheduleInterview(
            @PathVariable Long applicationId,
            @RequestParam("interviewDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate interviewDate,
            @RequestParam("interviewTime") @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime interviewTime,
            @RequestParam("endTime") @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(required = false) String description) {

        Interview interview = new Interview();
        interview.setInterviewDate(interviewDate);
        interview.setInterviewTime(interviewTime);
        interview.setEndTime(endTime);
        interview.setDescription(description);

        return ResponseEntity.ok(interviewService.scheduleInterview(applicationId, interview));
    }

//    @GetMapping("/{id}")
//    public ResponseEntity<Interview> getInterview(@PathVariable Long id) {
//        return ResponseEntity.ok(interviewService.getInterviewById(id));
//    }
    @GetMapping("/{id}")
    public ResponseEntity<InterviewApplicationDTO> getInterviewWithApplication(@PathVariable Long id) {
        Interview interview = interviewService.getInterviewById(id);
        JobApplication application = interview.getApplication();
        
        InterviewApplicationDTO dto = new InterviewApplicationDTO();
        dto.setInterviewId(interview.getId());
        dto.setInterviewDate(interview.getInterviewDate().toString());
        dto.setInterviewTime(interview.getInterviewTime().toString());
        dto.setEndTime(interview.getEndTime().toString());
        
        if (application != null) {
            dto.setApplicationId(application.getId());
            dto.setCandidateName(application.getCandidate().getName());
            dto.setJobTitle(application.getJob().getJobName());
        }

        return ResponseEntity.ok(dto);
    }

//    @GetMapping
//    public ResponseEntity<List<InterviewDTO>> getAllInterviews() {
//        List<Interview> interviews = interviewService.getAll();
//        List<InterviewDTO> dtoList = interviews.stream()
//                                               .map(DTOMapper::toInterviewDTO)
//                                               .toList();
//        return ResponseEntity.ok(dtoList);
//    }
//
//    @GetMapping
//    public ResponseEntity<List<InterviewDTO>> getAllInterviews() {
//        List<InterviewDTO> interviews = interviewService.getAllInterviews();
//        return ResponseEntity.ok(interviews);
//    }
//

//    @GetMapping
//    public ResponseEntity<List<Interview>> getAllInterviews() {
//        return ResponseEntity.ok(interviewService.getAllInterviews());
//    }

    @GetMapping("/date")
    public ResponseEntity<List<Interview>> getInterviewsByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(interviewService.getInterviewsByDate(date));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Interview> updateInterview(
            @PathVariable Long id,
            @RequestBody InterviewUpdateDTO dto) {
        Interview interview = interviewService.updateInterview(id, dto);
        return ResponseEntity.ok(interview);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteInterview(@PathVariable Long id) {
        interviewService.deleteInterview(id);
        return ResponseEntity.ok("Interview deleted successfully.");
    }

    @GetMapping("/search")
    public ResponseEntity<Page<InterviewListDTO>> searchInterviews(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<InterviewListDTO> result = interviewService.getFilteredInterviews(search, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/count/today")
    public long getTodayInterviewCount() {
        return interviewService.countTodayInterviews();
    }
    
    @PatchMapping("/{id}")
    public ResponseEntity<Interview> patchInterview(
            @PathVariable Long id,
            @RequestBody InterviewPatchDTO dto) {
        Interview updated = interviewService.patchInterview(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/all-with-client")
    public ResponseEntity<List<InterviewDTO>> getAllInterviewsWithClient() {
        List<InterviewDTO> interviews = interviewService.getAllInterviewsWithClient();
        return ResponseEntity.ok(interviews);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Interview> completeInterview(
            @PathVariable Long id,
            @RequestParam(required = false) String completionNotes) {
        Interview interview = interviewService.completeInterview(id, completionNotes);
        return ResponseEntity.ok(interview);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<InterviewDetailDTO> getInterviewDetails(@PathVariable Long id) {
        InterviewDetailDTO details = interviewService.getInterviewDetails(id);
        return ResponseEntity.ok(details);
    }


}
