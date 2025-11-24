package com.example.Material_Mitra.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Material_Mitra.entity.Client;
import com.example.Material_Mitra.entity.ClientRecruiterPermission;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.RoleStatus;
import com.example.Material_Mitra.repository.ClientRecruiterPermissionRepository;
import com.example.Material_Mitra.repository.ClientRepository;
import com.example.Material_Mitra.repository.UserRepository;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ClientRecruiterPermissionRepository permissionRepository;

    public ClientService(ClientRepository clientRepository,
                         UserRepository userRepository,
                         ClientRecruiterPermissionRepository permissionRepository) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
    }

    /////////priority 
    public List<Client> getClientsByNamePriority(String name) {
        return clientRepository.searchClientsByKeyword(name);
    }

    @Transactional
    public Client saveClientWithJobs(Client client) {
        if (client.getJobs() != null) {
            client.getJobs().forEach(job -> job.setClient(client));
        }
        return clientRepository.save(client);
    }
    
    /**
     * Used by normal clients listing.
     * Applies recruiter restriction flag "restrictClients".
     */
    public List<Client> getClientsForCurrentUser() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return clientRepository.findAll();
        }

        RoleStatus role = currentUser.getRole();
        if (role == RoleStatus.ADMIN || role == RoleStatus.SECONDARY_ADMIN) {
            return clientRepository.findAll();
        }

        // Recruiter / sub-user
        if (!currentUser.isRestrictClients()) {
            return clientRepository.findAll();
        }

        // Restricted: only clients explicitly assigned to this recruiter
        return clientRepository.findByAssignedRecruiterId(currentUser.getId());
    }

    /**
     * Used by Account Manager (ADMIN only) to fetch all clients without restriction.
     */
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }
    
    public Optional<Client> getClientById(Long id) {
        return clientRepository.findById(id);
    }
    
    @Transactional
    public Client updateClient(Client client) {
        Client existing = clientRepository.findById(client.getId())
                .orElseThrow(() -> new IllegalStateException("Client not found"));

        User currentUser = getCurrentUser();
        if (!canEditOrDeleteClient(existing, currentUser)) {
            throw new IllegalStateException("You do not have permission to update this client.");
        }

        if (client.getJobs() != null) {
            client.getJobs().forEach(job -> job.setClient(client));
        }
        // Preserve permissions; this method does not change per-client permissions
        client.setPermissions(existing.getPermissions());
        return clientRepository.save(client);
    }

    @Transactional
    public void deleteClient(Long clientId) {
        clientRepository.findById(clientId).ifPresent(client -> {
            User currentUser = getCurrentUser();
            if (!canEditOrDeleteClient(client, currentUser)) {
                throw new IllegalStateException("You do not have permission to delete this client.");
            }

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

    /**
     * Assign/update per-client permissions for recruiters from Account Manager.
     */
    @Transactional
    public Client updateClientPermissions(Long clientId, List<ClientPermissionRequest> permissions) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalStateException("Client not found"));

        // Clear existing permissions and rebuild from request
        Set<ClientRecruiterPermission> newPermissions = new HashSet<>();
        // Track recruiters whose permissions we touch so we can recompute their global restriction flags
        Set<Long> touchedRecruiterIds = new HashSet<>();
        if (permissions != null) {
            for (ClientPermissionRequest req : permissions) {
                User recruiter = userRepository.findById(req.getRecruiterId())
                        .orElse(null);
                if (recruiter == null) {
                    continue;
                }

                // Skip rows where all flags are false (no access at all)
                if (!req.isCanViewClient() && !req.isCanViewJobs()
                        && !req.isCanViewCandidates() && !req.isCanViewInterviews()) {
                    continue;
                }

                ClientRecruiterPermission perm = new ClientRecruiterPermission();
                perm.setClient(client);
                perm.setRecruiter(recruiter);
                perm.setCanViewClient(req.isCanViewClient());
                perm.setCanViewJobs(req.isCanViewJobs());
                perm.setCanViewCandidates(req.isCanViewCandidates());
                perm.setCanViewInterviews(req.isCanViewInterviews());
                newPermissions.add(perm);
                touchedRecruiterIds.add(recruiter.getId());
            }
        }

        // Replace client's permissions set
        client.getPermissions().clear();
        client.getPermissions().addAll(newPermissions);
        Client saved = clientRepository.save(client);

        // Also persist via repository to ensure orphans are removed
        permissionRepository.deleteAll(permissionRepository.findByClient_Id(clientId));
        permissionRepository.saveAll(newPermissions);

        // Recompute global restriction flags on each affected recruiter
        for (Long recruiterId : touchedRecruiterIds) {
            recomputeUserRestrictions(recruiterId);
        }

        return saved;
    }

    /**
     * Recalculate a recruiter's global restriction flags based on all of their
     * per-client permissions. This keeps User.restrictClients / restrictJobs /
     * restrictCandidates in sync so list pages (clients/jobs/candidates) behave
     * correctly without a separate settings UI.
     */
    private void recomputeUserRestrictions(Long recruiterId) {
        userRepository.findById(recruiterId).ifPresent(user -> {
            var perms = permissionRepository.findByRecruiter_Id(recruiterId);
            boolean hasClient = perms.stream().anyMatch(ClientRecruiterPermission::isCanViewClient);
            boolean hasJobs = perms.stream().anyMatch(ClientRecruiterPermission::isCanViewJobs);
            boolean hasCandidates = perms.stream().anyMatch(ClientRecruiterPermission::isCanViewCandidates);
            boolean hasInterviews = perms.stream().anyMatch(ClientRecruiterPermission::isCanViewInterviews);

            user.setRestrictClients(hasClient);
            user.setRestrictJobs(hasJobs);
            user.setRestrictCandidates(hasCandidates);
            user.setRestrictInterviews(hasInterviews);
            userRepository.save(user);
        });
    }

    public List<User> getAllRecruiters() {
        return userRepository.findByRole(RoleStatus.RECRUITER);
    }

    public List<Client> getUnassignedClients() {
        return clientRepository.findUnassignedClients();
    }

    public boolean canCurrentUserEdit(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalStateException("Client not found"));
        return canEditOrDeleteClient(client, getCurrentUser());
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        String username = auth.getName();
        return userRepository.findByUsername(username).orElse(null);
    }

    /**
     * Permission rule for edit/delete:
     * - Admin / Secondary admin: always allowed
     * - If client has NO permissions rows: any recruiter can edit/delete
     * - If client has permissions rows: only recruiters with canViewClient=true can edit/delete
     */
    private boolean canEditOrDeleteClient(Client client, User user) {
        if (user == null) {
            return false;
        }
        RoleStatus role = user.getRole();
        if (role == RoleStatus.ADMIN || role == RoleStatus.SECONDARY_ADMIN) {
            return true;
        }

        if (client.getPermissions() == null || client.getPermissions().isEmpty()) {
            // No explicit assignment -> any recruiter can edit/delete
            return role == RoleStatus.RECRUITER || role == RoleStatus.SUB_USER;
        }

        // Client has permissions -> only recruiters with canViewClient true can edit/delete
        return client.getPermissions().stream()
                .anyMatch(p -> p.getRecruiter() != null &&
                               p.getRecruiter().getId().equals(user.getId()) &&
                               p.isCanViewClient());
    }

    /**
     * Simple DTO used by controller to receive per-client permissions.
     */
    public static class ClientPermissionRequest {
        private Long recruiterId;
        private boolean canViewClient;
        private boolean canViewJobs;
        private boolean canViewCandidates;
        private boolean canViewInterviews;

        public Long getRecruiterId() {
            return recruiterId;
        }

        public void setRecruiterId(Long recruiterId) {
            this.recruiterId = recruiterId;
        }

        public boolean isCanViewClient() {
            return canViewClient;
        }

        public void setCanViewClient(boolean canViewClient) {
            this.canViewClient = canViewClient;
        }

        public boolean isCanViewJobs() {
            return canViewJobs;
        }

        public void setCanViewJobs(boolean canViewJobs) {
            this.canViewJobs = canViewJobs;
        }

        public boolean isCanViewCandidates() {
            return canViewCandidates;
        }

        public void setCanViewCandidates(boolean canViewCandidates) {
            this.canViewCandidates = canViewCandidates;
        }

        public boolean isCanViewInterviews() {
            return canViewInterviews;
        }

        public void setCanViewInterviews(boolean canViewInterviews) {
            this.canViewInterviews = canViewInterviews;
        }
    }
}
