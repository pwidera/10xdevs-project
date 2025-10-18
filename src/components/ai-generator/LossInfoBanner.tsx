import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LossInfoBannerProps {
  visible?: boolean;
}

export function LossInfoBanner({ visible = true }: LossInfoBannerProps) {
  if (!visible) return null;

  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>Ważna informacja</AlertTitle>
      <AlertDescription>
        Propozycje fiszek nie są automatycznie zapisywane. Pamiętaj, aby zaakceptować i zapisać wybrane fiszki przed
        opuszczeniem strony lub wygenerowaniem nowych propozycji. Odświeżenie strony spowoduje utratę niezapisanych
        propozycji.
      </AlertDescription>
    </Alert>
  );
}
