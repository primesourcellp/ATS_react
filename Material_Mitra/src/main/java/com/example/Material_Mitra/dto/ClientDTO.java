package com.example.Material_Mitra.dto;

public class ClientDTO {
    private Long id;
    private String client_name;
    private String address;
    private String client_number;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClientName() { return client_name; }
    public void setClientName(String clientName) { this.client_name = clientName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getClientNumber() { return client_number; }
    public void setClientNumber(String clientNumber) { this.client_number = clientNumber; }
}
