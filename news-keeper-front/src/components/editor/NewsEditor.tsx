import React from "react";
import { EditorContent } from "@tiptap/react";
import { useNewsEditor } from "../../hooks/useNewsEditor";
import { CoverUploader } from "./CoverUploader";
import { EditorToolbar } from "./EditorToolbar";
import "./NewsEditor.css";

interface NewsEditorProps {
  editingNewsId?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const NewsEditor: React.FC<NewsEditorProps> = ({
  editingNewsId = null,
  onSuccess,
  onCancel,
}) => {
  const {
    editor,
    title,
    setTitle,
    coverPreview,
    isLoadingData,
    isSubmitting,
    isUploadingImage,
    handleSelectCover,
    handleRemoveCover,
    handleInlineImageUpload,
    handleSubmit,
  } = useNewsEditor({ editingNewsId, onSuccess });

  if (!editor) return null;
  if (isLoadingData)
    return <div className="news-status">Загрузка данных статьи...</div>;

  return (
    <form className="news-editor-container" onSubmit={handleSubmit}>
      <h2>
        {editingNewsId !== null ? "Редактирование новости" : "Создание новости"}
      </h2>

      <div className="form-group">
        <label>Заголовок новости</label>
        <input
          type="text"
          className="title-input"
          placeholder="Введите заголовок..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <CoverUploader
        coverPreview={coverPreview}
        onSelectCover={handleSelectCover}
        onRemoveCover={handleRemoveCover}
      />

      <EditorToolbar
        editor={editor}
        isUploadingImage={isUploadingImage}
        onUploadImage={handleInlineImageUpload}
      />

      <div className="editor-content-area">
        <EditorContent editor={editor} />
      </div>

      <div className="editor-actions">
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting
            ? "Сохранение..."
            : editingNewsId !== null
              ? "Сохранить изменения"
              : "Опубликовать новость"}
        </button>

        {editingNewsId !== null && onCancel && (
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
};
