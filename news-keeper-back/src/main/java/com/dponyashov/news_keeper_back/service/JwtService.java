package com.dponyashov.news_keeper_back.service;

import io.jsonwebtoken.Claims;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public interface JwtService {
    Claims extractAllClaims(String token);

    String extractUsername(Claims claims);

    @SuppressWarnings("unchecked")
    List<SimpleGrantedAuthority> extractAuthorities(Claims claims);
}
