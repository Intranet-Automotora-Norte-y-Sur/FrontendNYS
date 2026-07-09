import Image from '@tiptap/extension-image';

/** Imagen con tamaño ajustable: chica (25%), media (50%) o grande (100%). */
const ImagenAjustable = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: 'img-grande',
        parseHTML: (elemento) => elemento.getAttribute('class') ?? 'img-grande',
        renderHTML: (attrs) => ({ class: attrs.class }),
      },
    };
  },
});
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { tokenStore } from '../../lib/api';

interface Props {
  html: string;
  onChange: (html: string) => void;
}

function BotonBarra({
  activo,
  onClick,
  children,
  etiqueta,
}: {
  activo?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  etiqueta: string;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      aria-pressed={activo}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded px-2 py-1 text-sm font-semibold transition-colors duration-150 ${
        activo ? 'bg-brand text-white' : 'text-body hover:bg-surface'
      }`}
    >
      {children}
    </button>
  );
}

function Barra({ editor }: { editor: Editor }) {
  const inputImagen = useRef<HTMLInputElement>(null);

  const subirImagen = async (archivo: File) => {
    const datos = new FormData();
    datos.append('imagen', archivo);
    const resp = await fetch('/api/contenido/imagenes/', {
      method: 'POST',
      body: datos,
      credentials: 'include',
      headers: { Authorization: `Bearer ${tokenStore.get()}` },
    });
    if (resp.ok) {
      const { url } = (await resp.json()) as { url: string };
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const ponerEnlace = () => {
    const url = window.prompt('URL del enlace (https://…):');
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (!/^https?:\/\//.test(url)) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div role="toolbar" aria-label="Formato" className="flex flex-wrap gap-1 border-b border-line bg-white p-2">
      <BotonBarra etiqueta="Negrita" activo={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></BotonBarra>
      <BotonBarra etiqueta="Cursiva" activo={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></BotonBarra>
      <BotonBarra etiqueta="Título" activo={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</BotonBarra>
      <BotonBarra etiqueta="Subtítulo" activo={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</BotonBarra>
      <BotonBarra etiqueta="Lista con viñetas" activo={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lista</BotonBarra>
      <BotonBarra etiqueta="Lista numerada" activo={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Lista</BotonBarra>
      <BotonBarra etiqueta="Cita" activo={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>“ Cita</BotonBarra>
      <BotonBarra etiqueta="Enlace" activo={editor.isActive('link')} onClick={ponerEnlace}>🔗 Enlace</BotonBarra>
      <BotonBarra etiqueta="Insertar imagen" onClick={() => inputImagen.current?.click()}>🖼 Imagen</BotonBarra>
      {editor.isActive('image') && (
        <span className="ml-1 flex items-center gap-1 rounded bg-surface px-1.5">
          <span className="text-xs text-muted">Tamaño:</span>
          {([['img-chica', 'S'], ['img-media', 'M'], ['img-grande', 'L']] as const).map(([clase, letra]) => (
            <BotonBarra
              key={clase}
              etiqueta={`Imagen tamaño ${letra}`}
              activo={editor.isActive('image', { class: clase })}
              onClick={() => editor.chain().focus().updateAttributes('image', { class: clase }).run()}
            >
              {letra}
            </BotonBarra>
          ))}
        </span>
      )}
      <input
        ref={inputImagen}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) void subirImagen(archivo);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function EditorContenido({ html, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, protocols: ['http', 'https'] }),
      ImagenAjustable,
    ],
    content: html,
    onUpdate: ({ editor: instancia }) => onChange(instancia.getHTML()),
  });

  // Sincroniza cuando se cambia de contenido a editar
  useEffect(() => {
    if (editor && html !== editor.getHTML()) {
      editor.commands.setContent(html);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <Barra editor={editor} />
      <EditorContent editor={editor} className="prosa min-h-52 bg-white p-4 [&_.ProseMirror]:outline-none" />
    </div>
  );
}
