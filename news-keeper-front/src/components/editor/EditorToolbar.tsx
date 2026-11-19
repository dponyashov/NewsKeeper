import React, { useRef } from "react";
import { Editor } from "@tiptap/react";
import type { ParagraphVariant } from "../../extensions/CustomParagraph";

interface EditorToolbarProps {
  editor: Editor;
  isUploadingImage: boolean;
  onUploadImage: (file: File) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isUploadingImage,
  onUploadImage,
}) => {
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const currentVariant = editor.getAttributes("paragraph").variant || "default";

  const setParagraphVariant = (variant: ParagraphVariant) => {
    editor
      .chain()
      .focus()
      .setParagraph()
      .updateAttributes("paragraph", { variant })
      .run();
  };

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Введите URL ссылки:", previousUrl);

    if (url === null) return; // Нажали «Отмена»

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file) {
      onUploadImage(file);
    }
    e.target.value = "";
  };

  return (
    <div className="editor-toolbar-wrapper">
      {/* Основной ряд инструментов */}
      <div className="editor-toolbar">
        <button
          type="button"
          className={editor.isActive("bold") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Жирный"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Курсив"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Заголовок раздела"
        >
          H2
        </button>

        <span className="toolbar-divider" />

        {/* Варианты абзацев */}
        <button
          type="button"
          className={
            editor.isActive("paragraph") && currentVariant === "default"
              ? "active"
              : ""
          }
          onClick={() => setParagraphVariant("default")}
        >
          Обычный
        </button>
        <button
          type="button"
          className={
            editor.isActive("paragraph") && currentVariant === "lead"
              ? "active"
              : ""
          }
          onClick={() => setParagraphVariant("lead")}
        >
          Лид
        </button>
        <button
          type="button"
          className={
            editor.isActive("paragraph") && currentVariant === "callout"
              ? "active"
              : ""
          }
          onClick={() => setParagraphVariant("callout")}
        >
          Врезка
        </button>

        <span className="toolbar-divider" />

        {/* Списки и цитата */}
        <button
          type="button"
          className={editor.isActive("bulletList") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Маркированный список"
        >
          • Список
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный список"
        >
          1. Список
        </button>
        <button
          type="button"
          className={editor.isActive("blockquote") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Цитата"
        >
          « Цитата »
        </button>

        <span className="toolbar-divider" />

        {/* Ссылка */}
        <button
          type="button"
          className={editor.isActive("link") ? "active" : ""}
          onClick={handleSetLink}
          title="Добавить или изменить ссылку"
        >
          🔗 Ссылка
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Убрать ссылку"
          >
            ✕
          </button>
        )}

        <span className="toolbar-divider" />

        {/* Выравнивание */}
        <button
          type="button"
          className={editor.isActive({ textAlign: "left" }) ? "active" : ""}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          Слева
        </button>
        <button
          type="button"
          className={editor.isActive({ textAlign: "center" }) ? "active" : ""}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          По центру
        </button>

        <span className="toolbar-divider" />

        {/* Вставка таблицы и картинки */}
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="Вставить таблицу 3x3"
        >
          ▦ Таблица
        </button>

        <button
          type="button"
          disabled={isUploadingImage}
          onClick={() => inlineImageInputRef.current?.click()}
        >
          {isUploadingImage ? "Загрузка..." : "🖼 Фото"}
        </button>
        <input
          ref={inlineImageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {/* Контекстная панель управления таблицей (появляется, когда курсор внутри таблицы) */}
      {editor.isActive("table") && (
        <div className="table-controls-bar">
          <span>Таблица:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            + Столбец
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            − Столбец
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            + Строка
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            − Строка
          </button>
          <button
            type="button"
            className="table-delete-btn"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Удалить таблицу
          </button>
        </div>
      )}
    </div>
  );
};
