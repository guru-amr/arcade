package com.arcade.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.security.MessageDigest;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${arcade.jwt-secret}")
    private String secret;

    @Value("${arcade.jwt-expiration-ms}")
    private long expirationMs;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(String username, Map<String, Object> extraClaims) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, String username) {
        final String extracted = extractUsername(token);
        return extracted.equals(username) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        // Accept either base64-encoded secrets (recommended) or raw strings (dev-friendly).
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (Exception ex) {
            keyBytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }

        // JJWT requires >= 256-bit key for HS256. If user provides a short secret (common in dev),
        // derive a 32-byte key deterministically via SHA-256.
        if (keyBytes.length < 32) {
            try {
                keyBytes = MessageDigest.getInstance("SHA-256").digest(keyBytes);
            } catch (Exception e) {
                throw new IllegalStateException("Unable to derive JWT signing key", e);
            }
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }
}

