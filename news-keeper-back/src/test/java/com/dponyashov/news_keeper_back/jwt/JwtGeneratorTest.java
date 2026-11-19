//package com.dponyashov.news_keeper_back.jwt;
//
//import com.dponyashov.news_keeper_back.config.AppConfig;
//import io.jsonwebtoken.Jwts;
//import io.jsonwebtoken.io.Decoders;
//import io.jsonwebtoken.security.Keys;
//import lombok.extern.slf4j.Slf4j;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.context.properties.EnableConfigurationProperties;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.context.annotation.Configuration;
//
//import javax.crypto.SecretKey;
//import java.nio.charset.StandardCharsets;
//import java.util.Date;
//import java.util.List;
//
//@SpringBootTest(classes = JwtGeneratorTest.TestConfig.class)
//@Slf4j
//class JwtGeneratorTest {
//
//    @Configuration
//    @EnableConfigurationProperties(AppConfig.class)
//    static class TestConfig {
//    }
//
//    @Autowired
//    private AppConfig appConfig;
//
//    @Test
//    void generateDevTokens() {
//        String secret = appConfig.jwt().atSecretKey();
//
//        SecretKey key;
//        try {
//            key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
//        } catch (Exception e) {
//            key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
//        }
//
//        // 1. Токен с ролью ROLE_NEWSMAKER (на 30 дней)
//        String newsmakerToken = Jwts.builder()
//                .subject("d.ponyashov@inform-gazprom.ru")
//                .claim("roles", List.of("ROLE_USER", "ROLE_NEWSMAKER"))
//                .issuedAt(new Date())
//                .expiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 30))
//                .signWith(key)
//                .compact();
//
//        // 2. Токен обычного читателя (без ROLE_NEWSMAKER)
//        String readerToken = Jwts.builder()
//                .subject("reader@inform-gazprom.ru")
//                .claim("roles", List.of("ROLE_USER"))
//                .issuedAt(new Date())
//                .expiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 30))
//                .signWith(key)
//                .compact();
//
//        System.out.println("=== TOKEN NEWSMAKER (Редактор) ===");
//        System.out.println(newsmakerToken);
//        System.out.println("\n=== TOKEN READER (Читатель) ===");
//        System.out.println(readerToken);
//    }
//}
