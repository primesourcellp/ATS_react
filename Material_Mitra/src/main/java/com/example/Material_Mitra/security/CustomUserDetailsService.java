//package com.example.Material_Mitra.security; 
//import org.springframework.beans.factory.annotation.Autowired; 
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.security.core.userdetails.UserDetailsService; 
//import org.springframework.security.core.userdetails.UsernameNotFoundException; 
//import org.springframework.stereotype.Service; 
//import com.example.Material_Mitra.entity.User;
//import com.example.Material_Mitra.repository.UserRepository; 
//import com.example.Material_Mitra.security.CustomUserDetails;
//
//
//
//@Service 
//public class CustomUserDetailsService implements UserDetailsService { 
//	@Autowired 
//	private UserRepository userRepository;
//	@Override 
//	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
//		
//		User user = userRepository.findByUsername(username) .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//		return new CustomUserDetails(user); 
//		} 
//	}