package com.example.Material_Mitra.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Material_Mitra.entity.Client;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.repository.ClientRepository;

@Service
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }
    /////////priorty 
    public List<Client> getClientsByNamePriority(String name) {
        return clientRepository.searchClientsByKeyword(name);
    }
    //


    @Transactional
    public Client saveClientWithJobs(Client client) {
        if (client.getJobs() != null) {
            client.getJobs().forEach(job -> job.setClient(client));
        }
        return clientRepository.save(client);
    }
    
    
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }
    
    public Optional<Client> getClientById(Long id) {
        return clientRepository.findById(id);
    }
    
    
    @Transactional
    public Client updateClient(Client client) {
        if (client.getJobs() != null) {
            client.getJobs().forEach(job -> job.setClient(client));
        }
        return clientRepository.save(client);
    }
    @Transactional
    public void deleteClient(Long clientId) {
        clientRepository.findById(clientId).ifPresent(client -> {
            // Check if the client has any associated jobs
            if (client.getJobs() != null && !client.getJobs().isEmpty()) {
                throw new IllegalStateException("Cannot delete client with existing jobs.");
            }

            // Proceed to delete if no jobs are associated
            clientRepository.delete(client);
        });
    }

    // New method: Add a job to existing client
    @Transactional
    public Optional<Client> addJobToClient(Long clientId, Job job) {
        return clientRepository.findById(clientId).map(client -> {
            job.setClient(client);
            job.setCreatedAt(LocalDate.now());  // auto set current date
            client.getJobs().add(job);
            return clientRepository.save(client);
        });
        }
}
