package com.arcade.service;

import com.arcade.model.VendorUser;
import com.arcade.repository.VendorUserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
public class VendorUserDetailsService implements UserDetailsService {

    private final VendorUserRepository vendorUserRepository;

    public VendorUserDetailsService(VendorUserRepository vendorUserRepository) {
        this.vendorUserRepository = vendorUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        VendorUser user = vendorUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Collection<? extends GrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
        return new User(user.getUsername(), user.getPasswordHash(), authorities);
    }
}

