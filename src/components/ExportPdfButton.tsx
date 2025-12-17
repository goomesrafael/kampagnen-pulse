import { useTranslation } from 'react-i18next';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ExportPdfButtonProps {
  className?: string;
}

export function ExportPdfButton({ className }: ExportPdfButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    // Simulate PDF generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: t('export.pdf'),
      description: t('export.generating'),
    });
    
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {t('export.pdf')}
    </Button>
  );
}
