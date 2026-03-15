package com.arcade.controller;

import com.arcade.model.Student;
import com.arcade.repository.StudentRepository;
import com.arcade.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/student/auth")
@CrossOrigin(origins = "*")
public class StudentAuthController {
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public StudentAuthController(StudentRepository studentRepository,
                                 PasswordEncoder passwordEncoder,
                                 JwtService jwtService) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");
        String phone = body.get("phone");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }
        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }

        if (studentRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        Student student = new Student();
        student.setEmail(email);
        student.setPasswordHash(passwordEncoder.encode(password));
        student.setName(name);
        student.setPhone(phone);
        studentRepository.save(student);

        String token = jwtService.generateToken(email, Map.of("role", "STUDENT", "userId", student.getId()));
        return ResponseEntity.ok(Map.of("token", token, "name", name));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        Student student = studentRepository.findByEmail(email).orElse(null);
        if (student == null || !passwordEncoder.matches(password, student.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        String token = jwtService.generateToken(email, Map.of("role", "STUDENT", "userId", student.getId()));
        return ResponseEntity.ok(Map.of("token", token, "name", student.getName()));
    }
}
