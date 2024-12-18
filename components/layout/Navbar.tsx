// Add this to the imports
import { Languages } from 'lucide-react';
import { LanguageDialog } from './LanguageDialog';

// Add this to the component state
const [showLanguage, setShowLanguage] = useState(false);

// Add this to the DropdownMenuContent before Settings
<DropdownMenuItem onClick={() => setShowLanguage(true)}>
  <Languages className="mr-2 h-4 w-4" />
  Language
</DropdownMenuItem>

// Add this before the closing tag
<LanguageDialog
  open={showLanguage}
  onOpenChange={setShowLanguage}
/>