"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { useUploadCard } from "@/lib/queries/cards";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";

const CONDITIONS = [
  { value: "mint", label: "Mint" },
  { value: "near_mint", label: "Near Mint" },
  { value: "excellent", label: "Excelente" },
  { value: "good", label: "Boa" },
  { value: "played", label: "Jogada" },
  { value: "poor", label: "Ruim" },
];

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const uploadCard = useUploadCard();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [setName_field, setSetName] = useState("");
  const [condition, setCondition] = useState("near_mint");
  const [priceStr, setPriceStr] = useState("");
  const [description, setDescription] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, 4); // max 4 images
    setFiles((prev) => [...prev, ...newFiles].slice(0, 4));
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string].slice(0, 4));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 4,
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Adicione pelo menos uma imagem da carta");
      return;
    }
    if (!priceStr || parseFloat(priceStr) <= 0) {
      setError("Informe um preço válido");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload images with compression
      const imageUrls: string[] = [];
      for (const file of files) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });

        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("card-images")
          .upload(fileName, compressed);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("card-images").getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      await uploadCard.mutateAsync({
        name,
        set_name: setName_field,
        condition,
        price_cents: Math.round(parseFloat(priceStr) * 100),
        description: description || undefined,
        image_urls: imageUrls,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/marketplace");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao enviar carta";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-400 mb-4" />
        <h2 className="text-2xl font-black mb-2">Carta enviada!</h2>
        <p className="text-muted-foreground">
          Sua carta será verificada pelo admin e ficará disponível em breve.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Redirecionando para o marketplace...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Upload className="h-5 w-5 text-yellow-400" />
          <h1 className="text-2xl font-black">Anunciar Carta</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Preencha os detalhes e adicione fotos da carta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Image dropzone */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Fotos da Carta{" "}
            <span className="text-muted-foreground">(máx. 4)</span>
          </label>

          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-border/50 hover:border-border hover:bg-muted/20"
            }`}
            id="dropzone"
          >
            <input {...getInputProps()} />
            <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">
              {isDragActive
                ? "Solte as imagens aqui"
                : "Arraste imagens ou clique para selecionar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP — frente, verso, detalhes
            </p>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {previews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative h-20 w-20 rounded-lg overflow-hidden border border-border/50"
                >
                  <Image
                    src={src}
                    alt={`Preview ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Nome da Carta
            </label>
            <input
              id="card-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Charizard Base Set"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Coleção</label>
            <input
              id="card-set"
              type="text"
              value={setName_field}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="Ex: Base Set"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Condição</label>
            <select
              id="card-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="input-field"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value} className="bg-card">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Preço (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <input
                id="card-price"
                type="number"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="0,00"
                min="0.01"
                step="0.01"
                className="input-field pl-9"
                required
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Descrição{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o estado da carta, detalhes especiais..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 text-xs text-muted-foreground">
          <span className="text-yellow-400 font-medium">ℹ️ Aviso:</span> Sua carta
          passará por verificação do admin antes de aparecer no marketplace.
        </div>

        <button
          type="submit"
          disabled={uploading || uploadCard.isPending}
          className="btn-primary w-full py-3"
          id="submit-card-btn"
        >
          {uploading || uploadCard.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Anunciar Carta
            </>
          )}
        </button>
      </form>
    </div>
  );
}
