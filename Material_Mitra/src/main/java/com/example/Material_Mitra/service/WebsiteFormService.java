package com.example.Material_Mitra.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

//import com.example.Material_Mitra.dto.ApplicationDTO;
import com.example.Material_Mitra.dto.WebsiteApplicationDTO;
import com.example.Material_Mitra.entity.WebsiteApplicationForm;
import com.example.Material_Mitra.enums.WebsiteReviewed;
import com.example.Material_Mitra.repository.WebsiteFormRepo;

@Service
public class WebsiteFormService {

    private final WebsiteFormRepo formRepo;

    public WebsiteFormService(WebsiteFormRepo formRepo) {
        this.formRepo = formRepo;
    }

    public WebsiteApplicationForm save(WebsiteApplicationForm application) {
        return formRepo.save(application);
    }

    public List<WebsiteApplicationDTO> getAllDTO() {
        return formRepo.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public WebsiteApplicationDTO getByIdDTO(Long id) {
        return formRepo.findById(id).map(this::convertToDTO).orElse(null);
    }

    public WebsiteApplicationDTO updateStatus(Long id, WebsiteReviewed status) {
        return formRepo.findById(id)
                .map(application -> {
                    application.setStatus(status);
                    WebsiteApplicationForm updated = formRepo.save(application);
                    return convertToDTO(updated);
                })
                .orElse(null);
    }

    public WebsiteApplicationDTO convertToDTO(WebsiteApplicationForm form) {
    	WebsiteApplicationDTO dto = new WebsiteApplicationDTO();
        dto.setId(form.getId());
        dto.setApplierName(form.getApplierName());
        dto.setEmail(form.getEmail());
        dto.setPhoneNumber(form.getPhoneNumber());
        dto.setCurrentLocation(form.getCurrentLocation());
        dto.setCurrentCtc(form.getCurrentCtc());
        dto.setWorkingCompanyName(form.getWorkingCompanyName());
        dto.setWorkRole(form.getWorkRole());
        dto.setTotalExperience(form.getTotalExperience());
        dto.setSkills(form.getSkills());
        dto.setResumePath(form.getResumePath());
        dto.setAppliedAt(form.getAppliedAt());
        dto.setCurrentlyWorking(form.getCurrentlyWorking().name());
        dto.setStatus(form.getStatus() != null ? form.getStatus().name() : WebsiteReviewed.NOTVIEWED.name());

        if (form.getJob() != null) {
            dto.setJobName(form.getJob().getJobName());
            if (form.getJob().getClient() != null) {
                dto.setClientName(form.getJob().getClient().getClientName());
            }
        }

        return dto;
    }
}
