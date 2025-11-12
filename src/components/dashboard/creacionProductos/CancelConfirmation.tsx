import { Button } from "@/components/ui/button";
import { DialogClose, DialogTitle } from "@/components/ui/dialog";

export function CancelConfirmation({
  onBack,
  onConfirm,
}: {
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="px-9 flex flex-col h-full pb-11 overflow-y-auto">
      <div>
        <DialogTitle className="text-lg font-semibold mb-2">
          ¿Cancelar la creación del producto?
        </DialogTitle>
        <p className="text-gray-600 mb-4">
          Tiene cambios sin guardar en la creación de un nuevo producto del
          catálogo.
        </p>
        <p className="text-gray-600">
          Si sale ahora, los cambios no serán guardados.
        </p>
      </div>

      <div className="flex gap-4 mt-auto">
        <Button
          variant="outline"
          className="w-1/2 border-primary text-primary shrink"
          onClick={onBack}
        >
          Volver a edición
        </Button>
        <DialogClose asChild>
          <Button className="w-1/2 bg-primary text-white shrink" onClick={onConfirm}>
            Confirmar cancelación
          </Button>
        </DialogClose>
      </div>
    </div>
  );
}
