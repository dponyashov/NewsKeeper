package com.dponyashov.news_keeper_back.repository;

import com.dponyashov.news_keeper_back.entity.NewsEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NewsRepository extends JpaRepository<NewsEntity, Long> {

    Page<NewsEntity> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query(
            value = """
            SELECT * FROM t_news n
            WHERE (:query IS NULL OR :query = ''
                   OR n.title ILIKE CONCAT('%', :query, '%')
                   OR CAST(n.content AS TEXT) ILIKE CONCAT('%', :query, '%'))
            """,
            countQuery = """
            SELECT COUNT(*) FROM t_news n
            WHERE (:query IS NULL OR :query = ''
                   OR n.title ILIKE CONCAT('%', :query, '%')
                   OR CAST(n.content AS TEXT) ILIKE CONCAT('%', :query, '%'))
            """,
            nativeQuery = true
    )
    Page<NewsEntity> searchNews(@Param("query") String query, Pageable pageable);
}
