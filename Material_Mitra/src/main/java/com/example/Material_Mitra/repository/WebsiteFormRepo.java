package com.example.Material_Mitra.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.WebsiteApplicationForm;

@Repository
public interface WebsiteFormRepo extends JpaRepository<WebsiteApplicationForm, Long> {
}
