import React, { useEffect, useState } from "react";
import { type NewsDto, type PageResponse } from "../../types/news";
import { NewsCard } from "./NewsCard";
import { Pagination } from "./Pagination";
import { authFetch } from "../../utils/api";
import { API_BASE_URL } from "../../config/apiConfig";

interface NewsListProps {
  isNewsmaker: boolean;
  onSelectNews: (id: number) => void;
  onEditNews: (id: number) => void;
}

const PAGE_SIZE = 5;

export const NewsList: React.FC<NewsListProps> = ({
  isNewsmaker,
  onSelectNews,
  onEditNews,
}) => {
  const [items, setItems] = useState<NewsDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Задержка 400 мс перед отправкой поискового запроса
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0); // Сбрасываем на первую страницу при новом поиске
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Загрузка текущей страницы с учетом поискового запроса
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      search: debouncedSearch,
      page: String(page),
      size: String(PAGE_SIZE),
    });

    authFetch(`${API_BASE_URL}/news?${params.toString()}`)
      .then((res) => res.json())
      .then((data: PageResponse<NewsDto>) => {
        setItems(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err) => console.error("Ошибка загрузки списка новостей:", err))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  const handleDeleteNews = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту новость?")) return;

    try {
      await authFetch(`${API_BASE_URL}/news/${id}`, { method: "DELETE" });
      // Если удалили последнюю новость на текущей странице — отступаем на страницу назад
      if (items.length === 1 && page > 0) {
        setPage((prev) => prev - 1);
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setTotalElements((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert("Ошибка при удалении новости");
      console.error(err);
    }
  };

  return (
    <div className="news-list-wrapper">
      {/* Панель поиска */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск по заголовку или тексту новости..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearchInput("")}
            title="Очистить поиск"
          >
            ✕
          </button>
        )}
      </div>

      {!loading && (
        <div className="news-results-meta">
          Найдено новостей: {totalElements}
        </div>
      )}

      {loading ? (
        <div className="news-status">Загрузка новостей...</div>
      ) : items.length === 0 ? (
        <div className="news-status">
          {debouncedSearch
            ? `По запросу «${debouncedSearch}» ничего не найдено.`
            : "Новостей пока нет."}
        </div>
      ) : (
        <>
          <div className="news-list">
            {items.map((item) => (
              <NewsCard
                key={item.id}
                news={item}
                isNewsmaker={isNewsmaker}
                onSelect={onSelectNews}
                onEdit={onEditNews}
                onDelete={handleDeleteNews}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
};
