package com.example.Material_Mitra.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.entity.Client;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.service.ClientService;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // Create Client with Jobs
    @PostMapping
    public ResponseEntity<Client> createClient(@RequestBody Client client) {
        Client savedClient = clientService.saveClientWithJobs(client);
        return ResponseEntity.ok(savedClient);
    }

    // Get all Clients
    @GetMapping
    public ResponseEntity<List<Client>> getAllClients() {
        List<Client> clients = clientService.getAllClients();
        return ResponseEntity.ok(clients);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Client>> searchClients(@RequestParam String name) {
        List<Client> clients = clientService.getClientsByNamePriority(name);
        return ResponseEntity.ok(clients);
    }


    // Get Client by Id
    @GetMapping("/{id}")
    public ResponseEntity<Client> getClientById(@PathVariable Long id) {
        return clientService.getClientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update Client
    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable Long id, @RequestBody Client client) {
        if (!id.equals(client.getId())) {
            return ResponseEntity.badRequest().build();
        }
        Client updatedClient = clientService.updateClient(client);
        return ResponseEntity.ok(updatedClient);
    }

    // Delete Client without deleting jobs (disassociate jobs first)
//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> deleteClient(@PathVariable("id") Long id) {
//        clientService.deleteClient(id);
//        return ResponseEntity.noContent().build();
//    }
//    @DeleteMapping("/{id}")
//    public ResponseEntity<?> deleteClient(@PathVariable("id") Long id) {
//        try {
//            clientService.deleteClient(id);
//            return ResponseEntity.noContent().build(); // 204 No Content
//        } catch (IllegalStateException e) {
//            return ResponseEntity.badRequest().body(e.getMessage()); // 400 Bad Request
//        }
//    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClient(@PathVariable("id") Long id) {
        try {
            clientService.deleteClient(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());  // return custom message
        }
    }


    // New endpoint: Add a job to an existing client
    @PostMapping("/{id}/jobs")
    public ResponseEntity<Client> addJobToClient(@PathVariable("id") Long clientId, @RequestBody Job job) {
        return clientService.addJobToClient(clientId, job)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
