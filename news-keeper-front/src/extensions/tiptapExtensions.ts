import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CustomParagraph } from "./CustomParagraph";

export const getSharedTipTapExtensions = () => [
  StarterKit.configure({
    paragraph: false,
  }),
  CustomParagraph,
  Image.configure({
    HTMLAttributes: {
      class: "news-inline-image",
    },
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Link.configure({
    openOnClick: false, // В редакторе клик выделяет ссылку, а не уводит со страницы
    HTMLAttributes: {
      class: "news-link",
      target: "_blank",
      rel: "noopener noreferrer",
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "news-table",
    },
  }),
  TableRow,
  TableHeader,
  TableCell,
];
