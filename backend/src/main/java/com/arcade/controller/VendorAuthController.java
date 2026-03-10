package com.arcade.controller;
import com.arcade.model.VendorUser;
import com.arcade.repository.VendorUserRepository;
import com.arcade.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/vendor/auth")
@CrossOrigin(origins = "*")
public class VendorAuthController {
    private final AuthenticationManager authenticationManager;
    private final VendorUserRepository vendorUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public VendorAuthController(AuthenticationManager authenticationManager,
                                VendorUserRepository vendorUserRepository,
                                PasswordEncoder passwordEncoder,
                                JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.vendorUserRepository = vendorUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        if (!authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String token = jwtService.generateToken(username, Map.of("role", "VENDOR"));
        return ResponseEntity.ok(Map.of("token", token));
    }

    // Simple dev-only endpoint to seed a vendor user if none exists
    @RequestMapping(path = "/seed-dev-vendor", method = {RequestMethod.POST, RequestMethod.GET})
    public ResponseEntity<Void> seedDevVendor(
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(value = "password", required = false) String passwordParam,
            @RequestParam(value = "force", defaultValue = "false") boolean force
    ) {
        String password = (body != null && body.containsKey("password"))
                ? body.get("password")
                : (passwordParam != null ? passwordParam : "password");

        if (vendorUserRepository.findByUsername("vendor").isPresent()) {
            VendorUser existing = vendorUserRepository.findByUsername("vendor").get();
            if (force) {
                existing.setPasswordHash(passwordEncoder.encode(password));
                vendorUserRepository.save(existing);
            }
            return ResponseEntity.ok().build();
        }
        
        VendorUser user = new VendorUser();
        user.setUsername("vendor");
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("VENDOR");
        vendorUserRepository.save(user);
        return ResponseEntity.ok().build();
    }
}





