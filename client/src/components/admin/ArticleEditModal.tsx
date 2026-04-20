import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ArticleEditModalProps {
  isOpen: boolean;
  articleId: string | null;
  article: {
    id: string;
    titleEn: string;
    titlePt: string;
    excerptEn: string;
    excerptPt: string;
    categoryId: string;
  } | null;
  categories: Array<{ id: string; nameEn: string }>;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function ArticleEditModal({
  isOpen,
  article,
  categories,
  onClose,
  onSave,
}: ArticleEditModalProps) {
  const [titleEn, setTitleEn] = useState('');
  const [titlePt, setTitlePt] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptPt, setExcerptPt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (article) {
      // Populate form fields when article changes
      const populate = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const art = article as any;
        setTitleEn(art.titleEn);
        setTitlePt(art.titlePt);
        setExcerptEn(art.excerptEn);
        setExcerptPt(art.excerptPt);
        setCategoryId(art.categoryId);
      };
      populate();
    }
  }, [article]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        titleEn,
        titlePt,
        excerptEn,
        excerptPt,
        categoryId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#111] border border-[#00D4FF]/20">
        <DialogHeader>
          <DialogTitle className="text-[#00D4FF]">Edit Article</DialogTitle>
          <DialogClose className="text-gray-400 hover:text-[#00D4FF]" />
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="titleEn" className="text-sm text-gray-400">Title (EN)</label>
            <Input
              id="titleEn"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white mt-1"
            />
          </div>

          <div>
            <label htmlFor="titlePt" className="text-sm text-gray-400">Título (PT)</label>
            <Input
              id="titlePt"
              value={titlePt}
              onChange={(e) => setTitlePt(e.target.value)}
              className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white mt-1"
            />
          </div>

          <div>
            <label htmlFor="excerptEn" className="text-sm text-gray-400">Excerpt (EN)</label>
            <Input
              id="excerptEn"
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white mt-1"
              placeholder="Brief summary..."
            />
          </div>

          <div>
            <label htmlFor="excerptPt" className="text-sm text-gray-400">Resumo (PT)</label>
            <Input
              id="excerptPt"
              value={excerptPt}
              onChange={(e) => setExcerptPt(e.target.value)}
              className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white mt-1"
              placeholder="Breve resumo..."
            />
          </div>

          <div>
            <label htmlFor="category" className="text-sm text-gray-400">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category" className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#00D4FF]/20">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#00D4FF]/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
