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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file) {
      onUploadImage(file);
    }
    e.target.value = "";
  };

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        className={editor.isActive("bold") ? "active" : ""}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <b>B</b>
      </button>
      <button
        type="button"
        className={editor.isActive("italic") ? "active" : ""}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </button>
      <button
        type="button"
        className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>

      <span className="toolbar-divider" />

      <button
        type="button"
        className={
          editor.isActive("paragraph") && currentVariant === "default"
            ? "active"
            : ""
        }
        onClick={() => setParagraphVariant("default")}
      >
        Обычный текст
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
        Крупный лид
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
        Врезка с отступом
      </button>

      <span className="toolbar-divider" />

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

      <button
        type="button"
        disabled={isUploadingImage}
        onClick={() => inlineImageInputRef.current?.click()}
      >
        {isUploadingImage ? "Загрузка..." : "🖼 Вставить фото"}
      </button>
      <input
        ref={inlineImageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
};
